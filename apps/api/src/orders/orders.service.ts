import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { isUniqueViolation } from '../common/idempotency.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CancelOrderDto } from './dto/cancel-order.dto.js';
import type { CreateOrderDto } from './dto/create-order.dto.js';
import { assertTransition } from './order-status.js';
import { unitPrice } from './pricing.js';
import { assertPromotionUsable, discountFor } from './promotion.js';

const SUMMARY = {
  id: true,
  status: true,
  total: true,
  discountAmount: true,
  promotion: { select: { code: true } },
} as const;

const STALE_ORDER = 'Đơn vừa được cập nhật bởi yêu cầu khác, vui lòng tải lại';

export type CancelActor = { kind: 'customer'; phone: string } | { kind: 'cashier' };

const toSummary =<T extends { promotion: { code: string } | null }>({ promotion, ...order }: T) => ({
  ...order,
  promoCode: promotion?.code ?? null,
});

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userPhone: string, dto: CreateOrderDto, idempotencyKey?: string) {
    const findExisting = async () => {
      const existing = await this.prisma.order.findUnique({
        where: { userPhone_idempotencyKey: { userPhone, idempotencyKey: idempotencyKey! } },
        select: SUMMARY,
      });
      return existing && toSummary(existing);
    };
    if (idempotencyKey) {
      const existing = await findExisting();
      if (existing) return existing;
    }

    const ids = [...new Set(dto.items.map((i) => i.productId))];
    // Món của danh mục đang ẩn coi như không tồn tại
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids }, category: { isActive: true } },
    });
    const productById = new Map(products.map((p) => [p.id, p]));
    const missing = ids.filter((id) => !productById.has(id));
    if (missing.length) {
      throw new BadRequestException(
        `Sản phẩm không tồn tại: ${missing.join(', ')}`,
      );
    }

    const unavailable = products.filter((p) => !p.isAvailable);
    if (unavailable.length) {
      throw new ConflictException(
        `Món trong giỏ đã hết hàng: ${unavailable.map((p) => p.name).join(', ')}`,
      );
    }

    // Bảng giá lấy từ CSDL lúc đặt: đổi giá chỉ ảnh hưởng đơn tạo sau đó
    const toppingCodes = [...new Set(dto.items.flatMap((i) => i.toppings ?? []))];
    const [sizeRows, toppingRows] = await Promise.all([
      this.prisma.sizeSurcharge.findMany(),
      toppingCodes.length
        ? this.prisma.topping.findMany({ where: { code: { in: toppingCodes }, isActive: true } })
        : [],
    ]);
    const extraBySize = new Map(sizeRows.map((s) => [s.size, s.extra]));
    const priceByTopping = new Map(toppingRows.map((t) => [t.code, t.price]));
    const unknownToppings = toppingCodes.filter((c) => !priceByTopping.has(c));
    if (unknownToppings.length) {
      throw new BadRequestException(
        `Topping không tồn tại hoặc đã ngừng bán: ${unknownToppings.join(', ')}`,
      );
    }

    const items = dto.items.map((i) => {
      const sizeExtra = extraBySize.get(i.size);
      if (sizeExtra === undefined) {
        throw new InternalServerErrorException(`Chưa cấu hình phụ thu cho size ${i.size}`);
      }
      const toppings = i.toppings ?? [];
      return {
        productId: i.productId,
        quantity: i.quantity,
        size: i.size,
        toppings,
        unitPrice: unitPrice(
          productById.get(i.productId)!.price,
          sizeExtra,
          toppings.map((t) => priceByTopping.get(t)!),
        ),
      };
    });
    const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

    const promo = dto.promoCode
      ? await this.prisma.promotion.findUnique({
          where: { code: dto.promoCode.toUpperCase() },
        })
      : null;
    if (dto.promoCode) {
      if (!promo) throw new BadRequestException('Mã giảm giá không tồn tại hoặc đã bị vô hiệu');
      assertPromotionUsable(promo, subtotal);
    }
    const discountAmount = promo ? discountFor(promo, subtotal) : 0;

    const data = {
      id: `ord_${randomBytes(5).toString('hex')}`,
      userPhone,
      idempotencyKey,
      total: subtotal - discountAmount,
      discountAmount,
      promotionId: promo?.id,
      items: { create: items },
    };

    try {
      if (!promo) {
        return toSummary(await this.prisma.order.create({ data, select: SUMMARY }));
      }
      // Giữ lượt dùng cùng transaction với việc tạo đơn: hai khách tranh lượt cuối chỉ một người được,
      // và lỗi trùng Idempotency-Key làm hoàn tác luôn việc giữ lượt
      return toSummary(
        await this.prisma.$transaction(async (tx) => {
          const reserved = await tx.promotion.updateMany({
            where: {
              id: promo.id,
              ...(promo.maxUses !== null && { usedCount: { lt: promo.maxUses } }),
            },
            data: { usedCount: { increment: 1 } },
          });
          if (reserved.count === 0) {
            throw new ConflictException('Mã giảm giá đã hết lượt sử dụng');
          }
          return tx.order.create({ data, select: SUMMARY });
        }),
      );
    } catch (e) {
      // Hai yêu cầu cùng key đến cùng lúc: yêu cầu thua trả lại đơn của yêu cầu thắng
      if (idempotencyKey && isUniqueViolation(e)) {
        const existing = await findExisting();
        if (existing) return existing;
      }
      throw e;
    }
  }

  // Khách hủy đơn của mình; Cashier hủy đơn PAID của bất kỳ khách nào
  async cancel(id: string, dto: CancelOrderDto, actor: CancelActor) {
    // Đơn của người khác cũng báo 404 để không lộ đơn có tồn tại
    const order = await this.prisma.order.findFirst({
      where: { id, ...(actor.kind === 'customer' && { userPhone: actor.phone }) },
      select: { status: true, version: true, userPhone: true, promotionId: true },
    });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    // Kiểm tra version trước để client cũ nhận đúng lý do (đơn đã bị đổi), rồi mới xét trạng thái
    if (order.version !== dto.version) throw new ConflictException(STALE_ORDER);
    assertTransition(order.status, 'CANCELLED');
    if (actor.kind === 'cashier' && order.status !== 'PAID') {
      throw new ForbiddenException('Quầy chỉ hủy được đơn đã thanh toán');
    }

    const paid = order.status === 'PAID';
    const reason = dto.reason?.trim() || null;
    if (paid && !reason) {
      throw new BadRequestException('Cần ghi lý do khi hủy đơn đã thanh toán');
    }
    // Hoàn tiền mô phỏng: chỉ ghi thời điểm, không có giao dịch hoàn tiền thật
    const refundedAt = paid ? new Date() : null;

    await this.prisma.$transaction(async (tx) => {
      // Khóa lạc quan: Barista bấm PREPARING cùng lúc thì chỉ một bên ghi được
      const updated = await tx.order.updateMany({
        where: { id, version: dto.version, status: order.status },
        data: {
          status: 'CANCELLED',
          version: { increment: 1 },
          cancelReason: reason,
          refundedAt,
        },
      });
      if (updated.count === 0) throw new ConflictException(STALE_ORDER);

      if (paid) {
        const payment = await tx.payment.findFirst({
          where: { orderId: id, status: 'SUCCESS' },
          select: { pointsEarned: true },
        });
        if (payment?.pointsEarned) {
          await tx.user.update({
            where: { phone: order.userPhone },
            data: { loyaltyPoints: { decrement: payment.pointsEarned } },
          });
        }
      }
      if (order.promotionId !== null) {
        await tx.promotion.updateMany({
          where: { id: order.promotionId, usedCount: { gt: 0 } },
          data: { usedCount: { decrement: 1 } },
        });
      }
    });
    return { id, status: 'CANCELLED' as const, version: dto.version + 1, refundedAt };
  }

  async findMine(userPhone: string) {
    const orders = await this.prisma.order.findMany({
      where: { userPhone },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        version: true,
        cancelReason: true,
        refundedAt: true,
        total: true,
        discountAmount: true,
        promotion: { select: { code: true } },
        pickupCode: true,
        review: { select: { stars: true, comment: true } },
        createdAt: true,
        items: {
          orderBy: { id: 'asc' },
          select: {
            productId: true,
            quantity: true,
            size: true,
            toppings: true,
            unitPrice: true,
            product: { select: { name: true } },
          },
        },
      },
    });
    return orders.map(({ items, ...order }) => ({
      ...toSummary(order),
      items: items.map(({ product, ...item }) => ({
        ...item,
        productName: product.name,
      })),
    }));
  }
}
