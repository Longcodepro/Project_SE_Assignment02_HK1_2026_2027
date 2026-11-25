/**
 * Unit Test toàn diện cho AuthModule (Đăng ký, Đăng nhập, Khóa tài khoản, và Tích hợp JwtAuthGuard).
 *
 * Sử dụng: Vitest + Supertest + In-memory Mock Prisma.
 *
 * Các tình huống kiểm thử:
 * 1. POST /auth/register: Chuẩn hóa SĐT (+84 -> 0), băm mật khẩu bcrypt, ẩn passwordHash, chặn trùng 409, validate 400.
 * 2. POST /auth/login: Đúng mật khẩu cấp JWT, sai mật khẩu / SĐT không tồn tại trả cùng thông báo 401 (chống enum).
 * 3. Tài khoản bị khóa: Đúng mật khẩu mới báo 403 (không phát token), sai mật khẩu vẫn trả 401 (chống lộ cờ isLocked).
 * 4. Tích hợp Guard: Bảo vệ POST /orders (chặn 401 khi không có token, cho phép 201 khi có Bearer token hợp lệ).
 */

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

// Dữ liệu mẫu đơn hàng dùng để test guard bảo vệ endpoint đặt hàng
const order = { items: [{ productId: 1, quantity: 1, size: 'S' }] };

/**
 * Hàm thiết lập môi trường test ảo trong RAM (NestJS Test Container)
 */
async function setup() {
  const user = {
    create: vi.fn(),
    findUnique: vi.fn(),
  };
  const prisma = {
    user,
    product: { findMany: vi.fn().mockResolvedValue([{ id: 1, price: 29000, isAvailable: true }]) },
    sizeSurcharge: { findMany: vi.fn().mockResolvedValue([{ size: 'S', extra: 0 }]) },
    recipeItem: { findMany: vi.fn().mockResolvedValue([]) },
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
  app.useGlobalPipes(createValidationPipe()); // Bật pipe kiểm duyệt dữ liệu đầu vào DTO
  await app.init();
  return { app, prisma, http: () => request(app.getHttpServer()) };
}

describe('POST /auth/register', () => {
  /**
   * TEST 1: Đăng ký thành công:
   * - +84912345678 được chuẩn hóa thành 0912345678
   * - Mật khẩu được băm qua bcrypt
   * - Dữ liệu trả về không có trường passwordHash
   */
  it('băm mật khẩu bằng bcrypt, chuẩn hóa SĐT và không trả passwordHash', async () => {
    const { app, prisma, http } = await setup();
    prisma.user.create.mockResolvedValue({
      phone: '0912345678',
      name: null,
      email: 'a@b.com',
      role: 'CUSTOMER',
    });

    const res = await http()
      .post('/auth/register')
      .send({ phone: '+84912345678', password: 'secret123', email: ' A@B.com ' })
      .expect(201);

    expect(res.body).toEqual({
      phone: '0912345678',
      name: null,
      email: 'a@b.com',
      role: 'CUSTOMER',
    });
    const { passwordHash, phone, email } = prisma.user.create.mock.calls[0][0].data;
    expect(phone).toBe('0912345678');
    expect(email).toBe('a@b.com');
    expect(passwordHash).not.toBe('secret123'); // Đảm bảo không lưu plain text
    expect(await bcrypt.compare('secret123', passwordHash)).toBe(true);
    await app.close();
  });

  /**
   * TEST 2: Trùng số điện thoại (Primary Key) -> Bắt lỗi P2002 và trả về HTTP 409 Conflict
   */
  it('409 khi số điện thoại đã tồn tại', async () => {
    const { app, prisma, http } = await setup();
    prisma.user.create.mockRejectedValue({ code: 'P2002' });
    await http()
      .post('/auth/register')
      .send({ phone: '0912345678', password: 'secret123' })
      .expect(409);
    await app.close();
  });

  /**
   * TEST 3: Kiểm tra các trường hợp vi phạm Validation Pipe (Trả về HTTP 400 Bad Request)
   */
  it.each([
    ['SĐT không phải số di động Việt Nam (đầu bàn 02)', { phone: '0212345678', password: 'secret123' }],
    ['SĐT sai định dạng', { phone: 'abc', password: 'secret123' }],
    ['SĐT thiếu chữ số', { phone: '091234567', password: 'secret123' }],
    ['mật khẩu quá ngắn', { phone: '0912345678', password: '123' }],
    ['mật khẩu quá dài cho bcrypt', { phone: '0912345678', password: 'x'.repeat(73) }],
    ['thiếu mật khẩu', { phone: '0912345678' }],
  ])('400 khi %s', async (_n, body) => {
    const { app, prisma, http } = await setup();
    await http().post('/auth/register').send(body).expect(400);
    expect(prisma.user.create).not.toHaveBeenCalled(); // Đảm bảo validation chặn ngay cửa, không đụng tới DB
    await app.close();
  });
});

describe('POST /auth/login', () => {
  const login = (http: () => ReturnType<typeof request>, body: object) =>
    http().post('/auth/login').send(body);

  /**
   * TEST 4: Đăng nhập thành công -> Trả về JWT Access Token chuẩn 3 phần tách bằng dấu chấm
   */
  it('đúng mật khẩu thì phát JWT', async () => {
    const { app, prisma, http } = await setup();
    prisma.user.findUnique.mockResolvedValue({
      phone: '0912345678',
      role: 'CUSTOMER',
      passwordHash: await bcrypt.hash('secret123', 4),
    });
    const res = await login(http, { phone: '0912345678', password: 'secret123' }).expect(200);
    // JWT gồm 3 phần base64: header.payload.signature
    expect(res.body.accessToken.split('.')).toHaveLength(3);
    await app.close();
  });

  /**
   * TEST 5: Sai mật khẩu hoặc SĐT không tồn tại đều phải trả cùng một thông báo 401
   * Mục đích: Chống Account Enumeration (dò tài khoản).
   */
  it('401 khi sai mật khẩu hoặc SĐT không tồn tại (cùng một thông báo)', async () => {
    const { app, prisma, http } = await setup();
    prisma.user.findUnique.mockResolvedValueOnce({
      phone: '0912345678',
      role: 'CUSTOMER',
      passwordHash: await bcrypt.hash('secret123', 4),
    });
    const wrong = await login(http, { phone: '0912345678', password: 'sai-mat-khau' }).expect(401);
    prisma.user.findUnique.mockResolvedValueOnce(null);
    const none = await login(http, { phone: '0987654321', password: 'secret123' }).expect(401);
    expect(none.body.message).toBe(wrong.body.message);
    await app.close();
  });
});

describe('POST /auth/login với tài khoản bị khóa', () => {
  const khoa = async (isLocked: boolean) => ({
    phone: '0900000001',
    role: 'BARISTA',
    isLocked,
    passwordHash: await bcrypt.hash('secret123', 4),
  });

  /**
   * TEST 6: Đúng mật khẩu nhưng tài khoản bị khóa -> Trả 403 Forbidden, không phát token
   */
  it('đúng mật khẩu nhưng bị khóa: 403, không phát token', async () => {
    const { app, prisma, http } = await setup();
    prisma.user.findUnique.mockResolvedValue(await khoa(true));
    const res = await http().post('/auth/login').send({ phone: '0900000001', password: 'secret123' }).expect(403);
    expect(res.body.message).toBe('Tài khoản đã bị khóa');
    expect(res.body.accessToken).toBeUndefined();
    await app.close();
  });

  /**
   * TEST 7: Sai mật khẩu trên tài khoản bị khóa -> Vẫn trả 401, không được để lộ cờ bị khóa
   */
  it('sai mật khẩu trên tài khoản bị khóa vẫn 401, không lộ việc bị khóa', async () => {
    const { app, prisma, http } = await setup();
    prisma.user.findUnique.mockResolvedValue(await khoa(true));
    const res = await http().post('/auth/login').send({ phone: '0900000001', password: 'sai-mat-khau' }).expect(401);
    expect(res.body.message).toBe('Số điện thoại hoặc mật khẩu không đúng');
    await app.close();
  });

  /**
   * TEST 8: Mở khóa xong -> Đăng nhập bình thường nhận 200 OK
   */
  it('mở khóa rồi thì đăng nhập lại được', async () => {
    const { app, prisma, http } = await setup();
    prisma.user.findUnique.mockResolvedValue(await khoa(false));
    const res = await http().post('/auth/login').send({ phone: '0900000001', password: 'secret123' }).expect(200);
    expect(res.body.accessToken.split('.')).toHaveLength(3);
    await app.close();
  });
});

describe('guard bảo vệ POST /orders', () => {
  /**
   * TEST 9: Tích hợp JwtAuthGuard với endpoint đặt hàng POST /orders:
   * - Không gửi token -> 401 Unauthorized
   * - Gửi token rác -> 401 Unauthorized
   * - Gửi token hợp lệ -> 201 Created và đơn hàng được gắn đúng userPhone trong token
   */
  it('không có token / token sai thì 401, có token hợp lệ thì đặt được đơn', async () => {
    const { app, prisma, http } = await setup();
    prisma.user.findUnique.mockResolvedValue({
      phone: '0912345678',
      role: 'CUSTOMER',
      passwordHash: await bcrypt.hash('secret123', 4),
    });

    await http().post('/orders').send(order).expect(401);
    await http().post('/orders').set('Authorization', 'Bearer rac').send(order).expect(401);

    const { body } = await http().post('/auth/login').send({ phone: '0912345678', password: 'secret123' });
    await http().post('/orders').set('Authorization', `Bearer ${body.accessToken}`).send(order).expect(201);
    // Kiểm tra đơn hàng được tạo gắn chính xác số điện thoại của người dùng từ token
    expect(prisma.order.create.mock.calls[0][0].data.userPhone).toBe('0912345678');
    await app.close();
  });
});
