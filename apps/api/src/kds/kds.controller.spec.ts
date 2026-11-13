import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { createValidationPipe } from '../common/validation.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { KdsController } from './kds.controller.js';
import { KdsService } from './kds.service.js';

// Thay JwtAuthGuard: header x-role cho biết vai trò. RolesGuard là bản thật.
@Injectable()
class FakeJwtGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    req.user = { phone: '0900000001', role: req.headers['x-role'] ?? 'BARISTA' };
    return true;
  }
}

const dongDon = (id: string, status: string, version: number, createdAt: string) => ({
  id,
  status,
  version,
  createdAt: new Date(createdAt),
  items: [{ quantity: 2, size: 'M', toppings: ['tran-chau'], product: { name: 'Cà phê sữa' } }],
});

async function setup(opts: { order?: any; updateCount?: number; orders?: any[] } = {}) {
  const findMany = vi.fn().mockResolvedValue(opts.orders ?? []);
  const findUnique = vi.fn().mockResolvedValue(opts.order ?? null);
  const updateMany = vi.fn().mockResolvedValue({ count: opts.updateCount ?? 1 });
  const moduleRef = await Test.createTestingModule({
    controllers: [KdsController],
    providers: [
      KdsService,
      { provide: PrismaService, useValue: { order: { findMany, findUnique, updateMany } } },
    ],
  })
    .overrideGuard(JwtAuthGuard)
    .useClass(FakeJwtGuard)
    .compile();
  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(createValidationPipe());
  await app.init();
  return { app, findMany, findUnique, updateMany };
}

describe('GET /kds/orders', () => {
  it('chỉ lấy đơn PAID và PREPARING, cũ nhất lên đầu, trả đúng hình dạng hợp đồng', async () => {
    const { app, findMany } = await setup({
      orders: [dongDon('ord_1', 'PAID', 1, '2026-11-13T01:00:00Z'), dongDon('ord_2', 'PREPARING', 2, '2026-11-13T02:00:00Z')],
    });

    const res = await request(app.getHttpServer()).get('/kds/orders').expect(200);

    const query = findMany.mock.calls[0][0];
    expect(query.where).toEqual({ status: { in: ['PAID', 'PREPARING'] } });
    expect(query.orderBy).toEqual({ createdAt: 'asc' });
    expect(res.body[0]).toEqual({
      id: 'ord_1',
      status: 'PAID',
      version: 1,
      createdAt: '2026-11-13T01:00:00.000Z',
      items: [{ quantity: 2, size: 'M', toppings: ['tran-chau'], productName: 'Cà phê sữa' }],
    });
    expect(res.body.map((o: any) => o.id)).toEqual(['ord_1', 'ord_2']);
    await app.close();
  });

  it('không có đơn thì trả mảng rỗng', async () => {
    const { app } = await setup();
    const res = await request(app.getHttpServer()).get('/kds/orders').expect(200);
    expect(res.body).toEqual([]);
    await app.close();
  });

  it.each(['CUSTOMER', 'CASHIER', 'MANAGER'])('403 với vai trò %s và không đụng tới CSDL', async (role) => {
    const { app, findMany } = await setup();
    const res = await request(app.getHttpServer()).get('/kds/orders').set('x-role', role).expect(403);
    expect(res.body.message).toBe('Không đủ quyền truy cập');
    expect(findMany).not.toHaveBeenCalled();
    await app.close();
  });
});

describe('PATCH /kds/orders/:id/status', () => {
  const doi = (app: any, id: string, body: object, role = 'BARISTA') =>
    request(app.getHttpServer()).patch(`/kds/orders/${id}/status`).set('x-role', role).send(body);

  it('PAID → PREPARING: ghi có điều kiện version và trạng thái, trả version tăng 1', async () => {
    const { app, updateMany } = await setup({ order: { id: 'ord_1', status: 'PAID', version: 1 } });

    const res = await doi(app, 'ord_1', { status: 'PREPARING', version: 1 }).expect(200);

    expect(res.body).toEqual({ id: 'ord_1', status: 'PREPARING', version: 2 });
    expect(updateMany).toHaveBeenCalledWith({
      where: { id: 'ord_1', version: 1, status: 'PAID' },
      data: { status: 'PREPARING', version: { increment: 1 } },
    });
    await app.close();
  });

  it('PREPARING → READY', async () => {
    const { app } = await setup({ order: { id: 'ord_1', status: 'PREPARING', version: 2 } });
    const res = await doi(app, 'ord_1', { status: 'READY', version: 2 }).expect(200);
    expect(res.body).toEqual({ id: 'ord_1', status: 'READY', version: 3 });
    await app.close();
  });

  it('409 khi version không khớp, không ghi gì', async () => {
    const { app, updateMany } = await setup({ order: { id: 'ord_1', status: 'PAID', version: 3 } });
    const res = await doi(app, 'ord_1', { status: 'PREPARING', version: 1 }).expect(409);
    expect(res.body.message).toMatch(/vừa được cập nhật/);
    expect(updateMany).not.toHaveBeenCalled();
    await app.close();
  });

  it('409 khi yêu cầu khác chen vào giữa lúc đọc và lúc ghi (updateMany không khớp dòng nào)', async () => {
    const { app } = await setup({ order: { id: 'ord_1', status: 'PAID', version: 1 }, updateCount: 0 });
    await doi(app, 'ord_1', { status: 'PREPARING', version: 1 }).expect(409);
    await app.close();
  });

  it.each([
    ['PAID', 'READY'],
    ['PREPARING', 'PREPARING'],
    ['READY', 'PREPARING'],
    ['CANCELLED', 'PREPARING'],
    ['PENDING', 'PREPARING'],
    ['COMPLETED', 'READY'],
  ])('409 khi chuyển sai thứ tự %s → %s', async (from, to) => {
    const { app, updateMany } = await setup({ order: { id: 'ord_1', status: from, version: 1 } });
    const res = await doi(app, 'ord_1', { status: to, version: 1 }).expect(409);
    expect(res.body.message).toMatch(/Không thể chuyển/);
    expect(updateMany).not.toHaveBeenCalled();
    await app.close();
  });

  it('404 khi không có đơn', async () => {
    const { app } = await setup();
    await doi(app, 'ord_khong_co', { status: 'PREPARING', version: 0 }).expect(404);
    await app.close();
  });

  it.each([
    ['status ngoài PREPARING/READY', { status: 'COMPLETED', version: 1 }],
    ['thiếu status', { version: 1 }],
    ['thiếu version', { status: 'PREPARING' }],
    ['version là chuỗi', { status: 'PREPARING', version: '1' }],
    ['version âm', { status: 'PREPARING', version: -1 }],
    ['trường thừa', { status: 'PREPARING', version: 1, total: 0 }],
  ])('400 khi %s', async (_ten, body) => {
    const { app, findUnique } = await setup({ order: { id: 'ord_1', status: 'PAID', version: 1 } });
    await doi(app, 'ord_1', body).expect(400);
    expect(findUnique).not.toHaveBeenCalled();
    await app.close();
  });

  it.each(['CUSTOMER', 'CASHIER', 'MANAGER'])('403 với vai trò %s và không đụng tới CSDL', async (role) => {
    const { app, findUnique, updateMany } = await setup({ order: { id: 'ord_1', status: 'PAID', version: 1 } });
    await doi(app, 'ord_1', { status: 'PREPARING', version: 1 }, role).expect(403);
    expect(findUnique).not.toHaveBeenCalled();
    expect(updateMany).not.toHaveBeenCalled();
    await app.close();
  });
});
