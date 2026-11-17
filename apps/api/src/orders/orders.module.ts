/**
 * OrdersModule: Quản lý toàn bộ vòng đời đơn hàng đặt online.
 * Cần AuthModule để sử dụng JwtAuthGuard bảo vệ các endpoint đặt hàng và xem lịch sử.
 */

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';

@Module({
  imports: [AuthModule], // Nhập AuthModule để dùng JwtAuthGuard
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService], // Export cho CashierModule, PaymentsModule dùng chung
})
export class OrdersModule {}
