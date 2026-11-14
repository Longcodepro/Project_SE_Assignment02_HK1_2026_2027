import { Test } from '@nestjs/testing';
import request from 'supertest';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { createValidationPipe } from '../common/validation.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ReviewsController } from './reviews.controller.js';
import { ReviewsService } from './reviews.service.js';

const createdAt = new Date('2026-11-14T04:30:00.000Z');

async function setup(opts: { order?: Record<string, unknown> | null } = {}) {
  const order = opts.order === undefined ? { status: 'COMPLETED', review: null } : opts.order;
  const findFirst = vi.fn().mockResolvedValue(order);
  const create = vi.fn().mockImplementation(({ data }) =>
    Promise.resolve({ id: 1, orderId: data.orderId, stars: data.stars, comment: data.comment, createdAt }),
  );
  const moduleRef = await Test.createTestingModule({
    controllers: [ReviewsController],
    providers: [
      ReviewsService,
      { provide: PrismaService, useValue: { order: { findFirst }, review: { create } } },
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
  app.useGlobalPipes(createValidationPipe());
  await app.init();
  return { app, findFirst, create };
}

const danhGia = (app: any, body: object, id = 'ord_1') =>
  request(app.getHttpServer()).post(`/orders/${id}/review`).send(body);

describe('POST /orders/:id/review', () => {
  it('đơn COMPLETED của khách: lưu đánh giá và trả 201', async () => {
    const { app, findFirst, create } = await setup();

    const res = await danhGia(app, { stars: 5, comment: '  Ngon, ra món nhanh  ' }).expect(201);

    expect(res.body).toEqual({
      id: 1,
      orderId: 'ord_1',
      stars: 5,
      comment: 'Ngon, ra món nhanh',
      createdAt: createdAt.toISOString(),
    });
    expect(findFirst.mock.calls[0][0].where).toEqual({ id: 'ord_1', userPhone: '0912345678' });
    expect(create.mock.calls[0][0].data).toEqual({ orderId: 'ord_1', stars: 5, comment: 'Ngon, ra món nhanh' });
    await app.close();
  });

  it.each([1, 3, 5])('chấp nhận %i sao, nhận xét là tùy chọn (lưu null)', async (stars) => {
    const { app, create } = await setup();
    await danhGia(app, { stars }).expect(201);
    expect(create.mock.calls[0][0].data).toEqual({ orderId: 'ord_1', stars, comment: null });
    await app.close();
  });

  it('nhận xét chỉ có khoảng trắng thì lưu null', async () => {
    const { app, create } = await setup();
    await danhGia(app, { stars: 4, comment: '   ' }).expect(201);
    expect(create.mock.calls[0][0].data.comment).toBeNull();
    await app.close();
  });

  it.each(['PENDING', 'PAID', 'PAYMENT_FAILED', 'PREPARING', 'READY', 'CANCELLED'])(
    '409 khi đơn đang %s (chưa hoàn tất), không ghi gì',
    async (status) => {
      const { app, create } = await setup({ order: { status, review: null } });
      const res = await danhGia(app, { stars: 5 }).expect(409);
      expect(res.body.message).toBe('Chỉ đánh giá được đơn đã hoàn tất');
      expect(create).not.toHaveBeenCalled();
      await app.close();
    },
  );

  it('409 khi đơn đã được đánh giá, không ghi thêm', async () => {
    const { app, create } = await setup({ order: { status: 'COMPLETED', review: { id: 9 } } });
    const res = await danhGia(app, { stars: 5 }).expect(409);
    expect(res.body.message).toBe('Đơn này đã được đánh giá');
    expect(create).not.toHaveBeenCalled();
    await app.close();
  });

  it('hai yêu cầu đánh giá đến cùng lúc: bên thua (orderId trùng, P2002) nhận 409', async () => {
    const { app, create } = await setup();
    create.mockRejectedValueOnce({ code: 'P2002' });
    const res = await danhGia(app, { stars: 5 }).expect(409);
    expect(res.body.message).toBe('Đơn này đã được đánh giá');
    await app.close();
  });

  it('404 khi không có đơn hoặc không phải đơn của khách', async () => {
    const { app, findFirst, create } = await setup({ order: null });
    await danhGia(app, { stars: 5 }, 'ord_nguoi_khac').expect(404);
    expect(findFirst.mock.calls[0][0].where).toEqual({ id: 'ord_nguoi_khac', userPhone: '0912345678' });
    expect(create).not.toHaveBeenCalled();
    await app.close();
  });

  it.each([
    ['thiếu stars', { comment: 'x' }],
    ['0 sao', { stars: 0 }],
    ['6 sao', { stars: 6 }],
    ['số sao âm', { stars: -1 }],
    ['số sao thập phân', { stars: 4.5 }],
    ['stars là chuỗi', { stars: '5' }],
    ['nhận xét không phải chuỗi', { stars: 5, comment: 5 }],
    ['nhận xét quá 500 ký tự', { stars: 5, comment: 'a'.repeat(501) }],
    ['trường thừa', { stars: 5, orderId: 'ord_2' }],
  ])('400 khi %s, không đụng tới CSDL', async (_ten, body) => {
    const { app, findFirst, create } = await setup();
    await danhGia(app, body).expect(400);
    expect(findFirst).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
    await app.close();
  });

  it('nhận xét đúng 500 ký tự vẫn hợp lệ', async () => {
    const { app } = await setup();
    await danhGia(app, { stars: 5, comment: 'a'.repeat(500) }).expect(201);
    await app.close();
  });
});
