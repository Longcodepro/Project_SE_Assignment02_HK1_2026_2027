import { Test } from '@nestjs/testing';
import { SwaggerModule } from '@nestjs/swagger';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthController } from './auth/auth.controller.js';
import { AuthService } from './auth/auth.service.js';
import { JwtAuthGuard } from './auth/jwt-auth.guard.js';
import { LoyaltyController } from './loyalty/loyalty.controller.js';
import { LoyaltyService } from './loyalty/loyalty.service.js';
import { OrdersController } from './orders/orders.controller.js';
import { OrdersService } from './orders/orders.service.js';
import { PaymentsController } from './payments/payments.controller.js';
import { PaymentsService } from './payments/payments.service.js';
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
      'category',
      'isAvailable',
    ]);
    expect(doc.paths['/']).toBeDefined();
    await app.close();
  });

  it('có schema request/response cho auth, orders, payments, loyalty và nút Authorize', async () => {
    const stub = (provide: unknown) => ({ provide, useValue: {} });
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController, OrdersController, PaymentsController, LoyaltyController],
      providers: [AuthService, OrdersService, PaymentsService, LoyaltyService].map(stub),
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({})
      .compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const doc = SwaggerModule.createDocument(app, swaggerConfig);
    const body = (path: string, method: string) =>
      (doc.paths[path] as any)[method].requestBody.content['application/json'].schema;

    expect(body('/auth/register', 'post')).toEqual({ $ref: '#/components/schemas/RegisterDto' });
    expect(body('/orders', 'post')).toEqual({ $ref: '#/components/schemas/CreateOrderDto' });
    expect(body('/payments', 'post')).toEqual({ $ref: '#/components/schemas/CreatePaymentDto' });
    expect((doc.paths['/orders/me'] as any).get.responses['200'].content['application/json'].schema)
      .toEqual({ type: 'array', items: { $ref: '#/components/schemas/OrderHistoryDto' } });
    expect((doc.paths['/orders'] as any).post.parameters.map((p: any) => p.name))
      .toContain('Idempotency-Key');
    expect((doc.paths['/payments'] as any).post.security).toEqual([{ bearer: [] }]);
    expect(Object.keys(doc.components!.schemas!)).toEqual(
      expect.arrayContaining(['PaymentResponseDto', 'LoginResponseDto', 'LoyaltyDto']),
    );
    await app.close();
  });
});
