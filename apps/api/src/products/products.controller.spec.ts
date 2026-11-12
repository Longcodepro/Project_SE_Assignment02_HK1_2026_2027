import { Test } from '@nestjs/testing';
import request from 'supertest';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';

const rows = [
  {
    id: 1,
    name: 'Cà phê sữa',
    price: 29000,
    imageUrl: 'https://example.com/ca-phe-sua.jpg',
    isAvailable: true,
    categoryId: 1,
    category: { id: 1, name: 'Cà phê' },
  },
];

describe('ProductsController', () => {
  it('GET /products trả về danh sách đúng hình dạng kèm category và isAvailable', async () => {
    const findMany = vi.fn().mockResolvedValue(rows);
    const moduleRef = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: { product: { findMany } } },
      ],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const res = await request(app.getHttpServer()).get('/products').expect(200);

    expect(res.body).toEqual([
      {
        id: 1,
        name: 'Cà phê sữa',
        price: 29000,
        imageUrl: 'https://example.com/ca-phe-sua.jpg',
        isAvailable: true,
        category: { id: 1, name: 'Cà phê' },
      },
    ]);
    expect(findMany).toHaveBeenCalledWith({
      orderBy: { id: 'asc' },
      include: { category: { select: { id: true, name: true } } },
    });
    await app.close();
  });

  it('GET /products/:id trả về 200 cho id tồn tại', async () => {
    const findUnique = vi.fn().mockResolvedValue(rows[0]);
    const moduleRef = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: { product: { findUnique } } },
      ],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const res = await request(app.getHttpServer()).get('/products/1').expect(200);

    expect(res.body).toEqual({
      id: 1,
      name: 'Cà phê sữa',
      price: 29000,
      imageUrl: 'https://example.com/ca-phe-sua.jpg',
      isAvailable: true,
      category: { id: 1, name: 'Cà phê' },
    });
    await app.close();
  });

  it('GET /products/:id trả về 404 cho id không tồn tại', async () => {
    const findUnique = vi.fn().mockResolvedValue(null);
    const moduleRef = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: { product: { findUnique } } },
      ],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer()).get('/products/999').expect(404);
    await app.close();
  });

  it('GET /products/:id trả về 400 cho id không phải số', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: { product: {} } },
      ],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer()).get('/products/abc').expect(400);
    await app.close();
  });
});
