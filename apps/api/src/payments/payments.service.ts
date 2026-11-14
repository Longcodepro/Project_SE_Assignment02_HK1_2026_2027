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

// Dạng trả về cho client; lần gửi lại cùng Idempotency-Key cũng đi qua hàm này
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
    // Đơn của người khác cũng báo 404 để không lộ đơn có tồn tại
    const order = await this.prisma.order.findFirst({
      where: { id: dto.orderId, userPhone },
    });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    const findExisting = () =>
      this.prisma.payment.findUnique({
        where: {
          orderId_idempotencyKey: { orderId: order.id, idempotencyKey: idempotencyKey! },
        },
      });
    // Phải kiểm tra trước khi xét trạng thái đơn: gửi lại sau khi đơn đã PAID
    // vẫn phải nhận kết quả cũ, không phải 409
    if (idempotencyKey) {
      const existing = await findExisting();
      if (existing) return toResponse(existing);
    }

    if (!canTransition(order.status, 'PAID')) {
      throw new ConflictException(
        `Đơn đang ở trạng thái ${order.status}, không thể thanh toán`,
      );
    }

    const charge = this.gateway.charge({
      method: dto.method,
      amount: order.total,
      cardNumber: dto.cardNumber,
    });

    try {
      try {
        return toResponse(await this.record(order, userPhone, dto, idempotencyKey, charge));
      } catch (e) {
        if (!(e instanceof OutOfStockError)) throw e;
        // Thiếu nguyên liệu: transaction đã hoàn tác (đơn chưa PAID, chưa trừ kho, chưa cộng điểm);
        // ghi nhận thanh toán thất bại, không thu tiền, để thanh toán lại sau khi nhập kho
        return toResponse(
          await this.record(order, userPhone, dto, idempotencyKey, { ok: false, reason: e.message }),
        );
      }
    } catch (e) {
      // Hai yêu cầu cùng key đến cùng lúc: yêu cầu thua trả lại kết quả của yêu cầu thắng
      if (idempotencyKey && (isUniqueViolation(e) || e instanceof ConflictException)) {
        const existing = await findExisting();
        if (existing) return toResponse(existing);
      }
      throw e;
    }
  }

  // Ghi một lần thanh toán và các hệ quả của nó trong một transaction
  private record(
    order: Order,
    userPhone: string,
    dto: CreatePaymentDto,
    idempotencyKey: string | undefined,
    result: { ok: boolean; reason?: string },
  ) {
    const orderStatus = result.ok ? 'PAID' : 'PAYMENT_FAILED';
    // Thử lại mà vẫn lỗi: chỉ ghi thêm một lần thanh toán, đơn giữ nguyên trạng thái
    const changesStatus = orderStatus !== order.status;
    if (changesStatus) assertTransition(order.status, orderStatus);

    // Chỉ tích điểm khi thanh toán thành công
    const pointsEarned = result.ok ? pointsFor(order.total) : 0;

    return this.prisma.$transaction(async (tx) => {
      // Khoá lạc quan: chỉ ghi khi đơn chưa bị yêu cầu khác sửa kể từ lúc đọc.
      // Lần thử lại thất bại không đổi trạng thái vẫn tăng version để các lần
      // thanh toán đồng thời trên cùng một đơn không lọt qua nhau.
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
      // Trừ kho có điều kiện cũng trong transaction này: thiếu thì ném OutOfStockError và hoàn tác tất cả
      if (result.ok) {
        const items = await tx.orderItem.findMany({
          where: { orderId: order.id },
          select: { productId: true, size: true, quantity: true, toppings: true },
        });
        await deductStock(tx, order.id, await loadNeeds(tx, items));
      }
      // Cộng điểm cùng transaction với việc đổi đơn sang PAID nên không bao giờ lệch nhau
      if (pointsEarned > 0) {
        await tx.user.update({
          where: { phone: userPhone },
          data: { loyaltyPoints: { increment: pointsEarned } },
        });
      }
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
