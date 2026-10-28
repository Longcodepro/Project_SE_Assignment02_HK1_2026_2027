import { Test } from '@nestjs/testing';
import request from 'supertest';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { createValidationPipe } from '../common/validation.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { MockPaymentGateway } from './mock-gateway.js';
import { PaymentsController } from './payments.controller.js';
import { PaymentsService } from './payments.service.js';

async function setup(order: object | null, updatedCount = 1) {
  const orderUpdateMany = vi.fn().mockResolvedValue({ count: updatedCount });
  const paymentCreate = vi
    .fn()
    .mockImplementation(({ data }) => Promise.resolve({ id: 11, ...data }));
  const orderFindFirst = vi.fn().mockResolvedValue(order);
  const paymentFindUnique = vi.fn().mockResolvedValue(null);
  const userUpdate = vi.fn().mockResolvedValue({});
  const tx = {
    order: { updateMany: orderUpdateMany },
    payment: { create: paymentCreate },
    user: { update: userUpdate },
  };
  const prisma = {
    order: { findFirst: orderFindFirst },
    payment: { findUnique: paymentFindUnique },
    $transaction: (fn: (t: typeof tx) => unknown) => fn(tx),
  };
  const moduleRef = await Test.createTestingModule({
    controllers: [PaymentsController],
    providers: [PaymentsService, MockPaymentGateway, { provide: PrismaService, useValue: prisma }],
  })
    .overrideGuard(JwtAuthGuard)
    .useValue({
      canActivate: (ctx: any) => {
        ctx.switchToHttp().getRequest().user = { id: 7, email: 'a@b.c' };
        return true;
      },
    })
    .compile();
  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(createValidationPipe());
  await app.init();
  return { app, orderFindFirst, orderUpdateMany, paymentCreate, paymentFindUnique, userUpdate, http: () => request(app.getHttpServer()) };
}

const pending = { id: 'ord_1', userId: 7, status: 'PENDING', total: 84000, version: 3 };

describe('POST /payments', () => {
  it('Ví: đơn chuyển PAID và lưu lần thanh toán SUCCESS với số tiền của đơn', async () => {
    const { app, http, orderUpdateMany, paymentCreate, orderFindFirst } = await setup(pending);

    const res = await http().post('/payments').send({ orderId: 'ord_1', method: 'WALLET' }).expect(201);

    expect(res.body).toMatchObject({ orderId: 'ord_1', status: 'PAID', method: 'WALLET', amount: 84000 });
    expect(orderFindFirst).toHaveBeenCalledWith({ where: { id: 'ord_1', userId: 7 } });
    expect(orderUpdateMany.mock.calls[0][0]).toEqual({
      where: { id: 'ord_1', version: 3 },
      data: { status: 'PAID', version: { increment: 1 } },
    });
    expect(paymentCreate.mock.calls[0][0].data).toMatchObject({ status: 'SUCCESS', amount: 84000, pointsEarned: 84 });
    await app.close();
  });

  it('Thẻ hợp lệ: PAID', async () => {
    const { app, http } = await setup(pending);
    const res = await http().post('/payments').send({ orderId: 'ord_1', method: 'CARD', cardNumber: '4111111111111111' }).expect(201);
    expect(res.body.status).toBe('PAID');
    await app.close();
  });

  it('Thẻ bị từ chối (đuôi 0000): đơn chuyển PAYMENT_FAILED kèm lý do', async () => {
    const { app, http, orderUpdateMany, paymentCreate } = await setup(pending);

    const res = await http().post('/payments').send({ orderId: 'ord_1', method: 'CARD', cardNumber: '4111111111110000' }).expect(201);

    expect(res.body).toMatchObject({ status: 'PAYMENT_FAILED', reason: 'Thẻ bị từ chối' });
    expect(orderUpdateMany.mock.calls[0][0].data).toEqual({ status: 'PAYMENT_FAILED', version: { increment: 1 } });
    expect(paymentCreate.mock.calls[0][0].data.status).toBe('FAILED');
    await app.close();
  });

  it('Ví không đủ số dư khi đơn trên 500.000đ', async () => {
    const { app, http } = await setup({ ...pending, total: 600000 });
    const res = await http().post('/payments').send({ orderId: 'ord_1', method: 'WALLET' }).expect(201);
    expect(res.body).toMatchObject({ status: 'PAYMENT_FAILED', reason: 'Số dư ví không đủ' });
    await app.close();
  });

  it('thử lại mà vẫn lỗi: ghi thêm lần thanh toán FAILED, không đổi trạng thái đơn', async () => {
    const { app, http, orderUpdateMany, paymentCreate } = await setup({ ...pending, status: 'PAYMENT_FAILED' });

    const res = await http().post('/payments').send({ orderId: 'ord_1', method: 'CARD', cardNumber: '4111111111110000' }).expect(201);

    expect(res.body.status).toBe('PAYMENT_FAILED');
    // vẫn qua cổng version nhưng không đổi status
    expect(orderUpdateMany.mock.calls[0][0].data).toEqual({ version: { increment: 1 } });
    expect(paymentCreate).toHaveBeenCalledTimes(1);
    await app.close();
  });

  it('thử lại được khi đơn đang PAYMENT_FAILED', async () => {
    const { app, http, orderUpdateMany } = await setup({ ...pending, status: 'PAYMENT_FAILED' });
    const res = await http().post('/payments').send({ orderId: 'ord_1', method: 'WALLET' }).expect(201);
    expect(res.body.status).toBe('PAID');
    expect(orderUpdateMany.mock.calls[0][0].where).toEqual({ id: 'ord_1', version: 3 });
    await app.close();
  });

  it('404 khi đơn không tồn tại hoặc của người khác', async () => {
    const { app, http, paymentCreate } = await setup(null);
    await http().post('/payments').send({ orderId: 'ord_x', method: 'WALLET' }).expect(404);
    expect(paymentCreate).not.toHaveBeenCalled();
    await app.close();
  });

  it('tích điểm khi thành công: 1 điểm / 1.000đ, làm tròn xuống, cộng vào đúng người dùng', async () => {
    const { app, http, userUpdate } = await setup({ ...pending, total: 29900 });
    const res = await http().post('/payments').send({ orderId: 'ord_1', method: 'WALLET' }).expect(201);
    expect(res.body.pointsEarned).toBe(29);
    expect(userUpdate).toHaveBeenCalledWith({ where: { id: 7 }, data: { loyaltyPoints: { increment: 29 } } });
    await app.close();
  });

  it('thanh toán thất bại thì không tích điểm', async () => {
    const { app, http, userUpdate } = await setup(pending);
    const res = await http().post('/payments').send({ orderId: 'ord_1', method: 'CARD', cardNumber: '4111111111110000' }).expect(201);
    expect(res.body.pointsEarned).toBe(0);
    expect(userUpdate).not.toHaveBeenCalled();
    await app.close();
  });

  it('gửi lại cùng key không cộng điểm lần nữa', async () => {
    const { app, http, userUpdate, paymentFindUnique } = await setup({ ...pending, status: 'PAID' });
    paymentFindUnique.mockResolvedValue({ id: 11, orderId: 'ord_1', method: 'WALLET', amount: 84000, status: 'SUCCESS', failureReason: null, pointsEarned: 84 });
    await http().post('/payments').set('Idempotency-Key', 'pay-1').send({ orderId: 'ord_1', method: 'WALLET' }).expect(201);
    expect(userUpdate).not.toHaveBeenCalled();
    await app.close();
  });

  it('409 khi đơn đã PAID, không gọi cổng thanh toán', async () => {
    const { app, http, paymentCreate } = await setup({ ...pending, status: 'PAID' });
    await http().post('/payments').send({ orderId: 'ord_1', method: 'WALLET' }).expect(409);
    expect(paymentCreate).not.toHaveBeenCalled();
    await app.close();
  });

  it('409 khi đơn bị yêu cầu khác sửa trước (version đã đổi nên updateMany không khớp dòng nào)', async () => {
    const { app, http, paymentCreate } = await setup(pending, 0);
    const res = await http().post('/payments').send({ orderId: 'ord_1', method: 'WALLET' }).expect(409);
    expect(res.body.message).toMatch(/cập nhật bởi yêu cầu khác/);
    expect(paymentCreate).not.toHaveBeenCalled();
    await app.close();
  });

  it.each([
    ['thiếu orderId', { method: 'WALLET' }],
    ['phương thức lạ', { orderId: 'ord_1', method: 'CASH' }],
    ['trả thẻ mà thiếu số thẻ', { orderId: 'ord_1', method: 'CARD' }],
    ['số thẻ không phải số', { orderId: 'ord_1', method: 'CARD', cardNumber: 'abcd' }],
    ['client gửi số tiền', { orderId: 'ord_1', method: 'WALLET', amount: 1 }],
  ])('400 khi %s', async (_n, body) => {
    const { app, http, orderFindFirst } = await setup(pending);
    await http().post('/payments').send(body).expect(400);
    expect(orderFindFirst).not.toHaveBeenCalled();
    await app.close();
  });
});

describe('POST /payments với Idempotency-Key', () => {
  const dto = { orderId: 'ord_1', method: 'WALLET' };
  const old = { id: 11, orderId: 'ord_1', method: 'WALLET', amount: 84000, status: 'SUCCESS', failureReason: null, pointsEarned: 84 };

  it('lần đầu: lưu key cùng lần thanh toán', async () => {
    const { app, http, paymentCreate, paymentFindUnique } = await setup(pending);
    await http().post('/payments').set('Idempotency-Key', 'pay-1').send(dto).expect(201);
    expect(paymentFindUnique.mock.calls[0][0].where).toEqual({
      orderId_idempotencyKey: { orderId: 'ord_1', idempotencyKey: 'pay-1' },
    });
    expect(paymentCreate.mock.calls[0][0].data.idempotencyKey).toBe('pay-1');
    await app.close();
  });

  it('gửi lại sau khi đơn đã PAID: trả kết quả cũ (không phải 409), không trừ tiền lại', async () => {
    const { app, http, paymentCreate, paymentFindUnique } = await setup({ ...pending, status: 'PAID' });
    paymentFindUnique.mockResolvedValue(old);

    const res = await http().post('/payments').set('Idempotency-Key', 'pay-1').send(dto).expect(201);

    expect(res.body).toEqual({ paymentId: 11, orderId: 'ord_1', method: 'WALLET', amount: 84000, status: 'PAID', pointsEarned: 84 });
    expect(paymentCreate).not.toHaveBeenCalled();
    await app.close();
  });

  it('gửi lại lần thất bại: vẫn trả PAYMENT_FAILED kèm lý do cũ', async () => {
    const { app, http, paymentFindUnique } = await setup({ ...pending, status: 'PAYMENT_FAILED' });
    paymentFindUnique.mockResolvedValue({ ...old, status: 'FAILED', failureReason: 'Thẻ bị từ chối' });
    const res = await http().post('/payments').set('Idempotency-Key', 'pay-1').send(dto).expect(201);
    expect(res.body).toMatchObject({ status: 'PAYMENT_FAILED', reason: 'Thẻ bị từ chối' });
    await app.close();
  });

  it('hai yêu cầu cùng key đến cùng lúc (vi phạm unique): bên thua trả kết quả của bên thắng', async () => {
    const { app, http, paymentCreate, paymentFindUnique } = await setup(pending);
    paymentFindUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(old);
    paymentCreate.mockRejectedValueOnce({ code: 'P2002' });
    const res = await http().post('/payments').set('Idempotency-Key', 'pay-1').send(dto).expect(201);
    expect(res.body.paymentId).toBe(11);
    await app.close();
  });

  it('hai yêu cầu cùng key đến cùng lúc (đơn vừa bị đổi trạng thái): trả kết quả của bên thắng thay vì 409', async () => {
    const { app, http, paymentFindUnique } = await setup(pending, 0);
    paymentFindUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(old);
    const res = await http().post('/payments').set('Idempotency-Key', 'pay-1').send(dto).expect(201);
    expect(res.body.status).toBe('PAID');
    await app.close();
  });

  it('không có header thì không tra cứu key', async () => {
    const { app, http, paymentFindUnique } = await setup(pending);
    await http().post('/payments').send(dto).expect(201);
    expect(paymentFindUnique).not.toHaveBeenCalled();
    await app.close();
  });

  it('400 khi key sai định dạng', async () => {
    const { app, http, orderFindFirst } = await setup(pending);
    await http().post('/payments').set('Idempotency-Key', 'x'.repeat(129)).send(dto).expect(400);
    expect(orderFindFirst).not.toHaveBeenCalled();
    await app.close();
  });
});
