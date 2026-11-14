import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { isUniqueViolation } from '../common/idempotency.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateOrderDto } from './dto/create-order.dto.js';
import { unitPrice } from './pricing.js';
import { assertPromotionUsable, discountFor } from './promotion.js';

const SUMMARY = {
  id: true,
  status: true,
  total: true,
  discountAmount: true,
  promotion: { select: { code: true } },
} as const;

const toSummary = <T extends { promotion: { code: string } | null }>({ promotion, ...order }: T) => ({
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
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids } },
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

    const items = dto.items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      size: i.size,
      toppings: i.toppings ?? [],
      unitPrice: unitPrice(productById.get(i.productId)!.price, i.size, i.toppings ?? []),
    }));
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

  async findMine(userPhone: string) {
    const orders = await this.prisma.order.findMany({
      where: { userPhone },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        total: true,
        discountAmount: true,
        promotion: { select: { code: true } },
        pickupCode: true,
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
