import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { ReportQueryDto } from './dto/report.dto.js';
import { buildReport, resolveRange } from './report.js';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  // ponytail: nạp đơn trong khoảng rồi cộng trong bộ nhớ (tối đa 366 ngày); nếu số đơn lên hàng trăm nghìn thì chuyển sang GROUP BY ở SQL
  async report(query: ReportQueryDto) {
    const { from, to, start, endExclusive } = resolveRange(query);
    const orders = await this.prisma.order.findMany({
      where: { createdAt: { gte: start, lt: endExclusive } },
      select: {
        createdAt: true,
        status: true,
        total: true,
        items: { select: { productId: true, quantity: true, product: { select: { name: true } } } },
      },
    });
    return buildReport({ from, to, groupBy: query.groupBy ?? 'day', orders });
  }
}
