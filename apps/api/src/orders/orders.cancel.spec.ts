import { Test } from '@nestjs/testing';
import request from 'supertest';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { createValidationPipe } from '../common/validation.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';

const donCuaToi = (over: Record<string, unknown> = {}) => ({
  status: 'PAID',
  version: 2,
  userPhone: '0912345678',
  promotionId: null,
  ...over,
});

async function setup(
  opts: { order?: Record<string, unknown> | null; updateCount?: number; pointsEarned?: number | null } = {},
) {
  const order = opts.order === undefined ? donCuaToi() : opts.order;
  const db = {
    order: {
      findFirst: vi.fn().mockResolvedValue(order),
      updateMany: vi.fn().mockResolvedValue({ count: opts.updateCount ?? 1 }),
    },
    payment: {
      findFirst: vi
        .fn()
        .mockResolvedValue(opts.pointsEarned === null ? null : { pointsEarned: opts.pointsEarned ?? 84 }),
    },
    user: { update: vi.fn().mockResolvedValue({}) },
    promotion: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
  };
  const moduleRef = await Test.createTestingModule({
    controllers: [OrdersController],
    providers: [
      OrdersService,
      { provide: PrismaService, useValue: { ...db, $transaction: (fn: (tx: typeof db) => unknown) => fn(db) } },
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
  return { app, ...db };
}

const huy = (app: any, body: object, id = 'ord_1') =>
  request(app.getHttpServer()).post(`/orders/${id}/cancel`).send(body);

describe('POST /orders/:id/cancel (khách)', () => {
  it('PAID: hủy kèm lý do, ghi thời điểm hoàn tiền, trừ lại điểm đã tích', async () => {
    const { app, order, payment, user } = await setup();

    const res = await huy(app, { version: 2, reason: '  Đổi ý  ' }).expect(200);

    expect(res.body).toMatchObject({ id: 'ord_1', status: 'CANCELLED', version: 3 });
    expect(res.body.refundedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(order.findFirst.mock.calls[0][0].where).toEqual({ id: 'ord_1', userPhone: '0912345678' });
    const { where, data } = order.updateMany.mock.calls[0][0];
    expect(where).toEqual({ id: 'ord_1', version: 2, status: 'PAID' });
    expect(data).toMatchObject({ status: 'CANCELLED', version: { increment: 1 }, cancelReason: 'Đổi ý' });
    expect(data.refundedAt).toBeInstanceOf(Date);
    expect(payment.findFirst.mock.calls[0][0].where).toEqual({ orderId: 'ord_1', status: 'SUCCESS' });
    expect(user.update).toHaveBeenCalledWith({
      where: { phone: '0912345678' },
      data: { loyaltyPoints: { decrement: 84 } },
    });
    await app.close();
  });

  it.each(['PENDING', 'PAYMENT_FAILED'])('%s: hủy được, không cần lý do, không hoàn tiền, không trừ điểm', async (status) => {
    const { app, order, payment, user } = await setup({ order: donCuaToi({ status }) });

    const res = await huy(app, { version: 2 }).expect(200);

    expect(res.body).toEqual({ id: 'ord_1', status: 'CANCELLED', version: 3, refundedAt: null });
    expect(order.updateMany.mock.calls[0][0].data).toMatchObject({ cancelReason: null, refundedAt: null });
    expect(payment.findFirst).not.toHaveBeenCalled();
    expect(user.update).not.toHaveBeenCalled();
    await app.close();
  });

  it('đơn chưa trả tiền hủy kèm lý do thì lưu lý do', async () => {
    const { app, order } = await setup({ order: donCuaToi({ status: 'PENDING' }) });
    await huy(app, { version: 2, reason: 'Nhầm món' }).expect(200);
    expect(order.updateMany.mock.calls[0][0].data.cancelReason).toBe('Nhầm món');
    await app.close();
  });

  it.each([
    ['không có lý do', { version: 2 }],
    ['lý do rỗng', { version: 2, reason: '' }],
    ['lý do chỉ có khoảng trắng', { version: 2, reason: '   ' }],
  ])('PAID mà %s: 400, không ghi gì', async (_ten, body) => {
    const { app, order, user } = await setup();
    const res = await huy(app, body).expect(400);
    expect(res.body.message).toBe('Cần ghi lý do khi hủy đơn đã thanh toán');
    expect(order.updateMany).not.toHaveBeenCalled();
    expect(user.update).not.toHaveBeenCalled();
    await app.close();
  });

  it('PAID nhưng không có dòng thanh toán thành công (hoặc 0 điểm): không trừ điểm', async () => {
    const { app, user } = await setup({ pointsEarned: 0 });
    await huy(app, { version: 2, reason: 'Đổi ý' }).expect(200);
    expect(user.update).not.toHaveBeenCalled();
    await app.close();
  });

  it('đơn dùng mã giảm giá: trả lại một lượt dùng (chỉ khi usedCount > 0)', async () => {
    const { app, promotion } = await setup({ order: donCuaToi({ promotionId: 7 }) });
    await huy(app, { version: 2, reason: 'Đổi ý' }).expect(200);
    expect(promotion.updateMany).toHaveBeenCalledWith({
      where: { id: 7, usedCount: { gt: 0 } },
      data: { usedCount: { decrement: 1 } },
    });
    await app.close();
  });

  it('đơn không dùng mã: không đụng tới Promotion', async () => {
    const { app, promotion } = await setup();
    await huy(app, { version: 2, reason: 'Đổi ý' }).expect(200);
    expect(promotion.updateMany).not.toHaveBeenCalled();
    await app.close();
  });

  it.each(['PREPARING', 'READY', 'COMPLETED', 'CANCELLED'])('409 khi đơn đang %s, không ghi gì', async (status) => {
    const { app, order, user } = await setup({ order: donCuaToi({ status }) });
    const res = await huy(app, { version: 2, reason: 'Đổi ý' }).expect(409);
    expect(res.body.message).toMatch(/Không thể chuyển/);
    expect(order.updateMany).not.toHaveBeenCalled();
    expect(user.update).not.toHaveBeenCalled();
    await app.close();
  });

  it('Barista bấm PREPARING trước (version đã tăng): khách gửi version cũ nhận 409, không hủy', async () => {
    const { app, order } = await setup({ order: donCuaToi({ status: 'PREPARING', version: 3 }) });
    const res = await huy(app, { version: 2, reason: 'Đổi ý' }).expect(409);
    expect(res.body.message).toMatch(/vừa được cập nhật/);
    expect(order.updateMany).not.toHaveBeenCalled();
    await app.close();
  });

  it('hai bên cùng đọc version 2, Barista ghi trước: updateMany của khách không khớp dòng nào → 409, không trừ điểm', async () => {
    const { app, user, promotion } = await setup({ order: donCuaToi({ promotionId: 7 }), updateCount: 0 });
    const res = await huy(app, { version: 2, reason: 'Đổi ý' }).expect(409);
    expect(res.body.message).toMatch(/vừa được cập nhật/);
    expect(user.update).not.toHaveBeenCalled();
    expect(promotion.updateMany).not.toHaveBeenCalled();
    await app.close();
  });

  it('404 khi không có đơn hoặc không phải đơn của khách', async () => {
    const { app, order } = await setup({ order: null });
    await huy(app, { version: 2, reason: 'x' }, 'ord_nguoi_khac').expect(404);
    expect(order.findFirst.mock.calls[0][0].where).toEqual({ id: 'ord_nguoi_khac', userPhone: '0912345678' });
    expect(order.updateMany).not.toHaveBeenCalled();
    await app.close();
  });

  it.each([
    ['thiếu version', { reason: 'x' }],
    ['version là chuỗi', { version: '2', reason: 'x' }],
    ['version âm', { version: -1, reason: 'x' }],
    ['lý do không phải chuỗi', { version: 2, reason: 5 }],
    ['lý do quá 200 ký tự', { version: 2, reason: 'a'.repeat(201) }],
    ['trường thừa', { version: 2, reason: 'x', status: 'PAID' }],
  ])('400 khi %s, không đụng tới CSDL', async (_ten, body) => {
    const { app, order } = await setup();
    await huy(app, body).expect(400);
    expect(order.findFirst).not.toHaveBeenCalled();
    await app.close();
  });
});
