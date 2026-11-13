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

// Dùng cùng JwtAuthGuard và đặt JwtAuthGuard trước để request đã có user:
//   @UseGuards(JwtAuthGuard, RolesGuard)
//   @Roles('BARISTA')
// Route không có @Roles thì ai đã đăng nhập cũng vào được.
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext) {
    const allowed = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!allowed?.length) return true;

    const user = ctx.switchToHttp().getRequest().user as AuthUser | undefined;
    if (!user || !allowed.includes(user.role as Role)) {
      throw new ForbiddenException('Không đủ quyền truy cập');
    }
    return true;
  }
}
