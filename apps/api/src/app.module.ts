/**
 * AppModule: Root Module (Module gốc) của ứng dụng NestJS.
 *
 * Nhiệm vụ:
 * 1. Tập hợp và kết nối tất cả 14 module con trong toàn bộ hệ thống.
 * 2. Cấu hình APM Observability (@nestjs/observe) để thu thập telemetry, tracing và metrics.
 * 3. Đăng ký AppController và AppService xử lý endpoint gốc (GET /).
 */

import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { CashierModule } from './cashier/cashier.module.js';
import { InventoryModule } from './inventory/inventory.module.js';
import { KdsModule } from './kds/kds.module.js';
import { LoyaltyModule } from './loyalty/loyalty.module.js';
import { MenuModule } from './menu/menu.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { PaymentsModule } from './payments/payments.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProductsModule } from './products/products.module.js';
import { PromotionsModule } from './promotions/promotions.module.js';
import { ReportsModule } from './reports/reports.module.js';
import { ReviewsModule } from './reviews/reviews.module.js';
import { StaffModule } from './staff/staff.module.js';

// Khởi tạo công cụ giám sát hiệu năng APM của NestJS
export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // 1. Module cơ sở hạ tầng
    PrismaModule,

    // 2. Các module nghiệp vụ cốt lõi (Khách hàng & Bán lẻ)
    AuthModule,        // Đăng ký, đăng nhập, JWT, RBAC
    ProductsModule,    // Danh mục & sản phẩm hiển thị trên Menu
    OrdersModule,      // Đặt hàng, tính giá server-side, khóa lạc quan version
    PaymentsModule,    // Thanh toán Thẻ/Ví, chống gửi trùng, tích điểm
    LoyaltyModule,     // Điểm thưởng & hạng thành viên

    // 3. Các module vận hành cửa hàng & nội bộ
    KdsModule,         // Kitchen Display System: Màn hình pha chế cho Barista
    CashierModule,     // Thu ngân: Đơn tại quầy, xuất hóa đơn
    InventoryModule,   // Quản lý kho, công thức (Recipe), trừ nguyên liệu tự động
    MenuModule,        // Quản lý món, danh mục, giá size và topping (Admin)
    PromotionsModule,  // Khuyến mãi, mã voucher giảm giá (Fixed/Percent)
    StaffModule,       // Quản lý tài khoản nhân viên (Barista, Cashier, Admin)
    ReviewsModule,     // Đánh giá 1-1 cho đơn hàng hoàn tất
    ReportsModule,     // Báo cáo doanh thu, tồn kho, sản phẩm bán chạy

    // 4. Module giám sát hiệu năng thời gian thực (Telemetry / APM)
    ObserveModule.forRoot({
      appKey: process.env.OBSERVE_APP_KEY ?? 'YOUR_APP_KEY',
      appSecret: process.env.OBSERVE_APP_SECRET ?? 'YOUR_APP_SECRET',
      serviceId: 'backend',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
