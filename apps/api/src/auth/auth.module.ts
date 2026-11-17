/**
 * AuthModule: Module trung tâm xử lý xác thực và phân quyền của toàn hệ thống.
 *
 * Chức năng chính:
 * 1. Cấu hình JWT (JSON Web Token) bất đồng bộ với cơ chế Fail-fast bảo mật.
 * 2. Cung cấp AuthController tiếp nhận các request đăng ký / đăng nhập.
 * 3. Export JwtModule và JwtAuthGuard để các module nghiệp vụ khác (Orders, Payments, Inventory...)
 *    có thể tái sử dụng để bảo vệ endpoint mà không phải cấu hình lại.
 */

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

@Module({
  imports: [
    // Đăng ký JwtModule bất đồng bộ để đọc biến môi trường tại runtime khi container khởi động
    JwtModule.registerAsync({
      useFactory: () => {
        // NGUYÊN TẮC BẢO MẬT FAIL-FAST:
        // Không dùng fallback mặc định (ví dụ ?? 'default_secret').
        // Nếu thiếu JWT_SECRET trong .env, ứng dụng lập tức sập để tránh lộ bảo mật trên production.
        const secret = process.env.JWT_SECRET;
        if (!secret) throw new Error('Thiếu biến môi trường JWT_SECRET');
        return {
          secret,
          // Thời gian sống của token: mặc định 1 ngày nếu không quy định trong .env
          signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN ?? '1d') as any },
        };
      },
    }),
  ],
  // Controllers: Tiếp nhận HTTP request
  controllers: [AuthController],
  // Providers: Các service và guard được quản lý bởi container DI của module này
  providers: [AuthService, JwtAuthGuard],
  // Exports: Cho phép các module khác (OrdersModule, PaymentsModule...) tái sử dụng JwtModule và JwtAuthGuard
  exports: [JwtModule, JwtAuthGuard],
})
export class AuthModule {}
