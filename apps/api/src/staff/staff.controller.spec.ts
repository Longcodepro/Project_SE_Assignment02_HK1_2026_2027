import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { createValidationPipe } from '../common/validation.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StaffController } from './staff.controller.js';
import { StaffService } from './staff.service.js';

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

async function setup(
  opts: { found?: Record<string, unknown> | null; createError?: unknown } = {},
) {
  const findUnique = vi
    .fn()
    .mockResolvedValue(
      opts.found === undefined ? { role: 'CASHIER' } : opts.found,
    );
  const findMany = vi.fn().mockResolvedValue([]);
  const create = vi
    .fn()
    .mockImplementation(({ data }) =>
      opts.createError
        ? Promise.reject(opts.createError)
        : Promise.resolve({
            phone: data.phone,
            name: data.name ?? null,
            role: data.role,
            isLocked: false,
          }),
    );
  const update = vi.fn().mockImplementation(({ where, data }) =>
    Promise.resolve({
      phone: where.phone,
      name: 'Thu ngân 2',
      role: data.role ?? 'CASHIER',
      isLocked: data.isLocked ?? false,
    }),
  );
  const moduleRef = await Test.createTestingModule({
    controllers: [StaffController],
    providers: [
      StaffService,
      {
        provide: PrismaService,
        useValue: { user: { findUnique, findMany, create, update } },
      },
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

describe('GET /admin/staff', () => {
  it('liệt kê mọi tài khoản không phải khách, cũ nhất lên đầu, không có passwordHash', async () => {
    const { app, findMany } = await setup();
    findMany.mockResolvedValue([
      {
        phone: '0900000001',
        name: 'Barista',
        role: 'BARISTA',
        isLocked: false,
        createdAt: new Date('2026-11-13T03:00:00Z'),
      },
    ]);

    const res = await request(app.getHttpServer())
      .get('/admin/staff')
      .expect(200);

    const q = findMany.mock.calls[0][0];
    expect(q.where).toEqual({ role: { not: 'CUSTOMER' } });
    expect(q.orderBy).toEqual({ createdAt: 'asc' });
    expect(q.select).not.toHaveProperty('passwordHash');
    expect(res.body).toEqual([
      {
        phone: '0900000001',
        name: 'Barista',
        role: 'BARISTA',
        isLocked: false,
        createdAt: '2026-11-13T03:00:00.000Z',
      },
    ]);
    await app.close();
  });

  it.each(['CUSTOMER', 'BARISTA', 'CASHIER'])(
    '403 với vai trò %s và không đụng tới CSDL',
    async (role) => {
      const { app, findMany } = await setup();
      const res = await request(app.getHttpServer())
        .get('/admin/staff')
        .set('x-role', role)
        .expect(403);
      expect(res.body.message).toBe('Không đủ quyền truy cập');
      expect(findMany).not.toHaveBeenCalled();
      await app.close();
    },
  );
});

describe('POST /admin/staff', () => {
  const tao = (app: any, body: object, role = 'MANAGER') =>
    request(app.getHttpServer())
      .post('/admin/staff')
      .set('x-role', role)
      .send(body);
  const hopLe = {
    phone: '0911222333',
    password: 'matkhau123',
    name: 'Thu ngân 2',
    role: 'CASHIER',
  };

  it('tạo nhân viên: băm mật khẩu, lưu đúng vai trò, không trả passwordHash', async () => {
    const { app, create } = await setup();

    const res = await tao(app, hopLe).expect(201);

    expect(res.body).toEqual({
      phone: '0911222333',
      name: 'Thu ngân 2',
      role: 'CASHIER',
      isLocked: false,
    });
    const { passwordHash, ...rest } = create.mock.calls[0][0].data;
    expect(rest).toEqual({
      phone: '0911222333',
      name: 'Thu ngân 2',
      role: 'CASHIER',
    });
    expect(passwordHash).not.toBe('matkhau123');
    expect(await bcrypt.compare('matkhau123', passwordHash)).toBe(true);
    await app.close();
  });

  it('+84 được đổi về 0, name là tùy chọn', async () => {
    const { app, create } = await setup();
    await tao(app, {
      phone: '+84911222333',
      password: 'matkhau123',
      role: 'BARISTA',
    }).expect(201);
    expect(create.mock.calls[0][0].data.phone).toBe('0911222333');
    await app.close();
  });

  it('409 khi SĐT đã có tài khoản (P2002)', async () => {
    const { app } = await setup({ createError: { code: 'P2002' } });
    const res = await tao(app, hopLe).expect(409);
    expect(res.body.message).toBe('Số điện thoại đã được đăng ký');
    await app.close();
  });

  it.each([
    ['role MANAGER', { ...hopLe, role: 'MANAGER' }],
    ['role CUSTOMER', { ...hopLe, role: 'CUSTOMER' }],
    ['thiếu role', { phone: '0911222333', password: 'matkhau123' }],
    ['SĐT sai', { ...hopLe, phone: '12345' }],
    ['mật khẩu ngắn', { ...hopLe, password: '123' }],
    ['mật khẩu quá 72 ký tự', { ...hopLe, password: 'a'.repeat(73) }],
    ['name quá 100 ký tự', { ...hopLe, name: 'a'.repeat(101) }],
    ['trường thừa (isLocked)', { ...hopLe, isLocked: true }],
  ])('400 khi %s, không ghi gì', async (_ten, body) => {
    const { app, create } = await setup();
    await tao(app, body).expect(400);
    expect(create).not.toHaveBeenCalled();
    await app.close();
  });

  it.each(['CUSTOMER', 'BARISTA', 'CASHIER'])(
    '403 với vai trò %s và không ghi gì',
    async (role) => {
      const { app, create } = await setup();
      await tao(app, hopLe, role).expect(403);
      expect(create).not.toHaveBeenCalled();
      await app.close();
    },
  );
});

describe('PATCH /admin/staff/:phone', () => {
  const sua = (app: any, phone: string, body: object, role = 'MANAGER') =>
    request(app.getHttpServer())
      .patch(`/admin/staff/${phone}`)
      .set('x-role', role)
      .send(body);

  it('khóa tài khoản nhân viên', async () => {
    const { app, update } = await setup();
    const res = await sua(app, '0911222333', { isLocked: true }).expect(200);
    expect(res.body).toMatchObject({ phone: '0911222333', isLocked: true });
    expect(update.mock.calls[0][0]).toMatchObject({
      where: { phone: '0911222333' },
      data: { isLocked: true },
    });
    await app.close();
  });

  it('mở khóa tài khoản nhân viên', async () => {
    const { app, update } = await setup();
    await sua(app, '0911222333', { isLocked: false }).expect(200);
    expect(update.mock.calls[0][0].data.isLocked).toBe(false);
    await app.close();
  });

  it('đổi vai trò giữa BARISTA và CASHIER', async () => {
    const { app, update } = await setup({ found: { role: 'CASHIER' } });
    const res = await sua(app, '0911222333', { role: 'BARISTA' }).expect(200);
    expect(res.body.role).toBe('BARISTA');
    expect(update.mock.calls[0][0].data.role).toBe('BARISTA');
    await app.close();
  });

  it('đổi cả vai trò và khóa trong một lần', async () => {
    const { app, update } = await setup();
    await sua(app, '0911222333', { role: 'BARISTA', isLocked: true }).expect(
      200,
    );
    expect(update.mock.calls[0][0].data).toEqual({
      role: 'BARISTA',
      isLocked: true,
    });
    await app.close();
  });

  it.each(['MANAGER', 'CUSTOMER'])(
    '409 khi đích là %s (không phải nhân viên), không ghi gì',
    async (role) => {
      const { app, update } = await setup({ found: { role } });
      const res = await sua(app, '0900000003', { isLocked: true }).expect(409);
      expect(res.body.message).toBe('Chỉ quản lý được tài khoản nhân viên');
      expect(update).not.toHaveBeenCalled();
      await app.close();
    },
  );

  it('404 khi không có tài khoản', async () => {
    const { app, update } = await setup({ found: null });
    await sua(app, '0911222333', { isLocked: true }).expect(404);
    expect(update).not.toHaveBeenCalled();
    await app.close();
  });

  it.each([
    ['body rỗng', {}],
    ['role MANAGER', { role: 'MANAGER' }],
    ['isLocked là chuỗi', { isLocked: 'true' }],
    ['trường thừa', { isLocked: true, name: 'x' }],
  ])('400 khi %s, không ghi gì', async (_ten, body) => {
    const { app, update } = await setup();
    await sua(app, '0911222333', body).expect(400);
    expect(update).not.toHaveBeenCalled();
    await app.close();
  });

  it('400 khi :phone không phải SĐT hợp lệ', async () => {
    const { app, findUnique } = await setup();
    await sua(app, 'abc', { isLocked: true }).expect(400);
    expect(findUnique).not.toHaveBeenCalled();
    await app.close();
  });

  it.each(['CUSTOMER', 'BARISTA', 'CASHIER'])(
    '403 với vai trò %s và không đụng tới CSDL',
    async (role) => {
      const { app, findUnique, update } = await setup();
      await sua(app, '0911222333', { isLocked: true }, role).expect(403);
      expect(findUnique).not.toHaveBeenCalled();
      expect(update).not.toHaveBeenCalled();
      await app.close();
    },
  );
});
