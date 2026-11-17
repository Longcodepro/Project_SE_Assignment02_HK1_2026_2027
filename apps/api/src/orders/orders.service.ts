/**
 * OrdersService: Trái tim xử lý nghiệp vụ đặt hàng, tính giá và hủy đơn.
 *
 * Các kỹ thuật cốt lõi:
 * 1. Chống gửi đơn trùng lặp (Idempotency) dựa trên cặp (userPhone, idempotencyKey).
 * 2. Tính giá hoàn toàn tại Server (Server-side Pricing) từ bảng giá CSDL.
 * 3. Kiểm tra trước nguyên liệu trong kho (Pre-flight Stock Check).
 * 4. Khóa lạc quan (Optimistic Locking) qua cột `version` khi hủy đơn.
 * 5. Hoàn lại nguyên liệu và lượt dùng voucher trong Database Transaction khi hủy.
 */

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
import {
  assertStockAvailable,
  loadNeeds,
  OutOfStockError,
  refundStock,
} from '../inventory/stock.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CancelOrderDto } from './dto/cancel-order.dto.js';
import type { CreateOrderDto } from './dto/create-order.dto.js';
import { assertTransition } from './order-status.js';
import { unitPrice } from './pricing.js';
import { assertPromotionUsable, discountFor } from './promotion.js';

// Cấu trúc SELECT tóm tắt sau khi tạo đơn
const SUMMARY = {
  id: true,
  status: true,
  total: true,
  discountAmount: true,
  promotion: { select: { code: true } },
} as const;

const STALE_ORDER = 'Đơn vừa được cập nhật bởi yêu cầu khác, vui lòng tải lại';

export type CancelActor =
  { kind: 'customer'; phone: string } | { kind: 'cashier' };

// Chuyển { promotion: { code: 'X' } } thành { promoCode: 'X' }
const toSummary = <T extends { promotion: { code: string } | null }>({
  promotion,
  ...order
}: T) => ({
  ...order,
  promoCode: promotion?.code ?? null,
});

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo đơn hàng mới
   */
  async create(
    userPhone: string,
    dto: CreateOrderDto,
    idempotencyKey?: string,
  ) {
    // 1. Kiểm tra Idempotency: nếu đã tạo đơn với key này rồi thì trả về đơn cũ ngay lập tức
    const findExisting = async () => {
      const existing = await this.prisma.order.findUnique({
        where: {
          userPhone_idempotencyKey: {
            userPhone,
            idempotencyKey: idempotencyKey!,
          },
        },
        select: SUMMARY,
      });
      return existing && toSummary(existing);
    };
    if (idempotencyKey) {
      const existing = await findExisting();
      if (existing) return existing;
    }

    // 2. Lấy danh sách ID món duy nhất và truy vấn CSDL (chỉ lấy món có danh mục đang hoạt động)
    const ids = [...new Set(dto.items.map((i) => i.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids }, category: { isActive: true } },
    });
    const productById = new Map(products.map((p) => [p.id, p]));

    // Báo lỗi 400 nếu có sản phẩm không tồn tại
    const missing = ids.filter((id) => !productById.has(id));
    if (missing.length) {
      throw new BadRequestException(
        `Sản phẩm không tồn tại: ${missing.join(', ')}`,
      );
    }

    // Báo lỗi 409 nếu món tạm hết hàng
    const unavailable = products.filter((p) => !p.isAvailable);
    if (unavailable.length) {
      throw new ConflictException(
        `Món trong giỏ đã hết hàng: ${unavailable.map((p) => p.name).join(', ')}`,
      );
    }

    // 3. Tải phụ thu size và bảng giá topping đang bán từ CSDL
    const toppingCodes = [
      ...new Set(dto.items.flatMap((i) => i.toppings ?? [])),
    ];
    const [sizeRows, toppingRows] = await Promise.all([
      this.prisma.sizeSurcharge.findMany(),
      toppingCodes.length
        ? this.prisma.topping.findMany({
            where: { code: { in: toppingCodes }, isActive: true },
          })
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

    // 4. Tính đơn giá (unitPrice) cho từng dòng món và tổng tiền gốc (subtotal)
    const items = dto.items.map((i) => {
      const sizeExtra = extraBySize.get(i.size);
      if (sizeExtra === undefined) {
        throw new InternalServerErrorException(
          `Chưa cấu hình phụ thu cho size ${i.size}`,
        );
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
    const subtotal = items.reduce(
      (sum, i) => sum + i.unitPrice * i.quantity,
      0,
    );

    // 5. Kiểm tra và áp dụng mã giảm giá (nếu có)
    const promo = dto.promoCode
      ? await this.prisma.promotion.findUnique({
          where: { code: dto.promoCode.toUpperCase() },
        })
      : null;
    if (dto.promoCode) {
      if (!promo) {
        throw new BadRequestException(
          'Mã giảm giá không tồn tại hoặc đã bị vô hiệu',
        );
      }
      assertPromotionUsable(promo, subtotal);
    }
    const discountAmount = promo ? discountFor(promo, subtotal) : 0;

    // 6. Kiểm tra nguyên liệu trong kho (Pre-flight check: không đủ nguyên liệu báo lỗi ngay)
    try {
      await assertStockAvailable(
        this.prisma,
        await loadNeeds(this.prisma, items),
      );
    } catch (e) {
      if (e instanceof OutOfStockError) {
        throw new ConflictException(
          `Không đủ nguyên liệu cho đơn này: ${e.ingredientNames.join(', ')}`,
        );
      }
      throw e;
    }

    // 7. Chuẩn bị dữ liệu ghi đơn hàng
    const data = {
      id: `ord_${randomBytes(5).toString('hex')}`, // Sinh ID dạng "ord_a1b2c3d4e5"
      userPhone,
      idempotencyKey,
      total: subtotal - discountAmount,
      discountAmount,
      promotionId: promo?.id,
      items: { create: items },
    };

    // 8. Ghi vào database (sử dụng transaction nếu có mã giảm giá để giữ lượt an toàn)
    try {
      if (!promo) {
        return toSummary(
          await this.prisma.order.create({ data, select: SUMMARY }),
        );
      }
      // Dùng Transaction để tăng usedCount của voucher và tạo đơn đồng thời
      return toSummary(
        await this.prisma.$transaction(async (tx) => {
          const reserved = await tx.promotion.updateMany({
            where: {
              id: promo.id,
              ...(promo.maxUses !== null && {
                usedCount: { lt: promo.maxUses },
              }),
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
      // Xử lý race condition: nếu 2 request cùng idempotencyKey đến cùng lúc
      if (idempotencyKey && isUniqueViolation(e)) {
        const existing = await findExisting();
        if (existing) return existing;
      }
      throw e;
    }
  }

  /**
   * Hủy đơn hàng (Khách tự hủy hoặc Thu ngân hủy đơn PAID)
   */
  async cancel(id: string, dto: CancelOrderDto, actor: CancelActor) {
    // 1. Kiểm tra quyền sở hữu đơn hàng (Khách chỉ tìm thấy đơn của chính mình)
    const order = await this.prisma.order.findFirst({
      where: {
        id,
        ...(actor.kind === 'customer' && { userPhone: actor.phone }),
      },
      select: {
        status: true,
        version: true,
        userPhone: true,
        promotionId: true,
      },
    });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    // 2. KHÓA LẠC QUAN: Nếu version client gửi lên khác version trong DB -> đơn đã bị ai đó sửa
    if (order.version !== dto.version) throw new ConflictException(STALE_ORDER);

    // 3. Kiểm tra bước chuyển trạng thái sang CANCELLED
    assertTransition(order.status, 'CANCELLED');
    if (actor.kind === 'cashier' && order.status !== 'PAID') {
      throw new ForbiddenException('Quầy chỉ hủy được đơn đã thanh toán');
    }

    const paid = order.status === 'PAID';
    const reason = dto.reason?.trim() || null;
    if (paid && !reason) {
      throw new BadRequestException('Cần ghi lý do khi hủy đơn đã thanh toán');
    }
    const refundedAt = paid ? new Date() : null;

    // 4. Thực thi việc hủy trong Transaction nguyên tử
    await this.prisma.$transaction(async (tx) => {
      // Cập nhật trạng thái và tăng version lên 1
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

      // Nếu đơn đã trả tiền: trừ lại điểm loyalty đã tích và hoàn trả nguyên liệu vào kho
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
        await refundStock(tx, id); // Hoàn lại lượng sữa, hạt cà phê, ly đã trừ
      }

      // Trả lại 1 lượt dùng cho mã giảm giá
      if (order.promotionId !== null) {
        await tx.promotion.updateMany({
          where: { id: order.promotionId, usedCount: { gt: 0 } },
          data: { usedCount: { decrement: 1 } },
        });
      }
    });

    return {
      id,
      status: 'CANCELLED' as const,
      version: dto.version + 1,
      refundedAt,
    };
  }

  /**
   * Lấy lịch sử đơn hàng của người dùng hiện tại (mới nhất xếp trước)
   */
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

    // Định dạng lại cấu trúc trả về cho Frontend
    return orders.map(({ items, ...order }) => ({
      ...toSummary(order),
      items: items.map(({ product, ...item }) => ({
        ...item,
        productName: product.name,
      })),
    }));
  }
}
