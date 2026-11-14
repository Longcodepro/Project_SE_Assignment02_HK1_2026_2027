import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { createValidationPipe } from '../common/validation.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { MenuAdminController } from './menu-admin.controller.js';
import { MenuOptionsController } from './menu-options.controller.js';
import { MenuService } from './menu.service.js';

// Thay JwtAuthGuard: header x-role cho biết vai trò. RolesGuard là bản thật.
@Injectable()
class FakeJwtGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    req.user = { phone: '0900000003', role: req.headers['x-role'] ?? 'MANAGER' };
    return true;
  }
}

const notFound = () => Promise.reject({ code: 'P2025' });
const echo = (extra: Record<string, unknown> = {}) => ({ data, where }: any) =>
  Promise.resolve({ ...where, ...data, ...extra });

async function setup(opts: { categoryExists?: boolean; updateFails?: boolean; createError?: unknown } = {}) {
  const category = {
    findMany: vi.fn().mockResolvedValue([{ id: 1, name: 'Cà phê', isActive: true }]),
    findUnique: vi.fn().mockResolvedValue(opts.categoryExists === false ? null : { id: 1 }),
    create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 9, isActive: true, ...data })),
    update: vi.fn().mockImplementation(opts.updateFails ? notFound : echo()),
  };
  const product = {
    findMany: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: 9, ...data })),
    update: vi.fn().mockImplementation(opts.updateFails ? notFound : echo()),
  };
  const topping = {
    findMany: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockImplementation(({ data }) =>
      opts.createError ? Promise.reject(opts.createError) : Promise.resolve({ isActive: true, ...data }),
    ),
    update: vi.fn().mockImplementation(opts.updateFails ? notFound : echo()),
  };
  const sizeSurcharge = {
    findMany: vi.fn().mockResolvedValue([
      { size: 'L', extra: 10000 },
      { size: 'S', extra: 0 },
      { size: 'M', extra: 5000 },
    ]),
    update: vi.fn().mockImplementation(opts.updateFails ? notFound : echo()),
  };
  const moduleRef = await Test.createTestingModule({
    controllers: [MenuAdminController, MenuOptionsController],
    providers: [
      MenuService,
      { provide: PrismaService, useValue: { category, product, topping, sizeSurcharge } },
    ],
  })
    .overrideGuard(JwtAuthGuard)
    .useClass(FakeJwtGuard)
    .compile();
  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(createValidationPipe());
  await app.init();
  return { app, category, product, topping, sizeSurcharge };
}

const as = (app: any, role = 'MANAGER') => ({
  get: (url: string) => request(app.getHttpServer()).get(url).set('x-role', role),
  post: (url: string, body: object) => request(app.getHttpServer()).post(url).set('x-role', role).send(body),
  patch: (url: string, body: object) => request(app.getHttpServer()).patch(url).set('x-role', role).send(body),
});

describe('GET /menu-options (công khai)', () => {
  it('trả size theo thứ tự S, M, L và chỉ topping đang bán, sắp theo code; không cần vai trò', async () => {
    const { app, topping } = await setup();
    topping.findMany.mockResolvedValue([{ code: 'tran-chau', name: 'Trân châu đen', price: 8000 }]);

    const res = await as(app, 'CUSTOMER').get('/menu-options').expect(200);

    expect(res.body).toEqual({
      sizes: [
        { size: 'S', extra: 0 },
        { size: 'M', extra: 5000 },
        { size: 'L', extra: 10000 },
      ],
      toppings: [{ code: 'tran-chau', name: 'Trân châu đen', price: 8000 }],
    });
    expect(topping.findMany.mock.calls[0][0]).toMatchObject({ where: { isActive: true }, orderBy: { code: 'asc' } });
    await app.close();
  });
});

describe('danh mục /admin/categories', () => {
  it('GET: mọi danh mục theo id, không lọc isActive', async () => {
    const { app, category } = await setup();
    const res = await as(app).get('/admin/categories').expect(200);
    expect(res.body).toEqual([{ id: 1, name: 'Cà phê', isActive: true }]);
    expect(category.findMany.mock.calls[0][0]).not.toHaveProperty('where');
    await app.close();
  });

  it('POST: cắt khoảng trắng tên, tạo danh mục', async () => {
    const { app, category } = await setup();
    const res = await as(app).post('/admin/categories', { name: '  Trà sữa  ' }).expect(201);
    expect(res.body).toMatchObject({ name: 'Trà sữa', isActive: true });
    expect(category.create.mock.calls[0][0].data).toEqual({ name: 'Trà sữa' });
    await app.close();
  });

  it('PATCH: ẩn danh mục', async () => {
    const { app, category } = await setup();
    const res = await as(app).patch('/admin/categories/1', { isActive: false }).expect(200);
    expect(res.body.isActive).toBe(false);
    expect(category.update.mock.calls[0][0].where).toEqual({ id: 1 });
    await app.close();
  });

  it('PATCH: 404 khi không có danh mục', async () => {
    const { app } = await setup({ updateFails: true });
    await as(app).patch('/admin/categories/99', { name: 'x' }).expect(404);
    await app.close();
  });

  it.each([
    ['POST tên rỗng', 'post', '/admin/categories', { name: '   ' }],
    ['POST tên quá 50 ký tự', 'post', '/admin/categories', { name: 'a'.repeat(51) }],
    ['POST thiếu tên', 'post', '/admin/categories', {}],
    ['POST trường thừa', 'post', '/admin/categories', { name: 'x', isActive: false }],
    ['PATCH body rỗng', 'patch', '/admin/categories/1', {}],
    ['PATCH isActive là chuỗi', 'patch', '/admin/categories/1', { isActive: 'false' }],
    ['PATCH id không phải số', 'patch', '/admin/categories/abc', { name: 'x' }],
  ] as const)('400 khi %s', async (_ten, method, url, body) => {
    const { app, category } = await setup();
    await as(app)[method](url, body).expect(400);
    expect(category.create).not.toHaveBeenCalled();
    expect(category.update).not.toHaveBeenCalled();
    await app.close();
  });
});

describe('món /admin/products', () => {
  const hopLe = {
    name: 'Cà phê muối',
    description: 'Cà phê phủ kem muối',
    imageUrl: '/images/ca-phe-muoi.svg',
    price: 35000,
    categoryId: 1,
  };

  it('GET: mọi món theo id (kể cả danh mục ẩn)', async () => {
    const { app, product } = await setup();
    await as(app).get('/admin/products').expect(200);
    expect(product.findMany.mock.calls[0][0]).toMatchObject({ orderBy: { id: 'asc' } });
    expect(product.findMany.mock.calls[0][0]).not.toHaveProperty('where');
    await app.close();
  });

  it('POST: tạo món, mô tả tùy chọn lưu null khi bỏ trống', async () => {
    const { app, product } = await setup();
    await as(app).post('/admin/products', hopLe).expect(201);
    expect(product.create.mock.calls[0][0].data).toMatchObject({ ...hopLe });
    await as(app).post('/admin/products', { ...hopLe, description: undefined }).expect(201);
    expect(product.create.mock.calls[1][0].data.description).toBeNull();
    await app.close();
  });

  it('POST: 400 khi danh mục không tồn tại, không tạo món', async () => {
    const { app, product } = await setup({ categoryExists: false });
    const res = await as(app).post('/admin/products', hopLe).expect(400);
    expect(res.body.message).toBe('Danh mục không tồn tại');
    expect(product.create).not.toHaveBeenCalled();
    await app.close();
  });

  it('PATCH: đổi giá chỉ gửi trường price (không đụng trường khác)', async () => {
    const { app, product } = await setup();
    const res = await as(app).patch('/admin/products/1', { price: 32000 }).expect(200);
    expect(res.body.price).toBe(32000);
    const data = product.update.mock.calls[0][0].data;
    expect(data.price).toBe(32000);
    expect(data.name).toBeUndefined();
    await app.close();
  });

  it('PATCH: description null xóa mô tả; categoryId mới phải tồn tại', async () => {
    const { app, product, category } = await setup();
    await as(app).patch('/admin/products/1', { description: null, categoryId: 2 }).expect(200);
    expect(product.update.mock.calls[0][0].data).toMatchObject({ description: null, categoryId: 2 });
    expect(category.findUnique.mock.calls[0][0].where).toEqual({ id: 2 });
    await app.close();
  });

  it('PATCH: 400 khi categoryId mới không tồn tại, không sửa', async () => {
    const { app, product } = await setup({ categoryExists: false });
    await as(app).patch('/admin/products/1', { categoryId: 99 }).expect(400);
    expect(product.update).not.toHaveBeenCalled();
    await app.close();
  });

  it('PATCH: 404 khi không có món', async () => {
    const { app } = await setup({ updateFails: true });
    await as(app).patch('/admin/products/99', { price: 1000 }).expect(404);
    await app.close();
  });

  it.each([
    ['tên rỗng', { ...hopLe, name: '' }],
    ['giá 0', { ...hopLe, price: 0 }],
    ['giá âm', { ...hopLe, price: -5 }],
    ['giá thập phân', { ...hopLe, price: 100.5 }],
    ['giá quá 10 triệu', { ...hopLe, price: 10_000_001 }],
    ['ảnh không bắt đầu bằng / hay http', { ...hopLe, imageUrl: 'anh.png' }],
    ['ảnh javascript:', { ...hopLe, imageUrl: 'javascript:alert(1)' }],
    ['mô tả quá 500 ký tự', { ...hopLe, description: 'a'.repeat(501) }],
    ['thiếu categoryId', { name: 'x', imageUrl: '/a.svg', price: 1000 }],
    ['trường thừa', { ...hopLe, id: 5 }],
  ])('POST 400 khi %s', async (_ten, body) => {
    const { app, product } = await setup();
    await as(app).post('/admin/products', body).expect(400);
    expect(product.create).not.toHaveBeenCalled();
    await app.close();
  });

  it.each([
    ['body rỗng', {}],
    ['price null', { price: null }],
    ['isAvailable là chuỗi', { isAvailable: 'true' }],
    ['trường thừa', { price: 1000, category: 1 }],
  ])('PATCH 400 khi %s', async (_ten, body) => {
    const { app, product } = await setup();
    await as(app).patch('/admin/products/1', body).expect(400);
    expect(product.update).not.toHaveBeenCalled();
    await app.close();
  });
});

describe('topping /admin/toppings', () => {
  it('GET: mọi topping theo code', async () => {
    const { app, topping } = await setup();
    await as(app).get('/admin/toppings').expect(200);
    expect(topping.findMany.mock.calls[0][0]).toMatchObject({ orderBy: { code: 'asc' } });
    expect(topping.findMany.mock.calls[0][0]).not.toHaveProperty('where');
    await app.close();
  });

  it('POST: tạo topping mới đang bán', async () => {
    const { app, topping } = await setup();
    const res = await as(app).post('/admin/toppings', { code: 'pudding', name: ' Pudding ', price: 7000 }).expect(201);
    expect(res.body).toEqual({ code: 'pudding', name: 'Pudding', price: 7000, isActive: true });
    expect(topping.create.mock.calls[0][0].data).toEqual({ code: 'pudding', name: 'Pudding', price: 7000 });
    await app.close();
  });

  it('POST: 409 khi code đã tồn tại', async () => {
    const { app } = await setup({ createError: { code: 'P2002' } });
    const res = await as(app).post('/admin/toppings', { code: 'tran-chau', name: 'x', price: 1 }).expect(409);
    expect(res.body.message).toBe('Topping đã tồn tại');
    await app.close();
  });

  it('PATCH: đổi giá và ngừng bán, không đụng bảng đơn hàng', async () => {
    const { app, topping } = await setup();
    const res = await as(app).patch('/admin/toppings/tran-chau', { price: 9000, isActive: false }).expect(200);
    expect(res.body).toMatchObject({ code: 'tran-chau', price: 9000, isActive: false });
    expect(topping.update.mock.calls[0][0].where).toEqual({ code: 'tran-chau' });
    await app.close();
  });

  it('PATCH: 404 khi không có topping', async () => {
    const { app } = await setup({ updateFails: true });
    await as(app).patch('/admin/toppings/khong-co', { price: 1 }).expect(404);
    await app.close();
  });

  it.each([
    ['POST code viết hoa', 'post', '/admin/toppings', { code: 'Pudding', name: 'x', price: 1 }],
    ['POST code quá ngắn', 'post', '/admin/toppings', { code: 'p', name: 'x', price: 1 }],
    ['POST giá âm', 'post', '/admin/toppings', { code: 'pudding', name: 'x', price: -1 }],
    ['POST thiếu tên', 'post', '/admin/toppings', { code: 'pudding', price: 1 }],
    ['POST trường thừa', 'post', '/admin/toppings', { code: 'pudding', name: 'x', price: 1, isActive: false }],
    ['PATCH body rỗng', 'patch', '/admin/toppings/tran-chau', {}],
    ['PATCH không đổi được code', 'patch', '/admin/toppings/tran-chau', { code: 'khac' }],
    ['PATCH :code sai định dạng', 'patch', '/admin/toppings/TRAN_CHAU', { price: 1 }],
    ['PATCH price null', 'patch', '/admin/toppings/tran-chau', { price: null }],
  ] as const)('400 khi %s', async (_ten, method, url, body) => {
    const { app, topping } = await setup();
    await as(app)[method](url, body).expect(400);
    expect(topping.create).not.toHaveBeenCalled();
    expect(topping.update).not.toHaveBeenCalled();
    await app.close();
  });
});

describe('phụ thu size /admin/sizes', () => {
  it('GET: ba size theo thứ tự S, M, L', async () => {
    const { app } = await setup();
    const res = await as(app).get('/admin/sizes').expect(200);
    expect(res.body.map((s: any) => s.size)).toEqual(['S', 'M', 'L']);
    await app.close();
  });

  it('PATCH: đổi phụ thu một size', async () => {
    const { app, sizeSurcharge } = await setup();
    const res = await as(app).patch('/admin/sizes/M', { extra: 6000 }).expect(200);
    expect(res.body).toMatchObject({ size: 'M', extra: 6000 });
    expect(sizeSurcharge.update.mock.calls[0][0].where).toEqual({ size: 'M' });
    await app.close();
  });

  it('PATCH: 404 khi chưa cấu hình size', async () => {
    const { app } = await setup({ updateFails: true });
    await as(app).patch('/admin/sizes/L', { extra: 1 }).expect(404);
    await app.close();
  });

  it.each([
    ['size lạ', '/admin/sizes/XL', { extra: 1 }],
    ['size viết thường', '/admin/sizes/m', { extra: 1 }],
    ['extra âm', '/admin/sizes/M', { extra: -1 }],
    ['extra thập phân', '/admin/sizes/M', { extra: 1.5 }],
    ['thiếu extra', '/admin/sizes/M', {}],
    ['trường thừa', '/admin/sizes/M', { extra: 1, size: 'L' }],
  ])('400 khi %s', async (_ten, url, body) => {
    const { app, sizeSurcharge } = await setup();
    await as(app).patch(url, body).expect(400);
    expect(sizeSurcharge.update).not.toHaveBeenCalled();
    await app.close();
  });
});

describe('phân quyền', () => {
  it.each(['CUSTOMER', 'BARISTA', 'CASHIER'])('403 với vai trò %s trên mọi route /admin/*, không đụng tới CSDL', async (role) => {
    const { app, category, product, topping, sizeSurcharge } = await setup();
    const r = as(app, role);
    await r.get('/admin/categories').expect(403);
    await r.post('/admin/categories', { name: 'x' }).expect(403);
    await r.patch('/admin/categories/1', { name: 'x' }).expect(403);
    await r.get('/admin/products').expect(403);
    await r.post('/admin/products', { name: 'x', imageUrl: '/a.svg', price: 1, categoryId: 1 }).expect(403);
    await r.patch('/admin/products/1', { price: 1 }).expect(403);
    await r.get('/admin/toppings').expect(403);
    await r.post('/admin/toppings', { code: 'pudding', name: 'x', price: 1 }).expect(403);
    await r.patch('/admin/toppings/tran-chau', { price: 1 }).expect(403);
    await r.get('/admin/sizes').expect(403);
    await r.patch('/admin/sizes/M', { extra: 1 }).expect(403);
    for (const model of [category, product, topping, sizeSurcharge]) {
      for (const fn of Object.values(model)) expect(fn).not.toHaveBeenCalled();
    }
    await app.close();
  });
});
