import { Test } from '@nestjs/testing';
import request from 'supertest';
import { createValidationPipe } from '../common/validation.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';

const item = { productId: 1, quantity: 2, size: 'M', toppings: ['tran-chau'] };

async function setup(
  findManyOrders = vi.fn().mockResolvedValue([]),
  findUnique = vi.fn().mockResolvedValue(null),
  products = [{ id: 1, price: 29000, isAvailable: true }],
  promo: Record<string, unknown> | null = null,
) {
  const create = vi.fn().mockImplementation(({ data }) =>
    Promise.resolve({
      id: data.id,
      status: 'PENDING',
      total: data.total,
      discountAmount: data.discountAmount,
      promotion: data.promotionId ? { code: promo?.code } : null,
    }),
  );
  const findMany = vi.fn().mockResolvedValue(products);
  const promoFindUnique = vi.fn().mockResolvedValue(promo);
  const promoUpdateMany = vi.fn().mockResolvedValue({ count: 1 });
  const db = {
    product: { findMany },
    order: { create, findMany: findManyOrders, findUnique },
    promotion: { findUnique: promoFindUnique, updateMany: promoUpdateMany },
  };
  const moduleRef = await Test.createTestingModule({
    controllers: [OrdersController],
    providers: [
      OrdersService,
      {
        provide: PrismaService,
        useValue: { ...db, $transaction: (fn: (tx: typeof db) => unknown) => fn(db) },
      },
    ],
  })
    // guard thật được test riêng ở auth.controller.spec.ts
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
  return { app, create, findManyOrders, findUnique, promoFindUnique, promoUpdateMany };
}

describe('POST /orders', () => {
  it('lưu đơn PENDING, tính tổng ở server và trả mã đơn', async () => {
    const { app, create } = await setup();

    const res = await request(app.getHttpServer())
      .post('/orders')
      .send({ items: [item] })
      .expect(201);

    // 2 × (29000 + size M 5000 + trân châu 8000)
    expect(res.body).toMatchObject({ status: 'PENDING', total: 84000 });
    expect(res.body.id).toMatch(/^ord_/);
    expect(create.mock.calls[0][0].data.userPhone).toBe('0912345678');
    expect(create.mock.calls[0][0].data.items.create[0].unitPrice).toBe(42000);
    await app.close();
  });

  it.each([
    ['giỏ rỗng', { items: [] }],
    ['thiếu items', {}],
    ['số lượng 0', { items: [{ ...item, quantity: 0 }] }],
    ['size lạ', { items: [{ ...item, size: 'XL' }] }],
    ['topping lạ', { items: [{ ...item, toppings: ['la'] }] }],
    ['trường thừa (giá do client gửi)', { items: [{ ...item, price: 1 }] }],
  ])('400 khi %s', async (_name, body) => {
    const { app, create } = await setup();

    const res = await request(app.getHttpServer())
      .post('/orders')
      .send(body)
      .expect(400);

    expect(Array.isArray(res.body.message)).toBe(true);
    expect(create).not.toHaveBeenCalled();
    await app.close();
  });

  it('400 khi sản phẩm không tồn tại', async () => {
    const { app, create } = await setup();

    await request(app.getHttpServer())
      .post('/orders')
      .send({ items: [{ ...item, productId: 99 }] })
      .expect(400);

    expect(create).not.toHaveBeenCalled();
    await app.close();
  });

  it('409 khi sản phẩm đã hết hàng (isAvailable = false)', async () => {
    const { app, create } = await setup(undefined, undefined, [{ id: 1, price: 29000, isAvailable: false }]);

    const res = await request(app.getHttpServer())
      .post('/orders')
      .send({ items: [item] })
      .expect(409);

    expect(res.body.message).toMatch(/hết hàng/);
    expect(create).not.toHaveBeenCalled();
    await app.close();
  });
});

describe('GET /orders/me', () => {
  it('trả lịch sử đơn của người dùng đang đăng nhập, đơn mới nhất trước', async () => {
    const createdAt = new Date('2026-10-26T03:00:00.000Z');
    const findManyOrders = vi.fn().mockResolvedValue([
      {
        id: 'ord_1',
        status: 'PAID',
        total: 84000,
        discountAmount: 8400,
        promotion: { code: 'WELCOME10' },
        createdAt,
        items: [
          {
            productId: 1,
            quantity: 2,
            size: 'M',
            toppings: ['tran-chau'],
            unitPrice: 42000,
            product: { name: 'Cà phê sữa' },
          },
        ],
      },
    ]);
    const { app } = await setup(findManyOrders);

    const res = await request(app.getHttpServer()).get('/orders/me').expect(200);

    expect(findManyOrders.mock.calls[0][0]).toMatchObject({
      where: { userPhone: '0912345678' },
      orderBy: { createdAt: 'desc' },
    });
    expect(res.body).toEqual([
      {
        id: 'ord_1',
        status: 'PAID',
        total: 84000,
        discountAmount: 8400,
        promoCode: 'WELCOME10',
        createdAt: createdAt.toISOString(),
        items: [
          {
            productId: 1,
            productName: 'Cà phê sữa',
            quantity: 2,
            size: 'M',
            toppings: ['tran-chau'],
            unitPrice: 42000,
          },
        ],
      },
    ]);
    await app.close();
  });

  it('đơn READY trả pickupCode, đơn khác trả null', async () => {
    const createdAt = new Date('2026-11-14T03:00:00.000Z');
    const don = (id: string, status: string, pickupCode: string | null) => ({
      id, status, total: 29000, pickupCode, createdAt, items: [],
    });
    const findManyOrders = vi.fn().mockResolvedValue([don('ord_2', 'READY', '038417'), don('ord_1', 'PAID', null)]);
    const { app } = await setup(findManyOrders);

    const res = await request(app.getHttpServer()).get('/orders/me').expect(200);

    expect(findManyOrders.mock.calls[0][0].select.pickupCode).toBe(true);
    expect(res.body.map((o: any) => o.pickupCode)).toEqual(['038417', null]);
    await app.close();
  });

  it('trả review của đơn đã đánh giá, null nếu chưa', async () => {
    const createdAt = new Date('2026-11-14T03:00:00.000Z');
    const don = (id: string, review: unknown) => ({ id, status: 'COMPLETED', total: 29000, review, createdAt, items: [] });
    const findManyOrders = vi
      .fn()
      .mockResolvedValue([don('ord_2', { stars: 5, comment: 'Ngon' }), don('ord_1', null)]);
    const { app } = await setup(findManyOrders);

    const res = await request(app.getHttpServer()).get('/orders/me').expect(200);

    expect(findManyOrders.mock.calls[0][0].select.review).toEqual({ select: { stars: true, comment: true } });
    expect(res.body.map((o: any) => o.review)).toEqual([{ stars: 5, comment: 'Ngon' }, null]);
    await app.close();
  });

  it('chưa có đơn thì trả mảng rỗng', async () => {
    const { app } = await setup();
    const res = await request(app.getHttpServer()).get('/orders/me').expect(200);
    expect(res.body).toEqual([]);
    await app.close();
  });
});

describe('POST /orders với mã giảm giá', () => {
  // subtotal của giỏ mẫu: 2 × (29000 + size M 5000 + trân châu 8000) = 84000
  const products = [{ id: 1, price: 29000, isAvailable: true }];
  const rule = {
    id: 1,
    code: 'WELCOME10',
    discountType: 'PERCENT',
    discountValue: 10,
    minOrderAmount: 50000,
    isActive: true,
    expiryDate: null,
    maxUses: 1000,
    usedCount: 3,
  };
  const dat = (app: any, promoCode?: unknown) =>
    request(app.getHttpServer()).post('/orders').send({ items: [item], promoCode });

  it('PERCENT: giảm 10%, total sau giảm, giữ một lượt dùng, lưu promotionId', async () => {
    const { app, create, promoUpdateMany } = await setup(undefined, undefined, products, rule);

    const res = await dat(app, 'WELCOME10').expect(201);

    expect(res.body).toMatchObject({ status: 'PENDING', total: 75600, discountAmount: 8400, promoCode: 'WELCOME10' });
    const data = create.mock.calls[0][0].data;
    expect(data).toMatchObject({ total: 75600, discountAmount: 8400, promotionId: 1 });
    expect(promoUpdateMany).toHaveBeenCalledWith({
      where: { id: 1, usedCount: { lt: 1000 } },
      data: { usedCount: { increment: 1 } },
    });
    await app.close();
  });

  it('FIXED: giảm đúng số tiền; mã không giới hạn lượt thì không điều kiện usedCount', async () => {
    const fixed = { ...rule, id: 2, code: 'GIAM15K', discountType: 'FIXED', discountValue: 15000, minOrderAmount: 80000, maxUses: null };
    const { app, promoUpdateMany } = await setup(undefined, undefined, products, fixed);
    const res = await dat(app, 'GIAM15K').expect(201);
    expect(res.body).toMatchObject({ total: 69000, discountAmount: 15000 });
    expect(promoUpdateMany.mock.calls[0][0].where).toEqual({ id: 2 });
    await app.close();
  });

  it('FIXED lớn hơn giá trị đơn: chỉ giảm tối đa bằng subtotal, total không âm', async () => {
    const big = { ...rule, discountType: 'FIXED', discountValue: 500000, minOrderAmount: 0 };
    const { app } = await setup(undefined, undefined, products, big);
    const res = await dat(app, 'WELCOME10').expect(201);
    expect(res.body).toMatchObject({ total: 0, discountAmount: 84000 });
    await app.close();
  });

  it('PERCENT làm tròn xuống', async () => {
    const third = { ...rule, discountValue: 33, minOrderAmount: 0 };
    const { app } = await setup(undefined, undefined, products, third);
    const res = await dat(app, 'WELCOME10').expect(201);
    // 84000 × 33% = 27720
    expect(res.body).toMatchObject({ discountAmount: 27720, total: 56280 });
    await app.close();
  });

  it('mã không phân biệt hoa thường: tra theo chữ hoa', async () => {
    const { app, promoFindUnique } = await setup(undefined, undefined, products, rule);
    await dat(app, 'welcome10').expect(201);
    expect(promoFindUnique.mock.calls[0][0].where).toEqual({ code: 'WELCOME10' });
    await app.close();
  });

  it('không có mã: không tra Promotion, discountAmount 0, promoCode null', async () => {
    const { app, promoFindUnique, promoUpdateMany, create } = await setup();
    const res = await dat(app).expect(201);
    expect(res.body).toMatchObject({ total: 84000, discountAmount: 0, promoCode: null });
    expect(promoFindUnique).not.toHaveBeenCalled();
    expect(promoUpdateMany).not.toHaveBeenCalled();
    expect(create.mock.calls[0][0].data.promotionId).toBeUndefined();
    await app.close();
  });

  it.each([
    ['mã không tồn tại', null, 400, /không tồn tại/],
    ['mã bị vô hiệu', { ...rule, isActive: false }, 400, /vô hiệu/],
    ['mã đã hết hạn', { ...rule, expiryDate: new Date('2020-01-01T00:00:00Z') }, 400, /hết hạn/],
    ['đơn chưa đạt tối thiểu', { ...rule, minOrderAmount: 100000 }, 400, /tối thiểu 100000đ/],
    ['mã hết lượt', { ...rule, maxUses: 3, usedCount: 3 }, 409, /hết lượt/],
  ])('từ chối: %s, không tạo đơn và không giữ lượt', async (_ten, found, status, message) => {
    const { app, create, promoUpdateMany } = await setup(undefined, undefined, products, found);
    const res = await dat(app, 'WELCOME10').expect(status);
    expect(res.body.message).toMatch(message);
    expect(create).not.toHaveBeenCalled();
    expect(promoUpdateMany).not.toHaveBeenCalled();
    await app.close();
  });

  it('hai khách tranh lượt cuối: bên thua (updateMany không khớp dòng nào) nhận 409, không tạo đơn', async () => {
    const { app, create, promoUpdateMany } = await setup(undefined, undefined, products, rule);
    promoUpdateMany.mockResolvedValue({ count: 0 });
    const res = await dat(app, 'WELCOME10').expect(409);
    expect(res.body.message).toMatch(/hết lượt/);
    expect(create).not.toHaveBeenCalled();
    await app.close();
  });

  it.each([
    ['quá ngắn', 'ab'],
    ['có khoảng trắng', 'WELCOME 10'],
    ['ký tự đặc biệt', 'WELCOME10!'],
    ['là số', 123],
  ])('400 khi promoCode %s, không tra CSDL', async (_ten, code) => {
    const { app, promoFindUnique } = await setup(undefined, undefined, products, rule);
    await dat(app, code).expect(400);
    expect(promoFindUnique).not.toHaveBeenCalled();
    await app.close();
  });

  it('gửi lại cùng Idempotency-Key: trả đơn cũ, không giữ thêm lượt', async () => {
    const existing = { id: 'ord_old', status: 'PENDING', total: 75600, discountAmount: 8400, promotion: { code: 'WELCOME10' } };
    const { app, create, promoUpdateMany } = await setup(undefined, vi.fn().mockResolvedValue(existing), products, rule);
    const res = await dat(app, 'WELCOME10').set('Idempotency-Key', 'k-1').expect(201);
    expect(res.body).toEqual({ id: 'ord_old', status: 'PENDING', total: 75600, discountAmount: 8400, promoCode: 'WELCOME10' });
    expect(create).not.toHaveBeenCalled();
    expect(promoUpdateMany).not.toHaveBeenCalled();
    await app.close();
  });

  it('trùng key đồng thời: đơn thua bị hoàn tác trong transaction và trả đơn của bên thắng', async () => {
    const existing = { id: 'ord_old', status: 'PENDING', total: 75600, discountAmount: 8400, promotion: { code: 'WELCOME10' } };
    const findUnique = vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(existing);
    const { app, create } = await setup(undefined, findUnique, products, rule);
    create.mockRejectedValueOnce({ code: 'P2002' });
    const res = await dat(app, 'WELCOME10').set('Idempotency-Key', 'k-1').expect(201);
    expect(res.body.id).toBe('ord_old');
    await app.close();
  });
});

describe('POST /orders với Idempotency-Key', () => {
  const body = { items: [item] };
  const existing = { id: 'ord_old', status: 'PENDING', total: 84000, discountAmount: 0, promotion: null };
  const existingBody = { id: 'ord_old', status: 'PENDING', total: 84000, discountAmount: 0, promoCode: null };

  it('lần đầu: lưu key cùng đơn', async () => {
    const { app, create, findUnique } = await setup();
    await request(app.getHttpServer()).post('/orders').set('Idempotency-Key', 'k-1').send(body).expect(201);
    expect(findUnique.mock.calls[0][0].where).toEqual({
      userPhone_idempotencyKey: { userPhone: '0912345678', idempotencyKey: 'k-1' },
    });
    expect(create.mock.calls[0][0].data.idempotencyKey).toBe('k-1');
    await app.close();
  });

  it('gửi lại cùng key: trả đơn cũ, không tạo đơn mới', async () => {
    const { app, create } = await setup(undefined, vi.fn().mockResolvedValue(existing));
    const res = await request(app.getHttpServer()).post('/orders').set('Idempotency-Key', 'k-1').send(body).expect(201);
    expect(res.body).toEqual(existingBody);
    expect(create).not.toHaveBeenCalled();
    await app.close();
  });

  it('hai yêu cầu cùng key đến cùng lúc: bên thua trả đơn của bên thắng', async () => {
    const findUnique = vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(existing);
    const { app, create } = await setup(undefined, findUnique);
    create.mockRejectedValueOnce({ code: 'P2002' });
    const res = await request(app.getHttpServer()).post('/orders').set('Idempotency-Key', 'k-1').send(body).expect(201);
    expect(res.body).toEqual(existingBody);
    await app.close();
  });

  it('không có header thì không tra cứu key', async () => {
    const { app, findUnique, create } = await setup();
    await request(app.getHttpServer()).post('/orders').send(body).expect(201);
    expect(findUnique).not.toHaveBeenCalled();
    expect(create.mock.calls[0][0].data.idempotencyKey).toBeUndefined();
    await app.close();
  });

  it('400 khi key sai định dạng', async () => {
    const { app, create } = await setup();
    await request(app.getHttpServer()).post('/orders').set('Idempotency-Key', 'sai dinh dang!').send(body).expect(400);
    expect(create).not.toHaveBeenCalled();
    await app.close();
  });
});
