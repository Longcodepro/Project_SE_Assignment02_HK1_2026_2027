/**
 * PrismaModule: Module toàn cục (Global Module) cung cấp kết nối Database.
 *
 * Nhờ decorator @Global(), bất kỳ module nào trong ứng dụng (AuthModule, ProductsModule, OrdersModule...)
 * đều có thể Inject trực tiếp `PrismaService` vào constructor mà không cần phải import PrismaModule thủ công nhiều lần.
 */

import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Export PrismaService ra toàn bộ hệ thống
})
export class PrismaModule {}
