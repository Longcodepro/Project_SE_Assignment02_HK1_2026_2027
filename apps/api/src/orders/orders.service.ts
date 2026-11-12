import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { isUniqueViolation } from '../common/idempotency.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateOrderDto } from './dto/create-order.dto.js';
import { unitPrice } from './pricing.js';

const SUMMARY = { id: true, status: true, total: true } as const;

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userPhone: string, dto: CreateOrderDto, idempotencyKey?: string) {
    const findExisting = () =>
      this.prisma.order.findUnique({
        where: { userPhone_idempotencyKey: { userPhone, idempotencyKey: idempotencyKey! } },
        select: SUMMARY,
      });
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
    const total = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

    try {
      return await this.prisma.order.create({
        data: {
          id: `ord_${randomBytes(5).toString('hex')}`,
          userPhone,
          idempotencyKey,
          total,
          items: { create: items },
        },
        select: SUMMARY,
      });
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
      ...order,
      items: items.map(({ product, ...item }) => ({
        ...item,
        productName: product.name,
      })),
    }));
  }
}
