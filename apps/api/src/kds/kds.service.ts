import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { isUniqueViolation } from '../common/idempotency.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { STAFF_ITEMS_SELECT, withProductName } from '../orders/order-items.js';
import { assertTransition } from '../orders/order-status.js';
import { newPickupCode } from '../orders/pickup-code.js';
import type { UpdateKdsStatusDto } from './dto/kds.dto.js';

// Trùng mã với một đơn READY khác là hiếm (một triệu mã); thử lại vài lần là đủ
const MAX_CODE_ATTEMPTS = 5;

@Injectable()
export class KdsService {
  constructor(private readonly prisma: PrismaService) {}

  // Đơn đã trả tiền và chưa pha xong, cũ nhất lên đầu
  async list() {
    const orders = await this.prisma.order.findMany({
      where: { status: { in: ['PAID', 'PREPARING'] } },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        status: true,
        version: true,
        createdAt: true,
        items: STAFF_ITEMS_SELECT,
      },
    });
    return orders.map(({ items, ...order }) => ({ ...order, items: items.map(withProductName) }));
  }

  async changeStatus(id: string, dto: UpdateKdsStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      select: { id: true, status: true, version: true },
    });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    // Kiểm tra version trước để client cũ nhận đúng lý do (đơn đã bị đổi), rồi mới xét thứ tự
    if (order.version !== dto.version) {
      throw new ConflictException('Đơn vừa được cập nhật bởi yêu cầu khác, vui lòng tải lại');
    }
    assertTransition(order.status, dto.status);

    // Khóa lạc quan: chỉ ghi khi đơn vẫn đúng phiên bản và trạng thái lúc đọc
    const update = (pickupCode?: string) =>
      this.prisma.order.updateMany({
        where: { id, version: dto.version, status: order.status },
        data: { status: dto.status, version: { increment: 1 }, ...(pickupCode && { pickupCode }) },
      });

    let updated;
    if (dto.status === 'READY') {
      for (let attempt = 1; ; attempt++) {
        try {
          updated = await update(newPickupCode());
          break;
        } catch (e) {
          if (!isUniqueViolation(e) || attempt >= MAX_CODE_ATTEMPTS) throw e;
        }
      }
    } else {
      updated = await update();
    }

    if (updated.count === 0) {
      throw new ConflictException('Đơn vừa được cập nhật bởi yêu cầu khác, vui lòng tải lại');
    }
    return { id, status: dto.status, version: dto.version + 1 };
  }
}
