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
  },
];

describe('GET /products', () => {
  it('trả về danh sách đúng hình dạng trong API-CONTRACT', async () => {
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

    expect(res.body).toEqual(rows);
    expect(findMany).toHaveBeenCalledWith({ orderBy: { id: 'asc' } });
    await app.close();
  });
});
