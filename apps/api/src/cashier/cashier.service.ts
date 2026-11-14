import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { STAFF_ITEMS_SELECT, withProductName } from '../orders/order-items.js';
import { assertTransition } from '../orders/order-status.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CashierListQueryDto, CompleteOrderDto } from './dto/cashier.dto.js';

@Injectable()
export class CashierService {
  constructor(private readonly prisma: PrismaService) {}

  // Đơn chờ giao (READY) và đơn có thể hủy tại quầy (PAID), cũ nhất lên đầu.
  // Không trả pickupCode: Cashier phải hỏi khách thì việc đối chiếu mới có nghĩa.
  async list({ status }: CashierListQueryDto) {
    const orders = await this.prisma.order.findMany({
      where: { status: { in: status ? [status] : ['PAID', 'READY'] } },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        status: true,
        version: true,
        total: true,
        createdAt: true,
        items: STAFF_ITEMS_SELECT,
      },
    });
    return orders.map(({ items, ...order }) => ({ ...order, items: items.map(withProductName) }));
  }

  async complete(id: string, dto: CompleteOrderDto) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      select: { status: true, version: true, pickupCode: true },
    });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    assertTransition(order.status, 'COMPLETED');
    // ponytail: không giới hạn số lần thử mã; mã 6 số, người nhập là nhân viên đã đăng nhập
    if (order.pickupCode !== dto.pickupCode) {
      throw new BadRequestException('Mã nhận hàng không đúng');
    }

    // Xóa mã khi giao xong để mã được cấp lại cho đơn READY khác
    const updated = await this.prisma.order.updateMany({
      where: { id, status: 'READY', version: order.version, pickupCode: dto.pickupCode },
      data: { status: 'COMPLETED', version: { increment: 1 }, pickupCode: null },
    });
    if (updated.count === 0) {
      throw new ConflictException('Đơn vừa được cập nhật bởi yêu cầu khác, vui lòng tải lại');
    }
    return { id, status: 'COMPLETED' as const, version: order.version + 1 };
  }
}
