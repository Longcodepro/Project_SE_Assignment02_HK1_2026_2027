/**
 * PrismaService: Cầu nối quản lý kết nối cơ sở dữ liệu PostgreSQL cho NestJS.
 *
 * Kế thừa từ PrismaClient (được sinh tự động từ prisma/schema.prisma).
 * Sử dụng Driver Adapter '@prisma/adapter-pg' để tối ưu hóa hiệu năng connection pooling của PostgreSQL.
 */

import { Injectable } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    // Khởi tạo PrismaClient với adapter pg kết nối tới chuỗi DATABASE_URL trong .env
    super({
      adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    });
  }
}
