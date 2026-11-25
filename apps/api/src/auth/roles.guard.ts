/**
 * RolesGuard: Phân quyền truy cập dựa trên vai trò (Role-Based Access Control - RBAC).
 *
 * Cách sử dụng kết hợp với JwtAuthGuard:
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles('BARISTA', 'ADMIN')
 * @Get('kitchen-orders')
 * getKitchenOrders() { ... }
 *
 * Quy tắc:
 * 1. JwtAuthGuard phải chạy trước để giải mã token và gắn user vào `req.user`.
 * 2. RolesGuard đọc metadata từ decorator @Roles() và so khớp với `req.user.role`.
 * 3. Nếu route không khai báo @Roles(), mọi người dùng đã đăng nhập đều có quyền truy cập.
 * 4. Nếu không đủ quyền, ném lỗi 403 Forbidden.
 */

import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '../generated/prisma/enums.js';
import type { AuthUser } from './jwt-auth.guard.js';

const ROLES_KEY = 'roles';

/**
 * Decorator @Roles(...roles): Gắn danh sách vai trò được phép truy cập vào metadata của endpoint.
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  // Reflector là tiện ích của NestJS dùng để đọc metadata gắn trên method hoặc class
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    // 1. Đọc danh sách vai trò được phép từ metadata của route hiện tại
    const allowed = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      ctx.getHandler(), // Đọc metadata trên hàm controller
      ctx.getClass(),   // Đọc metadata trên toàn bộ class controller
    ]);

    // 2. Nếu endpoint không khai báo @Roles(...), mặc định cho phép truy cập (chỉ cần đăng nhập)
    if (!allowed?.length) return true;

    // 3. Lấy thông tin user đã được JwtAuthGuard gắn vào request trước đó
    const user = ctx.switchToHttp().getRequest().user as AuthUser | undefined;

    // 4. Nếu chưa có user hoặc vai trò của user không nằm trong danh sách cho phép -> ném lỗi 403
    if (!user || !allowed.includes(user.role as Role)) {
      throw new ForbiddenException('Không đủ quyền truy cập');
    }

    return true;
  }
}
