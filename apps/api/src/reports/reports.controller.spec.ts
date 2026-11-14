import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { createValidationPipe } from '../common/validation.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ReportsController } from './reports.controller.js';
import { ReportsService } from './reports.service.js';

// Thay JwtAuthGuard: header x-role cho biết vai trò. RolesGuard là bản thật.
@Injectable()
class FakeJwtGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    req.user = {
      phone: '0900000003',
      role: req.headers['x-role'] ?? 'MANAGER',
    };
    return true;
  }
}

async function setup(orders: unknown[] = []) {
  const findMany = vi.fn().mockResolvedValue(orders);
  const moduleRef = await Test.createTestingModule({
    controllers: [ReportsController],
    providers: [
      ReportsService,
      { provide: PrismaService, useValue: { order: { findMany } } },
    ],
  })
    .overrideGuard(JwtAuthGuard)
    .useClass(FakeJwtGuard)
    .compile();
  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(createValidationPipe());
  await app.init();
  return { app, findMany };
}

describe('GET /admin/reports', () => {
  it('trả báo cáo theo hợp đồng và truy vấn đúng khoảng giờ Việt Nam', async () => {
    const { app, findMany } = await setup([
      {
        createdAt: new Date('2026-11-13T03:00:00Z'),
        status: 'COMPLETED',
        total: 84000,
        items: [{ productId: 1, quantity: 2, product: { name: 'Cà phê sữa' } }],
      },
    ]);

    const res = await request(app.getHttpServer())
      .get('/admin/reports?from=2026-11-12&to=2026-11-14&groupBy=day')
      .expect(200);

    const where = findMany.mock.calls[0][0].where.createdAt;
    expect(where.gte.toISOString()).toBe('2026-11-11T17:00:00.000Z');
    expect(where.lt.toISOString()).toBe('2026-11-14T17:00:00.000Z');
    expect(res.body).toEqual({
      from: '2026-11-12',
      to: '2026-11-14',
      groupBy: 'day',
      totals: {
        revenue: 84000,
        completedOrders: 1,
        totalOrders: 1,
        cancelledOrders: 0,
        cancelRate: 0,
      },
      series: [
        {
          period: '2026-11-12',
          revenue: 0,
          completedOrders: 0,
          totalOrders: 0,
          cancelledOrders: 0,
          cancelRate: 0,
        },
        {
          period: '2026-11-13',
          revenue: 84000,
          completedOrders: 1,
          totalOrders: 1,
          cancelledOrders: 0,
          cancelRate: 0,
        },
        {
          period: '2026-11-14',
          revenue: 0,
          completedOrders: 0,
          totalOrders: 0,
          cancelledOrders: 0,
          cancelRate: 0,
        },
      ],
      topProducts: [{ productId: 1, productName: 'Cà phê sữa', quantity: 2 }],
    });
    await app.close();
  });

  it('không có query: 7 ngày gần nhất tính đến hôm nay, gom theo ngày', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-14T05:00:00Z'));
    try {
      const { app } = await setup();
      const res = await request(app.getHttpServer())
        .get('/admin/reports')
        .expect(200);
      expect(res.body.from).toBe('2026-11-08');
      expect(res.body.to).toBe('2026-11-14');
      expect(res.body.groupBy).toBe('day');
      expect(res.body.series).toHaveLength(7);
      await app.close();
    } finally {
      vi.useRealTimers();
    }
  });

  it.each(['week', 'month'])('groupBy=%s được chấp nhận', async (groupBy) => {
    const { app } = await setup();
    const res = await request(app.getHttpServer())
      .get(`/admin/reports?from=2026-11-01&to=2026-11-14&groupBy=${groupBy}`)
      .expect(200);
    expect(res.body.groupBy).toBe(groupBy);
    await app.close();
  });

  it.each([
    ['from sai định dạng', '?from=14/11/2026&to=2026-11-14'],
    ['ngày không có thật', '?from=2026-02-30&to=2026-03-05'],
    ['from sau to', '?from=2026-11-14&to=2026-11-12'],
    ['khoảng quá 366 ngày', '?from=2025-01-01&to=2026-11-14'],
    ['groupBy lạ', '?groupBy=year'],
    ['tham số lạ', '?limit=5'],
  ])('400 khi %s, không truy vấn CSDL', async (_ten, qs) => {
    const { app, findMany } = await setup();
    await request(app.getHttpServer()).get(`/admin/reports${qs}`).expect(400);
    expect(findMany).not.toHaveBeenCalled();
    await app.close();
  });

  it.each(['CUSTOMER', 'BARISTA', 'CASHIER'])(
    '403 với vai trò %s và không truy vấn CSDL',
    async (role) => {
      const { app, findMany } = await setup();
      const res = await request(app.getHttpServer())
        .get('/admin/reports')
        .set('x-role', role)
        .expect(403);
      expect(res.body.message).toBe('Không đủ quyền truy cập');
      expect(findMany).not.toHaveBeenCalled();
      await app.close();
    },
  );
});
