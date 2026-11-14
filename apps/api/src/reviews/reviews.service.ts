import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { isUniqueViolation } from '../common/idempotency.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateReviewDto } from './dto/review.dto.js';

const ALREADY_REVIEWED = 'Đơn này đã được đánh giá';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userPhone: string, orderId: string, dto: CreateReviewDto) {
    // Đơn của người khác cũng báo 404 để không lộ đơn có tồn tại
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userPhone },
      select: { status: true, review: { select: { id: true } } },
    });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    if (order.status !== 'COMPLETED') {
      throw new ConflictException('Chỉ đánh giá được đơn đã hoàn tất');
    }
    if (order.review) throw new ConflictException(ALREADY_REVIEWED);

    try {
      return await this.prisma.review.create({
        data: { orderId, stars: dto.stars, comment: dto.comment?.trim() || null },
        select: { id: true, orderId: true, stars: true, comment: true, createdAt: true },
      });
    } catch (e) {
      // Hai yêu cầu cùng lúc: orderId @unique chỉ cho một bên ghi được
      if (isUniqueViolation(e)) throw new ConflictException(ALREADY_REVIEWED);
      throw e;
    }
  }
}
