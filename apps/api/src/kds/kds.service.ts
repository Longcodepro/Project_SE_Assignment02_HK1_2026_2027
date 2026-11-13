import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { assertTransition } from '../orders/order-status.js';
import type { UpdateKdsStatusDto } from './dto/kds.dto.js';

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
        items: {
          orderBy: { id: 'asc' },
          select: {
            quantity: true,
            size: true,
            toppings: true,
            product: { select: { name: true } },
          },
        },
      },
    });
    return orders.map(({ items, ...order }) => ({
      ...order,
      items: items.map(({ product, ...item }) => ({ ...item, productName: product.name })),
    }));
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
    const updated = await this.prisma.order.updateMany({
      where: { id, version: dto.version, status: order.status },
      data: { status: dto.status, version: { increment: 1 } },
    });
    if (updated.count === 0) {
      throw new ConflictException('Đơn vừa được cập nhật bởi yêu cầu khác, vui lòng tải lại');
    }
    return { id, status: dto.status, version: dto.version + 1 };
  }
}
