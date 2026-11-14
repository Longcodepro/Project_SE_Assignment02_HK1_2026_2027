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
import { InventoryController } from './inventory.controller.js';
import { InventoryService } from './inventory.service.js';

// Thay JwtAuthGuard: header x-role và x-phone cho biết người dùng. RolesGuard là bản thật.
@Injectable()
class FakeJwtGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    req.user = {
      phone: req.headers['x-phone'] ?? '0900000003',
      role: req.headers['x-role'] ?? 'MANAGER',
    };
    return true;
  }
}

const createdAt = new Date('2026-11-15T03:00:00Z');

async function setup(
  opts: {
    notFound?: boolean;
    createError?: unknown;
    updateError?: unknown;
  } = {},
) {
  const ingredient = {
    findMany: vi
      .fn()
      .mockResolvedValue([
        {
          id: 1,
          name: 'Cà phê rang xay',
          unit: 'G',
          stock: 5000,
          minStock: 1000,
        },
      ]),
    findUnique: vi.fn().mockResolvedValue(opts.notFound ? null : { id: 1 }),
    create: vi
      .fn()
      .mockImplementation(({ data }) =>
        opts.createError
          ? Promise.reject(opts.createError)
          : Promise.resolve({
              id: 5,
              stock: 0,
              minStock: 0,
              ...stripUndefined(data),
            }),
      ),
    update: vi.fn().mockImplementation(({ where, data }) => {
      if (opts.notFound) return Promise.reject({ code: 'P2025' });
      if (opts.updateError) return Promise.reject(opts.updateError);
      // dùng cho cả đổi tên (PATCH) lẫn cộng tồn (nhập kho)
      return Promise.resolve({
        id: where.id,
        name: 'Cà phê',
        unit: 'G',
        minStock: 1000,
        ...stripUndefined(data),
        stock: 7000,
      });
    }),
  };
  const stockReceipt = {
    create: vi
      .fn()
      .mockImplementation(({ data }) =>
        Promise.resolve({ id: 7, createdAt, ...data }),
      ),
    findMany: vi
      .fn()
      .mockResolvedValue([
        {
          id: 7,
          ingredientId: 1,
          quantity: 2000,
          note: null,
          createdByPhone: '0900000001',
          createdAt,
        },
      ]),
  };
  const db = { ingredient, stockReceipt };
  const moduleRef = await Test.createTestingModule({
    controllers: [InventoryController],
    providers: [
      InventoryService,
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
  return { app, ingredient, stockReceipt };
}

const stripUndefined = (o: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));

const as = (app: any, role = 'MANAGER', phone = '0900000003') => ({
  get: (url: string) =>
    request(app.getHttpServer())
      .get(url)
      .set('x-role', role)
      .set('x-phone', phone),
  post: (url: string, body: object) =>
    request(app.getHttpServer())
      .post(url)
      .set('x-role', role)
      .set('x-phone', phone)
      .send(body),
  patch: (url: string, body: object) =>
    request(app.getHttpServer())
      .patch(url)
      .set('x-role', role)
      .set('x-phone', phone)
      .send(body),
});

describe('GET /admin/ingredients', () => {
  it.each(['MANAGER', 'BARISTA'])('%s xem được kho', async (role) => {
    const { app } = await setup();
    const res = await as(app, role).get('/admin/ingredients').expect(200);
    expect(res.body).toEqual([
      {
        id: 1,
        name: 'Cà phê rang xay',
        unit: 'G',
        stock: 5000,
        minStock: 1000,
        isLow: false,
      },
    ]);
    await app.close();
  });

  it('isLow đúng ở ranh giới: stock bằng minStock là sắp hết, hơn 1 thì chưa', async () => {
    const { app, ingredient } = await setup();
    ingredient.findMany.mockResolvedValue([
      { id: 1, name: 'A', unit: 'G', stock: 1000, minStock: 1000 },
      { id: 2, name: 'B', unit: 'G', stock: 1001, minStock: 1000 },
      { id: 3, name: 'C', unit: 'ML', stock: 0, minStock: 0 },
    ]);
    const res = await as(app).get('/admin/ingredients').expect(200);
    expect(res.body.map((i: any) => i.isLow)).toEqual([true, false, true]);
    await app.close();
  });

  it.each(['CUSTOMER', 'CASHIER'])('403 với vai trò %s', async (role) => {
    const { app, ingredient } = await setup();
    await as(app, role).get('/admin/ingredients').expect(403);
    expect(ingredient.findMany).not.toHaveBeenCalled();
    await app.close();
  });
});

describe('GET /admin/ingredients/alerts (cảnh báo sắp hết)', () => {
  const kho = [
    { id: 1, name: 'Cà phê', unit: 'G', stock: 900, minStock: 1000 },
    { id: 2, name: 'Sữa đặc', unit: 'ML', stock: 5000, minStock: 500 },
    { id: 3, name: 'Ly nhựa', unit: 'PIECE', stock: 0, minStock: 200 },
    { id: 4, name: 'Ống hút', unit: 'PIECE', stock: 100, minStock: 100 },
    { id: 5, name: 'Siro', unit: 'ML', stock: 0, minStock: 0 },
  ];

  it.each(['BARISTA', 'MANAGER'])(
    '%s: chỉ nguyên liệu stock <= minStock, thiếu nhiều nhất lên đầu',
    async (role) => {
      const { app, ingredient } = await setup();
      ingredient.findMany.mockResolvedValue(kho);

      const res = await as(app, role)
        .get('/admin/ingredients/alerts')
        .expect(200);

      // thiếu: Ly nhựa -200, Cà phê -100, Ống hút 0 và Siro 0 (bằng nhau theo id)
      expect(res.body.map((i: any) => i.id)).toEqual([3, 1, 4, 5]);
      expect(res.body.every((i: any) => i.isLow === true)).toBe(true);
      await app.close();
    },
  );

  it('không có nguyên liệu nào sắp hết thì trả mảng rỗng', async () => {
    const { app, ingredient } = await setup();
    ingredient.findMany.mockResolvedValue([kho[1]]);
    const res = await as(app).get('/admin/ingredients/alerts').expect(200);
    expect(res.body).toEqual([]);
    await app.close();
  });

  it.each(['CASHIER', 'CUSTOMER'])('403 với vai trò %s', async (role) => {
    const { app, ingredient } = await setup();
    await as(app, role).get('/admin/ingredients/alerts').expect(403);
    expect(ingredient.findMany).not.toHaveBeenCalled();
    await app.close();
  });
});

describe('POST /admin/ingredients (MANAGER)', () => {
  it('tạo nguyên liệu mới, tồn mặc định 0, minStock mặc định 0', async () => {
    const { app, ingredient } = await setup();
    const res = await as(app)
      .post('/admin/ingredients', { name: '  Sữa đặc ', unit: 'ML' })
      .expect(201);
    expect(res.body).toMatchObject({
      name: 'Sữa đặc',
      unit: 'ML',
      stock: 0,
      minStock: 0,
    });
    expect(ingredient.create.mock.calls[0][0].data).toEqual({
      name: 'Sữa đặc',
      unit: 'ML',
    });
    await app.close();
  });

  it('409 khi tên trùng (P2002)', async () => {
    const { app } = await setup({ createError: { code: 'P2002' } });
    const res = await as(app)
      .post('/admin/ingredients', { name: 'Sữa đặc', unit: 'ML' })
      .expect(409);
    expect(res.body.message).toBe('Nguyên liệu đã tồn tại');
    await app.close();
  });

  it.each([
    ['thiếu unit', { name: 'Đường' }],
    ['unit lạ', { name: 'Đường', unit: 'KG' }],
    ['tên rỗng', { name: ' ', unit: 'G' }],
    ['minStock âm', { name: 'Đường', unit: 'G', minStock: -1 }],
    [
      'không cho đặt tồn ban đầu (stock)',
      { name: 'Đường', unit: 'G', stock: 100 },
    ],
  ])('400 khi %s', async (_ten, body) => {
    const { app, ingredient } = await setup();
    await as(app).post('/admin/ingredients', body).expect(400);
    expect(ingredient.create).not.toHaveBeenCalled();
    await app.close();
  });

  it.each(['BARISTA', 'CASHIER', 'CUSTOMER'])(
    '403 với vai trò %s (Barista chỉ nhập kho, không tạo nguyên liệu)',
    async (role) => {
      const { app, ingredient } = await setup();
      await as(app, role)
        .post('/admin/ingredients', { name: 'Đường', unit: 'G' })
        .expect(403);
      expect(ingredient.create).not.toHaveBeenCalled();
      await app.close();
    },
  );
});

describe('PATCH /admin/ingredients/:id (MANAGER)', () => {
  it('đổi tên và ngưỡng; chỉ gửi trường nào sửa trường đó', async () => {
    const { app, ingredient } = await setup();
    await as(app).patch('/admin/ingredients/1', { minStock: 800 }).expect(200);
    const data = ingredient.update.mock.calls[0][0].data;
    expect(data.minStock).toBe(800);
    expect(data.name).toBeUndefined();
    await app.close();
  });

  it('404 khi không có nguyên liệu; 409 khi tên trùng', async () => {
    const a = await setup({ notFound: true });
    await as(a.app).patch('/admin/ingredients/9', { name: 'x' }).expect(404);
    await a.app.close();
    const b = await setup({ updateError: { code: 'P2002' } });
    await as(b.app)
      .patch('/admin/ingredients/1', { name: 'Sữa đặc' })
      .expect(409);
    await b.app.close();
  });

  it.each([
    ['body rỗng', {}],
    ['sửa trực tiếp tồn kho (stock)', { stock: 99999 }],
    ['đổi đơn vị (unit)', { unit: 'ML' }],
    ['minStock âm', { minStock: -5 }],
  ])('400 khi %s, không ghi', async (_ten, body) => {
    const { app, ingredient } = await setup();
    await as(app).patch('/admin/ingredients/1', body).expect(400);
    expect(ingredient.update).not.toHaveBeenCalled();
    await app.close();
  });

  it('403 với BARISTA', async () => {
    const { app, ingredient } = await setup();
    await as(app, 'BARISTA')
      .patch('/admin/ingredients/1', { minStock: 1 })
      .expect(403);
    expect(ingredient.update).not.toHaveBeenCalled();
    await app.close();
  });
});

describe('POST /admin/ingredients/:id/receipts (nhập kho)', () => {
  it.each([
    ['BARISTA', '0900000001'],
    ['MANAGER', '0900000003'],
  ])(
    '%s nhập kho: cộng tồn, ghi người thực hiện là người trong token',
    async (role, phone) => {
      const { app, ingredient, stockReceipt } = await setup();

      const res = await as(app, role, phone)
        .post('/admin/ingredients/1/receipts', {
          quantity: 2000,
          note: ' Nhập hàng NCC A ',
        })
        .expect(201);

      expect(ingredient.update.mock.calls[0][0]).toMatchObject({
        where: { id: 1 },
        data: { stock: { increment: 2000 } },
      });
      expect(stockReceipt.create.mock.calls[0][0].data).toEqual({
        ingredientId: 1,
        quantity: 2000,
        note: 'Nhập hàng NCC A',
        createdByPhone: phone,
      });
      expect(res.body).toMatchObject({
        id: 7,
        ingredientId: 1,
        quantity: 2000,
        createdByPhone: phone,
        stock: 7000,
      });
      await app.close();
    },
  );

  it('không có ghi chú thì lưu null', async () => {
    const { app, stockReceipt } = await setup();
    await as(app)
      .post('/admin/ingredients/1/receipts', { quantity: 5 })
      .expect(201);
    expect(stockReceipt.create.mock.calls[0][0].data.note).toBeNull();
    await app.close();
  });

  it('404 khi không có nguyên liệu, không ghi phiếu', async () => {
    const { app, stockReceipt } = await setup({ notFound: true });
    await as(app)
      .post('/admin/ingredients/9/receipts', { quantity: 5 })
      .expect(404);
    expect(stockReceipt.create).not.toHaveBeenCalled();
    await app.close();
  });

  it.each([
    ['số lượng 0', { quantity: 0 }],
    ['số lượng âm (trừ kho lén)', { quantity: -100 }],
    ['số lượng thập phân', { quantity: 1.5 }],
    ['số lượng quá lớn', { quantity: 100_000_001 }],
    ['thiếu số lượng', {}],
    ['ghi chú quá 200 ký tự', { quantity: 1, note: 'a'.repeat(201) }],
    [
      'trường thừa (createdByPhone)',
      { quantity: 1, createdByPhone: '0911111111' },
    ],
  ])('400 khi %s, không ghi gì', async (_ten, body) => {
    const { app, ingredient, stockReceipt } = await setup();
    await as(app).post('/admin/ingredients/1/receipts', body).expect(400);
    expect(ingredient.update).not.toHaveBeenCalled();
    expect(stockReceipt.create).not.toHaveBeenCalled();
    await app.close();
  });

  it.each(['CASHIER', 'CUSTOMER'])('403 với vai trò %s', async (role) => {
    const { app, ingredient } = await setup();
    await as(app, role)
      .post('/admin/ingredients/1/receipts', { quantity: 5 })
      .expect(403);
    expect(ingredient.update).not.toHaveBeenCalled();
    await app.close();
  });
});

describe('GET /admin/ingredients/:id/receipts (lịch sử)', () => {
  it('mặc định 50 phiếu mới nhất trước; BARISTA xem được', async () => {
    const { app, stockReceipt } = await setup();
    const res = await as(app, 'BARISTA')
      .get('/admin/ingredients/1/receipts')
      .expect(200);
    expect(stockReceipt.findMany.mock.calls[0][0]).toMatchObject({
      where: { ingredientId: 1 },
      orderBy: { id: 'desc' },
      take: 50,
    });
    expect(res.body[0]).toMatchObject({
      id: 7,
      quantity: 2000,
      createdByPhone: '0900000001',
    });
    await app.close();
  });

  it('limit tùy chọn trong khoảng 1 đến 200', async () => {
    const { app, stockReceipt } = await setup();
    await as(app).get('/admin/ingredients/1/receipts?limit=200').expect(200);
    expect(stockReceipt.findMany.mock.calls[0][0].take).toBe(200);
    await app.close();
  });

  it.each(['0', '201', 'abc'])('400 khi limit=%s', async (limit) => {
    const { app, stockReceipt } = await setup();
    await as(app)
      .get(`/admin/ingredients/1/receipts?limit=${limit}`)
      .expect(400);
    expect(stockReceipt.findMany).not.toHaveBeenCalled();
    await app.close();
  });

  it('404 khi không có nguyên liệu', async () => {
    const { app } = await setup({ notFound: true });
    await as(app).get('/admin/ingredients/9/receipts').expect(404);
    await app.close();
  });

  it('403 với CASHIER', async () => {
    const { app } = await setup();
    await as(app, 'CASHIER').get('/admin/ingredients/1/receipts').expect(403);
    await app.close();
  });
});
