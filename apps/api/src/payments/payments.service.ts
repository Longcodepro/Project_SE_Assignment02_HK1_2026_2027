/**
 * PaymentsService: Nghiệp vụ xử lý giao dịch thanh toán.
 *
 * Quy trình xử lý:
 * 1. Kiểm tra chính chủ: userPhone phải khớp với người tạo đơn.
 * 2. Kiểm tra Idempotency: nếu key đã được xử lý, trả lại kết quả cũ ngay.
 * 3. Kiểm tra máy trạng thái: đơn phải ở trạng thái có thể chuyển sang PAID (PENDING hoặc PAYMENT_FAILED).
 * 4. Gọi cổng thanh toán mô phỏng (Mock Gateway).
 * 5. Mở Transaction CSDL:
 *    - Khóa lạc quan: update `version = version + 1`.
 *    - Trừ nguyên liệu thật trong kho (Deduct stock). Nếu thiếu thì rollback toàn bộ.
 *    - Tích điểm loyalty (1 điểm / 1.000đ).
 *    - Lưu lịch sử bản ghi Payment (SUCCESS hoặc FAILED).
 */

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUniqueViolation } from '../common/idempotency.js';
import type { Order } from '../generated/prisma/client.js';
import { deductStock, loadNeeds, OutOfStockError } from '../inventory/stock.js';
import { assertTransition, canTransition } from '../orders/order-status.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { pointsFor } from './loyalty.js';
import type { CreatePaymentDto } from './dto/create-payment.dto.js';
import { MockPaymentGateway } from './mock-gateway.js';

type PaymentRow = {
  id: number;
  orderId: string;
  method: string;
  amount: number;
  status: string;
  failureReason: string | null;
  pointsEarned: number;
};

// Chuẩn hóa định dạng trả về cho Frontend
const toResponse = (p: PaymentRow) => ({
  paymentId: p.id,
  orderId: p.orderId,
  method: p.method,
  amount: p.amount,
  status: p.status === 'SUCCESS' ? 'PAID' : 'PAYMENT_FAILED',
  pointsEarned: p.pointsEarned,
  reason: p.failureReason ?? undefined,
});

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: MockPaymentGateway,
  ) {}

  async pay(userPhone: string, dto: CreatePaymentDto, idempotencyKey?: string) {
    // 1. Kiểm tra quyền sở hữu đơn hàng (đơn của người khác báo 404 để chống dò ID đơn)
    const order = await this.prisma.order.findFirst({
      where: { id: dto.orderId, userPhone },
    });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    // 2. Chống thanh toán trùng lặp (Idempotency): trả lại kết quả cũ nếu đã thanh toán bằng key này
    const findExisting = () =>
      this.prisma.payment.findUnique({
        where: {
          orderId_idempotencyKey: { orderId: order.id, idempotencyKey: idempotencyKey! },
        },
      });
    if (idempotencyKey) {
      const existing = await findExisting();
      if (existing) return toResponse(existing);
    }

    // 3. Kiểm tra máy trạng thái: đơn đã COMPLETED hoặc CANCELLED thì không cho thanh toán
    if (!canTransition(order.status, 'PAID')) {
      throw new ConflictException(
        `Đơn đang ở trạng thái ${order.status}, không thể thanh toán`,
      );
    }

    // 4. Gọi cổng thanh toán (Thẻ hoặc Ví)
    const charge = this.gateway.charge({
      method: dto.method,
      amount: order.total,
      cardNumber: dto.cardNumber,
    });

    try {
      try {
        return toResponse(await this.record(order, userPhone, dto, idempotencyKey, charge));
      } catch (e) {
        // Nếu kho hết nguyên liệu giữa chừng -> ghi nhận thất bại, không thu tiền
        if (!(e instanceof OutOfStockError)) throw e;
        return toResponse(
          await this.record(order, userPhone, dto, idempotencyKey, { ok: false, reason: e.message }),
        );
      }
    } catch (e) {
      // Xử lý race condition khi 2 request cùng key gửi đến song song
      if (idempotencyKey && (isUniqueViolation(e) || e instanceof ConflictException)) {
        const existing = await findExisting();
        if (existing) return toResponse(existing);
      }
      throw e;
    }
  }

  /**
   * Ghi nhận giao dịch thanh toán trong Database Transaction
   */
  private record(
    order: Order,
    userPhone: string,
    dto: CreatePaymentDto,
    idempotencyKey: string | undefined,
    result: { ok: boolean; reason?: string },
  ) {
    const orderStatus = result.ok ? 'PAID' : 'PAYMENT_FAILED';
    const changesStatus = orderStatus !== order.status;
    if (changesStatus) assertTransition(order.status, orderStatus);

    // Tính điểm thưởng tích lũy (chỉ khi thanh toán thành công)
    const pointsEarned = result.ok ? pointsFor(order.total) : 0;

    return this.prisma.$transaction(async (tx) => {
      // Khóa lạc quan: tăng version để ngăn các giao dịch đồng thời can thiệp đè lên nhau
      const updated = await tx.order.updateMany({
        where: { id: order.id, version: order.version },
        data: changesStatus
          ? { status: orderStatus, version: { increment: 1 } }
          : { version: { increment: 1 } },
      });
      if (updated.count === 0) {
        throw new ConflictException(
          'Đơn vừa được cập nhật bởi yêu cầu khác, vui lòng thử lại',
        );
      }

      // Khi thanh toán thành công: thực hiện trừ kho thật
      if (result.ok) {
        const items = await tx.orderItem.findMany({
          where: { orderId: order.id },
          select: { productId: true, size: true, quantity: true, toppings: true },
        });
        await deductStock(tx, order.id, await loadNeeds(tx, items));
      }

      // Cộng điểm thưởng tích lũy vào tài khoản khách hàng
      if (pointsEarned > 0) {
        await tx.user.update({
          where: { phone: userPhone },
          data: { loyaltyPoints: { increment: pointsEarned } },
        });
      }

      // Lưu lịch sử thanh toán vào bảng Payment
      return tx.payment.create({
        data: {
          orderId: order.id,
          method: dto.method,
          status: result.ok ? 'SUCCESS' : 'FAILED',
          amount: order.total,
          failureReason: result.reason,
          pointsEarned,
          idempotencyKey,
        },
      });
    });
  }
}
