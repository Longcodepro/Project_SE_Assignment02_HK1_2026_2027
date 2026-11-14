import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { createValidationPipe } from '../common/validation.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PromotionsController } from './promotions.controller.js';
import { PromotionsService } from './promotions.service.js';

// Thay JwtAuthGuard: header x-role cho biết vai trò. RolesGuard là bản thật.
@Injectable()
class FakeJwtGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    req.user = { phone: '0900000003', role: req.headers['x-role'] ?? 'MANAGER' };
    return true;
  }
}

const hienTai = {
  id: 1,
  code: 'WELCOME10',
  discountType: 'PERCENT',
  discountValue: 10,
  minOrderAmount: 50000,
  isActive: true,
  expiryDate: null,
  maxUses: 100,
  usedCount: 40,
};

async function setup(opts: { found?: Record<string, unknown> | null; createError?: unknown } = {}) {
  const findUnique = vi.fn().mockResolvedValue(opts.found === undefined ? hienTai : opts.found);
  const findMany = vi.fn().mockResolvedValue([hienTai]);
  const create = vi.fn().mockImplementation(({ data }) =>
    opts.createError
      ? Promise.reject(opts.createError)
      : Promise.resolve({ id: 9, isActive: true, usedCount: 0, minOrderAmount: 0, ...data }),
  );
  const update = vi.fn().mockImplementation(({ data }) => Promise.resolve({ ...hienTai, ...stripUndefined(data) }));
  const moduleRef = await Test.createTestingModule({
    controllers: [PromotionsController],
    providers: [
      PromotionsService,
      { provide: PrismaService, useValue: { promotion: { findUnique, findMany, create, update } } },
    ],
  })
    .overrideGuard(JwtAuthGuard)
    .useClass(FakeJwtGuard)
    .compile();
  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(createValidationPipe());
  await app.init();
  return { app, findUnique, findMany, create, update };
}

const stripUndefined = (o: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));

describe('GET /admin/promotions', () => {
  it('liệt kê mọi mã, mới tạo nhất lên đầu', async () => {
    const { app, findMany } = await setup();
    const res = await request(app.getHttpServer()).get('/admin/promotions').expect(200);
    expect(findMany.mock.calls[0][0].orderBy).toEqual({ id: 'desc' });
    expect(findMany.mock.calls[0][0]).not.toHaveProperty('where');
    expect(res.body).toEqual([hienTai]);
    await app.close();
  });

  it.each(['CUSTOMER', 'BARISTA', 'CASHIER'])('403 với vai trò %s', async (role) => {
    const { app, findMany } = await setup();
    await request(app.getHttpServer()).get('/admin/promotions').set('x-role', role).expect(403);
    expect(findMany).not.toHaveBeenCalled();
    await app.close();
  });
});

describe('POST /admin/promotions', () => {
  const tao = (app: any, body: object, role = 'MANAGER') =>
    request(app.getHttpServer()).post('/admin/promotions').set('x-role', role).send(body);
  const hopLe = {
    code: 'tet2027',
    discountType: 'PERCENT',
    discountValue: 15,
    minOrderAmount: 60000,
    expiryDate: '2027-02-20T16:59:59.000Z',
    maxUses: 200,
  };

  it('tạo mã: đổi code thành chữ hoa, đổi hạn dùng thành Date', async () => {
    const { app, create } = await setup();
    const res = await tao(app, hopLe).expect(201);
    expect(res.body).toMatchObject({ code: 'TET2027', discountType: 'PERCENT', discountValue: 15, maxUses: 200 });
    const data = create.mock.calls[0][0].data;
    expect(data).toEqual({
      code: 'TET2027',
      discountType: 'PERCENT',
      discountValue: 15,
      minOrderAmount: 60000,
      expiryDate: new Date('2027-02-20T16:59:59.000Z'),
      maxUses: 200,
    });
    await app.close();
  });

  it('bỏ trống hạn dùng và số lượt: lưu null (không hết hạn, không giới hạn)', async () => {
    const { app, create } = await setup();
    await tao(app, { code: 'GIAM15K', discountType: 'FIXED', discountValue: 15000 }).expect(201);
    expect(create.mock.calls[0][0].data).toMatchObject({ expiryDate: null, maxUses: null });
    await app.close();
  });

  it('409 khi mã đã tồn tại (P2002)', async () => {
    const { app } = await setup({ createError: { code: 'P2002' } });
    const res = await tao(app, hopLe).expect(409);
    expect(res.body.message).toBe('Mã giảm giá đã tồn tại');
    await app.close();
  });

  it.each([
    ['PERCENT trên 100', { ...hopLe, discountValue: 101 }],
    ['giá trị 0', { ...hopLe, discountValue: 0 }],
    ['giá trị thập phân', { ...hopLe, discountValue: 10.5 }],
    ['FIXED quá 10 triệu', { ...hopLe, discountType: 'FIXED', discountValue: 10_000_001 }],
    ['kiểu giảm lạ', { ...hopLe, discountType: 'BOGO' }],
    ['code quá ngắn', { ...hopLe, code: 'ab' }],
    ['code có khoảng trắng', { ...hopLe, code: 'TET 2027' }],
    ['đơn tối thiểu âm', { ...hopLe, minOrderAmount: -1 }],
    ['hạn dùng sai định dạng', { ...hopLe, expiryDate: '20/02/2027' }],
    ['maxUses 0', { ...hopLe, maxUses: 0 }],
    ['thiếu discountType', { code: 'TET2027', discountValue: 10 }],
    ['trường thừa usedCount', { ...hopLe, usedCount: 5 }],
    ['trường thừa isActive', { ...hopLe, isActive: false }],
  ])('400 khi %s, không ghi gì', async (_ten, body) => {
    const { app, create } = await setup();
    await tao(app, body).expect(400);
    expect(create).not.toHaveBeenCalled();
    await app.close();
  });

  it.each(['CUSTOMER', 'BARISTA', 'CASHIER'])('403 với vai trò %s, không ghi gì', async (role) => {
    const { app, create } = await setup();
    await tao(app, hopLe, role).expect(403);
    expect(create).not.toHaveBeenCalled();
    await app.close();
  });
});

describe('PATCH /admin/promotions/:id', () => {
  const sua = (app: any, id: string | number, body: object, role = 'MANAGER') =>
    request(app.getHttpServer()).patch(`/admin/promotions/${id}`).set('x-role', role).send(body);

  it('vô hiệu mã', async () => {
    const { app, update } = await setup();
    const res = await sua(app, 1, { isActive: false }).expect(200);
    expect(res.body.isActive).toBe(false);
    expect(update.mock.calls[0][0].where).toEqual({ id: 1 });
    expect(update.mock.calls[0][0].data.isActive).toBe(false);
    await app.close();
  });

  it('kích hoạt lại mã', async () => {
    const { app, update } = await setup({ found: { ...hienTai, isActive: false } });
    await sua(app, 1, { isActive: true }).expect(200);
    expect(update.mock.calls[0][0].data.isActive).toBe(true);
    await app.close();
  });

  it('sửa giá trị, đơn tối thiểu; chỉ gửi trường nào sửa trường đó', async () => {
    const { app, update } = await setup();
    await sua(app, 1, { discountValue: 20, minOrderAmount: 80000 }).expect(200);
    const data = update.mock.calls[0][0].data;
    expect(data).toMatchObject({ discountValue: 20, minOrderAmount: 80000 });
    expect(data.isActive).toBeUndefined();
    expect(data.expiryDate).toBeUndefined();
    await app.close();
  });

  it('expiryDate null bỏ hạn; maxUses null bỏ giới hạn', async () => {
    const { app, update } = await setup({ found: { ...hienTai, expiryDate: new Date('2027-01-01') } });
    await sua(app, 1, { expiryDate: null, maxUses: null }).expect(200);
    expect(update.mock.calls[0][0].data).toMatchObject({ expiryDate: null, maxUses: null });
    await app.close();
  });

  it('đặt hạn dùng mới', async () => {
    const { app, update } = await setup();
    await sua(app, 1, { expiryDate: '2027-02-20T16:59:59.000Z' }).expect(200);
    expect(update.mock.calls[0][0].data.expiryDate).toEqual(new Date('2027-02-20T16:59:59.000Z'));
    await app.close();
  });

  it('đổi sang FIXED thì giá trị hiện tại (10) vẫn hợp lệ; đổi sang PERCENT với giá trị FIXED lớn thì 400', async () => {
    const { app, update } = await setup();
    await sua(app, 1, { discountType: 'FIXED' }).expect(200);
    expect(update).toHaveBeenCalledTimes(1);

    const fixed = await setup({ found: { ...hienTai, discountType: 'FIXED', discountValue: 15000 } });
    const res = await sua(fixed.app, 1, { discountType: 'PERCENT' }).expect(400);
    expect(res.body.message).toMatch(/PERCENT phải từ 1 đến 100/);
    expect(fixed.update).not.toHaveBeenCalled();
    await app.close();
    await fixed.app.close();
  });

  it('400 khi PERCENT được sửa lên trên 100', async () => {
    const { app, update } = await setup();
    await sua(app, 1, { discountValue: 150 }).expect(400);
    expect(update).not.toHaveBeenCalled();
    await app.close();
  });

  it('maxUses nhỏ hơn số lượt đã dùng (40): 400; bằng đúng số đã dùng thì được', async () => {
    const { app, update } = await setup();
    const res = await sua(app, 1, { maxUses: 39 }).expect(400);
    expect(res.body.message).toBe('Tổng lượt tối đa không được nhỏ hơn số lượt đã dùng');
    expect(update).not.toHaveBeenCalled();
    await sua(app, 1, { maxUses: 40 }).expect(200);
    await app.close();
  });

  it('404 khi không có mã', async () => {
    const { app, update } = await setup({ found: null });
    await sua(app, 99, { isActive: false }).expect(404);
    expect(update).not.toHaveBeenCalled();
    await app.close();
  });

  it.each([
    ['body rỗng', {}],
    ['code (không đổi được)', { code: 'KHAC' }],
    ['usedCount', { usedCount: 0 }],
    ['isActive là chuỗi', { isActive: 'false' }],
    ['discountValue null', { discountValue: null }],
    ['minOrderAmount null', { minOrderAmount: null }],
    ['hạn dùng sai định dạng', { expiryDate: 'mai' }],
    ['maxUses 0', { maxUses: 0 }],
  ])('400 khi %s, không ghi gì', async (_ten, body) => {
    const { app, update } = await setup();
    await sua(app, 1, body).expect(400);
    expect(update).not.toHaveBeenCalled();
    await app.close();
  });

  it('400 khi :id không phải số nguyên', async () => {
    const { app, findUnique } = await setup();
    await sua(app, 'abc', { isActive: false }).expect(400);
    expect(findUnique).not.toHaveBeenCalled();
    await app.close();
  });

  it.each(['CUSTOMER', 'BARISTA', 'CASHIER'])('403 với vai trò %s, không đụng tới CSDL', async (role) => {
    const { app, findUnique, update } = await setup();
    await sua(app, 1, { isActive: false }, role).expect(403);
    expect(findUnique).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    await app.close();
  });
});
