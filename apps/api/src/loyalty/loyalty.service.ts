import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class LoyaltyService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyLoyalty(userPhone: string) {
    const user = await this.prisma.user.findUnique({
      where: { phone: userPhone },
      select: { loyaltyPoints: true },
    });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    const payments = await this.prisma.payment.findMany({
      where: {
        // Đơn đã hủy được trừ lại điểm nên không liệt kê, để tổng lịch sử khớp số dư
        order: { userPhone, status: { not: 'CANCELLED' } },
        status: 'SUCCESS',
        pointsEarned: { gt: 0 },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        orderId: true,
        pointsEarned: true,
        createdAt: true,
      },
    });

    return {
      balance: user.loyaltyPoints,
      history: payments,
    };
  }
}
