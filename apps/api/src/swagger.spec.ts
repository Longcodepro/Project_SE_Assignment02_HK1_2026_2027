import { Test } from '@nestjs/testing';
import { SwaggerModule } from '@nestjs/swagger';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaService } from './prisma/prisma.service.js';
import { ProductsController } from './products/products.controller.js';
import { ProductsService } from './products/products.service.js';
import { swaggerConfig } from './swagger.js';

describe('Swagger', () => {
  it('mô tả GET /products với danh sách ProductDto đúng hình dạng API-CONTRACT', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AppController, ProductsController],
      providers: [AppService, ProductsService, { provide: PrismaService, useValue: {} }],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const doc = SwaggerModule.createDocument(app, swaggerConfig);

    const ok = (doc.paths['/products'] as any).get.responses['200'];
    expect(ok.content['application/json'].schema).toEqual({
      type: 'array',
      items: { $ref: '#/components/schemas/ProductDto' },
    });
    expect(Object.keys((doc.components!.schemas!.ProductDto as any).properties)).toEqual([
      'id',
      'name',
      'price',
      'imageUrl',
    ]);
    expect(doc.paths['/']).toBeDefined();
    await app.close();
  });
});
