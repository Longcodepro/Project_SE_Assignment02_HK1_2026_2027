/**
 * Unit Test cho RolesGuard (Kiểm thử phân quyền RBAC bằng Vitest và Supertest).
 *
 * Mục tiêu:
 * 1. Kiểm tra thứ tự Guard: Thiếu đăng nhập thì trả 401 Unauthorized (do FakeAuthGuard chặn).
 * 2. Đúng vai trò (Role) thì cho phép truy cập (200 OK).
 * 3. Sai vai trò thì chặn lại và trả về 403 Forbidden ("Không đủ quyền truy cập").
 * 4. Endpoint không gắn decorator @Roles() thì bất kỳ ai đã đăng nhập đều vào được.
 */

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

/**
 * Guard giả lập: Thay thế JwtAuthGuard trong môi trường test.
 * Đọc header "x-role" để biết vai trò thay vì phải giải mã chuỗi JWT phức tạp.
 * Nếu không có header x-role -> ném 401 như thiếu token thật.
 */
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

/**
 * Controller giả lập dùng riêng cho việc kiểm thử phân quyền
 */
@Controller('thu')
@UseGuards(FakeAuthGuard, RolesGuard) // Guard chạy từ trái qua phải: FakeAuthGuard -> RolesGuard
class ThuController {
  // Chỉ BARISTA mới được vào
  @Get('barista')
  @Roles('BARISTA')
  barista() {
    return { ok: true };
  }

  // Cả BARISTA hoặc CASHIER đều vào được
  @Get('nhan-vien')
  @Roles('BARISTA', 'CASHIER')
  nhanVien() {
    return { ok: true };
  }

  // Không có @Roles: Bất kỳ ai đã đăng nhập đều vào được
  @Get('mo')
  mo() {
    return { ok: true };
  }
}

describe('RolesGuard', () => {
  // Hàm khởi tạo ứng dụng NestJS test trong RAM
  async function setup() {
    const moduleRef = await Test.createTestingModule({
      controllers: [ThuController],
      providers: [FakeAuthGuard, RolesGuard],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();
    return app;
  }

  /**
   * TEST 1: Kiểm tra thứ tự thực thi
   * Khi không gửi token (không có header x-role), hệ thống phải trả 401 chứ không được chạy tới RolesGuard (không thành 403).
   */
  it('thiếu token vẫn là 401, không bị đổi thành 403', async () => {
    const app = await setup();
    await request(app.getHttpServer()).get('/thu/barista').expect(401);
    await app.close();
  });

  /**
   * TEST 2: Đăng nhập với đúng vai trò -> Vào thành công (200 OK)
   */
  it('đúng vai trò thì vào được', async () => {
    const app = await setup();
    await request(app.getHttpServer()).get('/thu/barista').set('x-role', 'BARISTA').expect(200);
    await request(app.getHttpServer()).get('/thu/nhan-vien').set('x-role', 'CASHIER').expect(200);
    await app.close();
  });

  /**
   * TEST 3: Đăng nhập nhưng sai vai trò -> Trả về 403 Forbidden
   */
  it('sai vai trò trả 403 kèm thông báo', async () => {
    const app = await setup();
    for (const role of ['CUSTOMER', 'CASHIER', 'MANAGER']) {
      const res = await request(app.getHttpServer()).get('/thu/barista').set('x-role', role).expect(403);
      expect(res.body).toMatchObject({ statusCode: 403, message: 'Không đủ quyền truy cập' });
    }
    await request(app.getHttpServer()).get('/thu/nhan-vien').set('x-role', 'CUSTOMER').expect(403);
    await app.close();
  });

  /**
   * TEST 4: Endpoint mở (không có decorator @Roles) -> Khách hàng bình thường cũng vào được
   */
  it('route không có @Roles thì ai đã đăng nhập cũng vào được', async () => {
    const app = await setup();
    await request(app.getHttpServer()).get('/thu/mo').set('x-role', 'CUSTOMER').expect(200);
    await app.close();
  });
});
