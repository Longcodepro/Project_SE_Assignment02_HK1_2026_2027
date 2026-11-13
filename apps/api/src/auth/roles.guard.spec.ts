import {
  type CanActivate,
  type ExecutionContext,
  Controller,
  Get,
  Injectable,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { Roles, RolesGuard } from './roles.guard.js';

// Thay JwtAuthGuard: header x-role cho biết vai trò, không có header thì 401 như thiếu token
@Injectable()
class FakeAuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    const role = req.headers['x-role'];
    if (!role) throw new UnauthorizedException('Thiếu token đăng nhập');
    req.user = { phone: '0900000001', role };
    return true;
  }
}

@Controller('thu')
@UseGuards(FakeAuthGuard, RolesGuard)
class ThuController {
  @Get('barista')
  @Roles('BARISTA')
  barista() {
    return { ok: true };
  }

  @Get('nhan-vien')
  @Roles('BARISTA', 'CASHIER')
  nhanVien() {
    return { ok: true };
  }

  @Get('mo')
  mo() {
    return { ok: true };
  }
}

describe('RolesGuard', () => {
  async function setup() {
    const moduleRef = await Test.createTestingModule({
      controllers: [ThuController],
      providers: [FakeAuthGuard, RolesGuard],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();
    return app;
  }

  it('thiếu token vẫn là 401, không bị đổi thành 403', async () => {
    const app = await setup();
    await request(app.getHttpServer()).get('/thu/barista').expect(401);
    await app.close();
  });

  it('đúng vai trò thì vào được', async () => {
    const app = await setup();
    await request(app.getHttpServer()).get('/thu/barista').set('x-role', 'BARISTA').expect(200);
    await request(app.getHttpServer()).get('/thu/nhan-vien').set('x-role', 'CASHIER').expect(200);
    await app.close();
  });

  it('sai vai trò trả 403 kèm thông báo', async () => {
    const app = await setup();
    for (const role of ['CUSTOMER', 'CASHIER', 'MANAGER']) {
      const res = await request(app.getHttpServer()).get('/thu/barista').set('x-role', role).expect(403);
      expect(res.body).toMatchObject({ statusCode: 403, message: 'Không đủ quyền truy cập' });
    }
    await request(app.getHttpServer()).get('/thu/nhan-vien').set('x-role', 'CUSTOMER').expect(403);
    await app.close();
  });

  it('route không có @Roles thì ai đã đăng nhập cũng vào được', async () => {
    const app = await setup();
    await request(app.getHttpServer()).get('/thu/mo').set('x-role', 'CUSTOMER').expect(200);
    await app.close();
  });
});
