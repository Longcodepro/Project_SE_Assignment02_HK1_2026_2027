/**
 * File khởi động chính của Backend (Entry Point).
 *
 * Nhiệm vụ khi hàm bootstrap() chạy:
 * 1. Khởi tạo NestJS IoC Container từ AppModule.
 * 2. Đăng ký HTTP Logger Middleware để đo thời gian phản hồi (latency) của từng request.
 * 3. Thiết lập Swagger UI tại đường dẫn /docs.
 * 4. Kích hoạt ValidationPipe toàn cục để lọc và kiểm tra dữ liệu DTO.
 * 5. Cấu hình CORS (Cross-Origin Resource Sharing) cho phép Frontend truy cập an toàn.
 * 6. Mở cổng TCP lắng nghe (mặc định cổng 4003).
 */

import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { setupSwagger } from './swagger.js';
import { createValidationPipe } from './common/validation.js';
import { AppModule, ObserveInstrument } from './app.module.js';

async function bootstrap() {
  // 1. Tạo instance ứng dụng NestJS kèm công cụ giám sát Observe Instrument
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });

  // 2. Middleware ghi log HTTP: Bấm giờ từ lúc nhận request đến khi res.on('finish')
  const httpLogger = new Logger('HTTP');
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const { method, originalUrl } = req;
    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - start;
      const message = `${method} ${originalUrl} ${statusCode} - ${duration}ms`;
      if (statusCode >= 500) {
        httpLogger.error(message); // Lỗi 5xx: In đỏ (Error)
      } else if (statusCode >= 400) {
        httpLogger.warn(message);  // Lỗi 4xx: In vàng (Warn)
      } else {
        httpLogger.log(message);   // Thành công 2xx/3xx: In xanh (Log)
      }
    });
    next(); // Cho request đi tiếp vào controller
  });

  // 3. Khởi tạo giao diện Swagger tại /docs
  setupSwagger(app);

  // 4. Áp dụng ValidationPipe toàn cục: tự động lọc trường lạ và kiểm tra kiểu dữ liệu DTO
  app.useGlobalPipes(createValidationPipe());

  // 5. Cấu hình CORS: Cho phép Next.js frontend (cổng 4004 hoặc Vercel) gọi API
  const rawFrontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:4004';
  const allowedOrigins = rawFrontendUrl.split(',').map((u) => u.trim());

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Cho phép các request không có origin header (như curl, Postman, server-to-server)
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        allowedOrigins.includes('*') ||
        origin.endsWith('.vercel.app')
      ) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true, // Cho phép truyền cookie / auth header
  });

  // 6. Lắng nghe cổng mạng: Mặc định cổng 4003 (để không trùng cổng 4001 của AS1 và 4005 của DB)
  await app.listen(process.env.PORT ?? 4003);
}

// Chạy hàm bootstrap (sử dụng Top-level await của TypeScript ESM)
await bootstrap();
