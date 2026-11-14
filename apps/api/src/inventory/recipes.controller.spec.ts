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
import { InventoryService } from './inventory.service.js';
import { RecipesController } from './recipes.controller.js';

// Thay JwtAuthGuard: header x-role cho biết vai trò. RolesGuard là bản thật.
@Injectable()
class FakeJwtGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    req.user = {
      phone: '0900000003',
      role: req.headers['x-role'] ?? 'MANAGER',
    };
    return true;
  }
}

const caPhe = { name: 'Cà phê rang xay', unit: 'G' };
const traiChau = { name: 'Trân châu', unit: 'G' };

async function setup(
  opts: {
    noProduct?: boolean;
    noTopping?: boolean;
    existingIngredients?: number[];
  } = {},
) {
  const have = (opts.existingIngredients ?? [1, 2, 3]).map((id) => ({ id }));
  const db = {
    product: {
      findUnique: vi.fn().mockResolvedValue(opts.noProduct ? null : { id: 1 }),
    },
    topping: {
      findUnique: vi
        .fn()
        .mockResolvedValue(opts.noTopping ? null : { code: 'tran-chau' }),
    },
    ingredient: {
      findMany: vi
        .fn()
        .mockImplementation(({ where }) =>
          Promise.resolve(have.filter((h) => where.id.in.includes(h.id))),
        ),
    },
    recipeItem: {
      findMany: vi.fn().mockResolvedValue([
        {
          size: 'M',
          ingredientId: 2,
          quantity: 30,
          ingredient: { name: 'Sữa đặc', unit: 'ML' },
        },
        { size: 'L', ingredientId: 1, quantity: 22, ingredient: caPhe },
        { size: 'S', ingredientId: 1, quantity: 15, ingredient: caPhe },
        { size: 'M', ingredientId: 1, quantity: 18, ingredient: caPhe },
      ]),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    toppingRecipeItem: {
      findMany: vi
        .fn()
        .mockResolvedValue([
          { ingredientId: 3, quantity: 30, ingredient: traiChau },
        ]),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
  };
  const moduleRef = await Test.createTestingModule({
    controllers: [RecipesController],
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
  return { app, ...db };
}

const as = (app: any, role = 'MANAGER') => ({
  get: (url: string) =>
    request(app.getHttpServer()).get(url).set('x-role', role),
  put: (url: string, body: object) =>
    request(app.getHttpServer()).put(url).set('x-role', role).send(body),
});

describe('công thức món /admin/products/:id/recipe', () => {
  it('GET: sắp theo size S, M, L rồi ingredientId, kèm tên và đơn vị nguyên liệu', async () => {
    const { app } = await setup();
    const res = await as(app).get('/admin/products/1/recipe').expect(200);
    expect(res.body).toEqual({
      productId: 1,
      items: [
        {
          size: 'S',
          ingredientId: 1,
          quantity: 15,
          ingredientName: 'Cà phê rang xay',
          unit: 'G',
        },
        {
          size: 'M',
          ingredientId: 1,
          quantity: 18,
          ingredientName: 'Cà phê rang xay',
          unit: 'G',
        },
        {
          size: 'M',
          ingredientId: 2,
          quantity: 30,
          ingredientName: 'Sữa đặc',
          unit: 'ML',
        },
        {
          size: 'L',
          ingredientId: 1,
          quantity: 22,
          ingredientName: 'Cà phê rang xay',
          unit: 'G',
        },
      ],
    });
    await app.close();
  });

  it('GET: món chưa có công thức trả items rỗng', async () => {
    const { app, recipeItem } = await setup();
    recipeItem.findMany.mockResolvedValue([]);
    const res = await as(app).get('/admin/products/1/recipe').expect(200);
    expect(res.body).toEqual({ productId: 1, items: [] });
    await app.close();
  });

  it('GET và PUT: 404 khi không có món', async () => {
    const { app, recipeItem } = await setup({ noProduct: true });
    await as(app).get('/admin/products/9/recipe').expect(404);
    await as(app).put('/admin/products/9/recipe', { items: [] }).expect(404);
    expect(recipeItem.deleteMany).not.toHaveBeenCalled();
    await app.close();
  });

  it('PUT: thay toàn bộ (xóa cũ rồi tạo mới) trong một transaction và trả công thức mới', async () => {
    const { app, recipeItem } = await setup();
    const items = [
      { size: 'M', ingredientId: 1, quantity: 18 },
      { size: 'L', ingredientId: 1, quantity: 22 },
    ];

    const res = await as(app)
      .put('/admin/products/1/recipe', { items })
      .expect(200);

    expect(recipeItem.deleteMany).toHaveBeenCalledWith({
      where: { productId: 1 },
    });
    expect(recipeItem.createMany).toHaveBeenCalledWith({
      data: [
        { productId: 1, size: 'M', ingredientId: 1, quantity: 18 },
        { productId: 1, size: 'L', ingredientId: 1, quantity: 22 },
      ],
    });
    expect(res.body.productId).toBe(1);
    await app.close();
  });

  it('PUT: items rỗng xóa công thức, không gọi createMany', async () => {
    const { app, recipeItem } = await setup();
    await as(app).put('/admin/products/1/recipe', { items: [] }).expect(200);
    expect(recipeItem.deleteMany).toHaveBeenCalledTimes(1);
    expect(recipeItem.createMany).not.toHaveBeenCalled();
    await app.close();
  });

  it('PUT: 400 khi trùng cặp (size, nguyên liệu); cùng nguyên liệu khác size thì được', async () => {
    const { app, recipeItem } = await setup();
    const res = await as(app)
      .put('/admin/products/1/recipe', {
        items: [
          { size: 'M', ingredientId: 1, quantity: 18 },
          { size: 'M', ingredientId: 1, quantity: 20 },
        ],
      })
      .expect(400);
    expect(res.body.message).toMatch(/một lần/);
    expect(recipeItem.deleteMany).not.toHaveBeenCalled();
    await as(app)
      .put('/admin/products/1/recipe', {
        items: [
          { size: 'S', ingredientId: 1, quantity: 15 },
          { size: 'M', ingredientId: 1, quantity: 18 },
        ],
      })
      .expect(200);
    await app.close();
  });

  it('PUT: 400 khi nguyên liệu không tồn tại, không xóa công thức cũ', async () => {
    const { app, recipeItem } = await setup({ existingIngredients: [1] });
    const res = await as(app)
      .put('/admin/products/1/recipe', {
        items: [{ size: 'M', ingredientId: 99, quantity: 5 }],
      })
      .expect(400);
    expect(res.body.message).toBe('Nguyên liệu không tồn tại: 99');
    expect(recipeItem.deleteMany).not.toHaveBeenCalled();
    await app.close();
  });

  it.each([
    ['thiếu items', {}],
    ['items không phải mảng', { items: 'x' }],
    ['size lạ', { items: [{ size: 'XL', ingredientId: 1, quantity: 1 }] }],
    ['quantity 0', { items: [{ size: 'M', ingredientId: 1, quantity: 0 }] }],
    ['quantity âm', { items: [{ size: 'M', ingredientId: 1, quantity: -3 }] }],
    [
      'quantity thập phân',
      { items: [{ size: 'M', ingredientId: 1, quantity: 1.5 }] },
    ],
    [
      'quantity quá lớn',
      { items: [{ size: 'M', ingredientId: 1, quantity: 1_000_001 }] },
    ],
    ['thiếu ingredientId', { items: [{ size: 'M', quantity: 5 }] }],
    [
      'dòng có trường lạ',
      { items: [{ size: 'M', ingredientId: 1, quantity: 5, unit: 'G' }] },
    ],
    ['trường thừa ở body', { items: [], productId: 2 }],
  ])('PUT 400 khi %s, không đụng tới công thức', async (_ten, body) => {
    const { app, recipeItem } = await setup();
    await as(app).put('/admin/products/1/recipe', body).expect(400);
    expect(recipeItem.deleteMany).not.toHaveBeenCalled();
    await app.close();
  });

  it.each(['BARISTA', 'CASHIER', 'CUSTOMER'])(
    '403 với vai trò %s (GET và PUT)',
    async (role) => {
      const { app, recipeItem } = await setup();
      await as(app, role).get('/admin/products/1/recipe').expect(403);
      await as(app, role)
        .put('/admin/products/1/recipe', { items: [] })
        .expect(403);
      expect(recipeItem.findMany).not.toHaveBeenCalled();
      expect(recipeItem.deleteMany).not.toHaveBeenCalled();
      await app.close();
    },
  );
});

describe('công thức topping /admin/toppings/:code/recipe', () => {
  it('GET: trả các nguyên liệu của một phần topping', async () => {
    const { app } = await setup();
    const res = await as(app)
      .get('/admin/toppings/tran-chau/recipe')
      .expect(200);
    expect(res.body).toEqual({
      toppingCode: 'tran-chau',
      items: [
        {
          ingredientId: 3,
          quantity: 30,
          ingredientName: 'Trân châu',
          unit: 'G',
        },
      ],
    });
    await app.close();
  });

  it('PUT: thay toàn bộ công thức topping', async () => {
    const { app, toppingRecipeItem } = await setup();
    await as(app)
      .put('/admin/toppings/tran-chau/recipe', {
        items: [{ ingredientId: 3, quantity: 30 }],
      })
      .expect(200);
    expect(toppingRecipeItem.deleteMany).toHaveBeenCalledWith({
      where: { toppingCode: 'tran-chau' },
    });
    expect(toppingRecipeItem.createMany).toHaveBeenCalledWith({
      data: [{ toppingCode: 'tran-chau', ingredientId: 3, quantity: 30 }],
    });
    await app.close();
  });

  it('PUT: 400 khi trùng nguyên liệu hoặc nguyên liệu không tồn tại', async () => {
    const { app, toppingRecipeItem } = await setup({
      existingIngredients: [3],
    });
    await as(app)
      .put('/admin/toppings/tran-chau/recipe', {
        items: [
          { ingredientId: 3, quantity: 1 },
          { ingredientId: 3, quantity: 2 },
        ],
      })
      .expect(400);
    await as(app)
      .put('/admin/toppings/tran-chau/recipe', {
        items: [{ ingredientId: 42, quantity: 1 }],
      })
      .expect(400);
    expect(toppingRecipeItem.deleteMany).not.toHaveBeenCalled();
    await app.close();
  });

  it('GET và PUT: 404 khi không có topping; 400 khi :code sai định dạng', async () => {
    const { app, toppingRecipeItem } = await setup({ noTopping: true });
    await as(app).get('/admin/toppings/khong-co/recipe').expect(404);
    await as(app)
      .put('/admin/toppings/khong-co/recipe', { items: [] })
      .expect(404);
    await as(app).get('/admin/toppings/KHONG_CO/recipe').expect(400);
    expect(toppingRecipeItem.deleteMany).not.toHaveBeenCalled();
    await app.close();
  });

  it.each(['BARISTA', 'CASHIER', 'CUSTOMER'])(
    '403 với vai trò %s',
    async (role) => {
      const { app, toppingRecipeItem } = await setup();
      await as(app, role).get('/admin/toppings/tran-chau/recipe').expect(403);
      await as(app, role)
        .put('/admin/toppings/tran-chau/recipe', { items: [] })
        .expect(403);
      expect(toppingRecipeItem.deleteMany).not.toHaveBeenCalled();
      await app.close();
    },
  );
});
