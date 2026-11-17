/**
 * JwtAuthGuard: Tấm khiên bảo vệ các Endpoint yêu cầu đăng nhập.
 *
 * Nhiệm vụ:
 * 1. Đọc header "Authorization: Bearer <token>" từ HTTP request gửi lên.
 * 2. Giải mã và kiểm tra tính hợp lệ của token bằng secret key.
 * 3. Nếu token hợp lệ: gắn thông tin người dùng { phone, role } vào object `req.user`.
 * 4. Nếu thiếu token hoặc token giả/hết hạn: lập tức ném lỗi 401 Unauthorized và ngắt request.
 */

import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

// Kiểu dữ liệu đại diện cho người dùng đã đăng nhập thành công
export type AuthUser = { phone: string; role: string };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  /**
   * Phương thức canActivate được NestJS tự động gọi trước khi request vào Controller
   */
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    // 1. Lấy đối tượng Request từ ngữ cảnh HTTP
    const req = ctx.switchToHttp().getRequest();

    // 2. Tách chuỗi header Authorization (ví dụ: "Bearer eyJhbGciOi...")
    const [type, token] = (req.headers.authorization ?? '').split(' ');
    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Thiếu token đăng nhập');
    }

    try {
      // 3. Giải mã và xác thực chữ ký số của token
      const payload = await this.jwt.verifyAsync(token);

      // 4. Gắn thông tin người dùng đã giải mã vào req.user để các Controller phía sau sử dụng
      req.user = {
        phone: payload.phone ?? String(payload.sub),
        role: payload.role ?? 'CUSTOMER',
      } satisfies AuthUser;
    } catch {
      // Nếu chữ ký bị chỉnh sửa hoặc token đã quá hạn 1 ngày
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }

    // Trả về true: Cho phép request đi tiếp vào Controller
    return true;
  }
}

/**
 * Custom Decorator: @CurrentUser()
 * Giúp lập trình viên trong Controller lấy nhanh thông tin người dùng hiện tại mà không cần gọi req.user.
 *
 * Cách dùng trong Controller:
 * @Get('me')
 * getProfile(@CurrentUser() user: AuthUser) {
 *   return user.phone;
 * }
 */
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthUser =>
    ctx.switchToHttp().getRequest().user,
);
