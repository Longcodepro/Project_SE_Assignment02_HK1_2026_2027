import { JwtModule } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { createValidationPipe } from '../common/validation.js';
import { OrdersController } from '../orders/orders.controller.js';
import { OrdersService } from '../orders/orders.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

const order = { items: [{ productId: 1, quantity: 1, size: 'S' }] };

async function setup() {
  const user = {
    create: vi.fn(),
    findUnique: vi.fn(),
  };
  const prisma = {
    user,
    product: { findMany: vi.fn().mockResolvedValue([{ id: 1, price: 29000 }]) },
    order: {
      create: vi.fn().mockResolvedValue({ id: 'ord_1', status: 'PENDING', total: 29000 }),
    },
  };
  const moduleRef = await Test.createTestingModule({
    imports: [JwtModule.register({ secret: 'test-secret', signOptions: { expiresIn: '1h' } })],
    controllers: [AuthController, OrdersController],
    providers: [AuthService, JwtAuthGuard, OrdersService, { provide: PrismaService, useValue: prisma }],
  }).compile();
  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(createValidationPipe());
  await app.init();
  return { app, prisma, http: () => request(app.getHttpServer()) };
}

describe('POST /auth/register', () => {
  it('băm mật khẩu bằng bcrypt và không trả passwordHash', async () => {
    const { app, prisma, http } = await setup();
    prisma.user.create.mockResolvedValue({ id: 1, email: 'a@b.com', name: null });

    const res = await http()
      .post('/auth/register')
      .send({ email: ' A@B.com ', password: 'secret123' })
      .expect(201);

    expect(res.body).toEqual({ id: 1, email: 'a@b.com', name: null });
    const { passwordHash, email } = prisma.user.create.mock.calls[0][0].data;
    expect(email).toBe('a@b.com');
    expect(passwordHash).not.toBe('secret123');
    expect(await bcrypt.compare('secret123', passwordHash)).toBe(true);
    await app.close();
  });

  it('409 khi email đã tồn tại', async () => {
    const { app, prisma, http } = await setup();
    prisma.user.create.mockRejectedValue({ code: 'P2002' });
    await http().post('/auth/register').send({ email: 'a@b.com', password: 'secret123' }).expect(409);
    await app.close();
  });

  it.each([
    ['email sai', { email: 'abc', password: 'secret123' }],
    ['mật khẩu quá ngắn', { email: 'a@b.com', password: '123' }],
    ['mật khẩu quá dài cho bcrypt', { email: 'a@b.com', password: 'x'.repeat(73) }],
    ['thiếu mật khẩu', { email: 'a@b.com' }],
  ])('400 khi %s', async (_n, body) => {
    const { app, prisma, http } = await setup();
    await http().post('/auth/register').send(body).expect(400);
    expect(prisma.user.create).not.toHaveBeenCalled();
    await app.close();
  });
});

describe('POST /auth/login', () => {
  const login = (http: () => ReturnType<typeof request>, body: object) => http().post('/auth/login').send(body);

  it('đúng mật khẩu thì phát JWT', async () => {
    const { app, prisma, http } = await setup();
    prisma.user.findUnique.mockResolvedValue({
      id: 1, email: 'a@b.com', passwordHash: await bcrypt.hash('secret123', 4),
    });
    const res = await login(http, { email: 'a@b.com', password: 'secret123' }).expect(200);
    expect(res.body.accessToken.split('.')).toHaveLength(3);
    await app.close();
  });

  it('401 khi sai mật khẩu hoặc email không tồn tại (cùng một thông báo)', async () => {
    const { app, prisma, http } = await setup();
    prisma.user.findUnique.mockResolvedValueOnce({
      id: 1, email: 'a@b.com', passwordHash: await bcrypt.hash('secret123', 4),
    });
    const wrong = await login(http, { email: 'a@b.com', password: 'sai-mat-khau' }).expect(401);
    prisma.user.findUnique.mockResolvedValueOnce(null);
    const none = await login(http, { email: 'x@b.com', password: 'secret123' }).expect(401);
    expect(none.body.message).toBe(wrong.body.message);
    await app.close();
  });
});

describe('guard bảo vệ POST /orders', () => {
  it('không có token / token sai thì 401, có token hợp lệ thì đặt được đơn', async () => {
    const { app, prisma, http } = await setup();
    prisma.user.findUnique.mockResolvedValue({
      id: 5, email: 'a@b.com', passwordHash: await bcrypt.hash('secret123', 4),
    });

    await http().post('/orders').send(order).expect(401);
    await http().post('/orders').set('Authorization', 'Bearer rac').send(order).expect(401);

    const { body } = await http().post('/auth/login').send({ email: 'a@b.com', password: 'secret123' });
    await http().post('/orders').set('Authorization', `Bearer ${body.accessToken}`).send(order).expect(201);
    // đơn gắn với người dùng trong token
    expect(prisma.order.create.mock.calls[0][0].data.userId).toBe(5);
    await app.close();
  });
});
