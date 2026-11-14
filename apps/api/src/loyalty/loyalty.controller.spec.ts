import { Test } from '@nestjs/testing';
import request from 'supertest';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { LoyaltyController } from './loyalty.controller.js';
import { LoyaltyService } from './loyalty.service.js';

describe('GET /loyalty/me', () => {
  async function setup(userMock: any = { loyaltyPoints: 120 }, paymentsMock: any[] = []) {
    const prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue(userMock),
      },
      payment: {
        findMany: vi.fn().mockResolvedValue(paymentsMock),
      },
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [LoyaltyController],
      providers: [
        LoyaltyService,
        { provide: PrismaService, useValue: prisma },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (ctx: any) => {
          ctx.switchToHttp().getRequest().user = { phone: '0912345678', role: 'CUSTOMER' };
          return true;
        },
      })
      .compile();

    const app = moduleRef.createNestApplication();
    await app.init();
    return { app, prisma };
  }

  it('trả về số dư điểm và lịch sử tích điểm của người dùng', async () => {
    const createdAt = new Date('2026-11-10T10:00:00.000Z');
    const { app, prisma } = await setup(
      { loyaltyPoints: 120 },
      [{ orderId: 'ord_1', pointsEarned: 84, createdAt }],
    );

    const res = await request(app.getHttpServer()).get('/loyalty/me').expect(200);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { phone: '0912345678' },
      select: { loyaltyPoints: true },
    });
    expect(res.body).toEqual({
      balance: 120,
      history: [{ orderId: 'ord_1', pointsEarned: 84, createdAt: createdAt.toISOString() }],
    });
    await app.close();
  });

  it('lịch sử không liệt kê đơn đã hủy (điểm đã được trừ lại)', async () => {
    const { app, prisma } = await setup();
    await request(app.getHttpServer()).get('/loyalty/me').expect(200);
    expect(prisma.payment.findMany.mock.calls[0][0].where).toEqual({
      order: { userPhone: '0912345678', status: { not: 'CANCELLED' } },
      status: 'SUCCESS',
      pointsEarned: { gt: 0 },
    });
    await app.close();
  });

  it('404 khi người dùng không tồn tại', async () => {
    const { app } = await setup(null, []);
    await request(app.getHttpServer()).get('/loyalty/me').expect(404);
    await app.close();
  });
});
