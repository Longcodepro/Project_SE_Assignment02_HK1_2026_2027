import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { createValidationPipe } from '../common/validation.js';
import { OrdersService } from '../orders/orders.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CashierController } from './cashier.controller.js';
import { CashierService } from './cashier.service.js';

// Thay JwtAuthGuard: header x-role cho biết vai trò. RolesGuard là bản thật.
@Injectable()
class FakeJwtGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    req.user = {
      phone: '0900000002',
      role: req.headers['x-role'] ?? 'CASHIER',
    };
    return true;
  }
}

const don = (
  id: string,
  status: string,
  version: number,
  createdAt: string,
) => ({
  id,
  status,
  version,
  total: 84000,
  createdAt: new Date(createdAt),
  items: [
    {
      quantity: 2,
      size: 'M',
      toppings: ['tran-chau'],
      product: { name: 'Cà phê sữa' },
    },
  ],
});

async function setup(
  opts: { order?: any; updateCount?: number; orders?: any[] } = {},
) {
  const findMany = vi.fn().mockResolvedValue(opts.orders ?? []);
  const findUnique = vi.fn().mockResolvedValue(opts.order ?? null);
  const updateMany = vi
    .fn()
    .mockResolvedValue({ count: opts.updateCount ?? 1 });
  const findFirst = vi.fn().mockResolvedValue(opts.order ?? null);
  const userUpdate = vi.fn().mockResolvedValue({});
  const ingredientUpdate = vi.fn().mockResolvedValue({});
  const db = {
    order: { findMany, findUnique, findFirst, updateMany },
    payment: { findFirst: vi.fn().mockResolvedValue({ pointsEarned: 84 }) },
    user: { update: userUpdate },
    promotion: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
    stockUsage: {
      findMany: vi.fn().mockResolvedValue([{ ingredientId: 1, quantity: 36 }]),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    ingredient: { update: ingredientUpdate },
  };
  const moduleRef = await Test.createTestingModule({
    controllers: [CashierController],
    providers: [
      CashierService,
      OrdersService,
      {
        provide: PrismaService,
        useValue: {
          ...db,
          $transaction: (fn: (tx: typeof db) => unknown) => fn(db),
        },
      },
    ],
  })
    .overrideGuard(JwtAuthGuard)
    .useClass(FakeJwtGuard)
    .compile();
  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(createValidationPipe());
  await app.init();
  return {
    app,
    findMany,
    findUnique,
    findFirst,
    updateMany,
    userUpdate,
    ingredientUpdate,
  };
}

describe('GET /cashier/orders', () => {
  it('mặc định lấy đơn PAID và READY, cũ nhất lên đầu, không lộ pickupCode', async () => {
    const { app, findMany } = await setup({
      orders: [
        don('ord_1', 'READY', 3, '2026-11-14T01:00:00Z'),
        don('ord_2', 'PAID', 1, '2026-11-14T02:00:00Z'),
      ],
    });

    const res = await request(app.getHttpServer())
      .get('/cashier/orders')
      .expect(200);

    const query = findMany.mock.calls[0][0];
    expect(query.where).toEqual({ status: { in: ['PAID', 'READY'] } });
    expect(query.orderBy).toEqual({ createdAt: 'asc' });
    expect(query.select).not.toHaveProperty('pickupCode');
    expect(res.body[0]).toEqual({
      id: 'ord_1',
      status: 'READY',
      version: 3,
      total: 84000,
      createdAt: '2026-11-14T01:00:00.000Z',
      items: [
        {
          quantity: 2,
          size: 'M',
          toppings: ['tran-chau'],
          productName: 'Cà phê sữa',
        },
      ],
    });
    await app.close();
  });

  it.each(['READY', 'PAID'])(
    '?status=%s chỉ lấy đúng loại đó',
    async (status) => {
      const { app, findMany } = await setup();
      await request(app.getHttpServer())
        .get(`/cashier/orders?status=${status}`)
        .expect(200);
      expect(findMany.mock.calls[0][0].where).toEqual({
        status: { in: [status] },
      });
      await app.close();
    },
  );

  it('400 khi status ngoài READY/PAID', async () => {
    const { app, findMany } = await setup();
    await request(app.getHttpServer())
      .get('/cashier/orders?status=COMPLETED')
      .expect(400);
    expect(findMany).not.toHaveBeenCalled();
    await app.close();
  });

  it.each(['CUSTOMER', 'BARISTA', 'MANAGER'])(
    '403 với vai trò %s và không đụng tới CSDL',
    async (role) => {
      const { app, findMany } = await setup();
      const res = await request(app.getHttpServer())
        .get('/cashier/orders')
        .set('x-role', role)
        .expect(403);
      expect(res.body.message).toBe('Không đủ quyền truy cập');
      expect(findMany).not.toHaveBeenCalled();
      await app.close();
    },
  );
});

describe('POST /cashier/orders/:id/cancel', () => {
  const huy = (app: any, id: string, body: object, role = 'CASHIER') =>
    request(app.getHttpServer())
      .post(`/cashier/orders/${id}/cancel`)
      .set('x-role', role)
      .send(body);
  const donPaid = {
    status: 'PAID',
    version: 2,
    userPhone: '0912345678',
    promotionId: null,
  };

  it('hủy đơn PAID của bất kỳ khách nào: tìm theo id (không lọc userPhone), hoàn tiền, trừ điểm của chủ đơn', async () => {
    const { app, findFirst, updateMany, userUpdate } = await setup({
      order: donPaid,
    });

    const res = await huy(app, 'ord_1', {
      version: 2,
      reason: 'Hết nguyên liệu',
    }).expect(200);

    expect(res.body).toMatchObject({
      id: 'ord_1',
      status: 'CANCELLED',
      version: 3,
    });
    expect(res.body.refundedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(findFirst.mock.calls[0][0].where).toEqual({ id: 'ord_1' });
    expect(updateMany.mock.calls[0][0].where).toEqual({
      id: 'ord_1',
      version: 2,
      status: 'PAID',
    });
    expect(userUpdate).toHaveBeenCalledWith({
      where: { phone: '0912345678' },
      data: { loyaltyPoints: { decrement: 84 } },
    });
    await app.close();
  });

  it('hủy đơn PAID hoàn lại kho đúng số đã trừ', async () => {
    const { app, ingredientUpdate } = await setup({ order: donPaid });
    await huy(app, 'ord_1', { version: 2, reason: 'Hết nguyên liệu' }).expect(
      200,
    );
    expect(ingredientUpdate).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { stock: { increment: 36 } },
    });
    await app.close();
  });

  it.each(['PENDING', 'PAYMENT_FAILED'])(
    '403 khi đơn đang %s: quầy chỉ hủy đơn đã thanh toán',
    async (status) => {
      const { app, updateMany } = await setup({
        order: { ...donPaid, status },
      });
      const res = await huy(app, 'ord_1', { version: 2, reason: 'x' }).expect(
        403,
      );
      expect(res.body.message).toBe('Quầy chỉ hủy được đơn đã thanh toán');
      expect(updateMany).not.toHaveBeenCalled();
      await app.close();
    },
  );

  it.each(['PREPARING', 'READY', 'COMPLETED', 'CANCELLED'])(
    '409 khi đơn đang %s',
    async (status) => {
      const { app, updateMany } = await setup({
        order: { ...donPaid, status },
      });
      await huy(app, 'ord_1', { version: 2, reason: 'x' }).expect(409);
      expect(updateMany).not.toHaveBeenCalled();
      await app.close();
    },
  );

  it('409 khi sai version (Barista vừa chuyển PREPARING)', async () => {
    const { app, updateMany } = await setup({
      order: { ...donPaid, status: 'PREPARING', version: 3 },
    });
    await huy(app, 'ord_1', { version: 2, reason: 'x' }).expect(409);
    expect(updateMany).not.toHaveBeenCalled();
    await app.close();
  });

  it('400 khi thiếu lý do', async () => {
    const { app, updateMany } = await setup({ order: donPaid });
    const res = await huy(app, 'ord_1', { version: 2 }).expect(400);
    expect(res.body.message).toBe('Cần ghi lý do khi hủy đơn đã thanh toán');
    expect(updateMany).not.toHaveBeenCalled();
    await app.close();
  });

  it('404 khi không có đơn', async () => {
    const { app } = await setup();
    await huy(app, 'ord_khong_co', { version: 2, reason: 'x' }).expect(404);
    await app.close();
  });

  it.each(['CUSTOMER', 'BARISTA', 'MANAGER'])(
    '403 với vai trò %s và không đụng tới CSDL',
    async (role) => {
      const { app, findFirst, updateMany } = await setup({ order: donPaid });
      await huy(app, 'ord_1', { version: 2, reason: 'x' }, role).expect(403);
      expect(findFirst).not.toHaveBeenCalled();
      expect(updateMany).not.toHaveBeenCalled();
      await app.close();
    },
  );
});

describe('POST /cashier/orders/:id/complete', () => {
  const giao = (app: any, id: string, body: object, role = 'CASHIER') =>
    request(app.getHttpServer())
      .post(`/cashier/orders/${id}/complete`)
      .set('x-role', role)
      .send(body);
  const donReady = {
    id: 'ord_1',
    status: 'READY',
    version: 3,
    pickupCode: '038417',
  };

  it('đúng mã: READY → COMPLETED, xóa mã, ghi có điều kiện version/trạng thái/mã', async () => {
    const { app, updateMany } = await setup({ order: donReady });

    const res = await giao(app, 'ord_1', { pickupCode: '038417' }).expect(200);

    expect(res.body).toEqual({ id: 'ord_1', status: 'COMPLETED', version: 4 });
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 'ord_1', status: 'READY', version: 3, pickupCode: '038417' },
      data: {
        status: 'COMPLETED',
        version: { increment: 1 },
        pickupCode: null,
      },
    });
    await app.close();
  });

  it('sai mã: 400 và không đổi trạng thái', async () => {
    const { app, updateMany } = await setup({ order: donReady });
    const res = await giao(app, 'ord_1', { pickupCode: '999999' }).expect(400);
    expect(res.body.message).toBe('Mã nhận hàng không đúng');
    expect(updateMany).not.toHaveBeenCalled();
    await app.close();
  });

  it.each(['PAID', 'PREPARING', 'COMPLETED', 'CANCELLED', 'PENDING'])(
    '409 khi đơn đang %s (không phải READY), không ghi gì',
    async (status) => {
      const { app, updateMany } = await setup({
        order: { ...donReady, status, pickupCode: null },
      });
      const res = await giao(app, 'ord_1', { pickupCode: '038417' }).expect(
        409,
      );
      expect(res.body.message).toMatch(/Không thể chuyển/);
      expect(updateMany).not.toHaveBeenCalled();
      await app.close();
    },
  );

  it('409 khi yêu cầu khác chen vào giữa lúc đọc và lúc ghi', async () => {
    const { app } = await setup({ order: donReady, updateCount: 0 });
    await giao(app, 'ord_1', { pickupCode: '038417' }).expect(409);
    await app.close();
  });

  it('404 khi không có đơn', async () => {
    const { app } = await setup();
    await giao(app, 'ord_khong_co', { pickupCode: '038417' }).expect(404);
    await app.close();
  });

  it.each([
    ['thiếu pickupCode', {}],
    ['5 chữ số', { pickupCode: '12345' }],
    ['7 chữ số', { pickupCode: '1234567' }],
    ['có chữ cái', { pickupCode: '12a456' }],
    ['là số thay vì chuỗi', { pickupCode: 38417 }],
    ['trường thừa', { pickupCode: '038417', status: 'COMPLETED' }],
  ])('400 khi %s, không đụng tới CSDL', async (_ten, body) => {
    const { app, findUnique } = await setup({ order: donReady });
    await giao(app, 'ord_1', body).expect(400);
    expect(findUnique).not.toHaveBeenCalled();
    await app.close();
  });

  it.each(['CUSTOMER', 'BARISTA', 'MANAGER'])(
    '403 với vai trò %s và không đụng tới CSDL',
    async (role) => {
      const { app, findUnique, updateMany } = await setup({ order: donReady });
      await giao(app, 'ord_1', { pickupCode: '038417' }, role).expect(403);
      expect(findUnique).not.toHaveBeenCalled();
      expect(updateMany).not.toHaveBeenCalled();
      await app.close();
    },
  );
});
