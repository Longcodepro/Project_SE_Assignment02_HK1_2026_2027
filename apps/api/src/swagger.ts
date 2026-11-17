/**
 * Cấu hình OpenAPI / Swagger UI cho toàn bộ Backend.
 *
 * Nhiệm vụ:
 * 1. Khởi tạo tài liệu API tại đường dẫn /docs.
 * 2. Cung cấp file đặc tả JSON tại /docs-json (dùng để import 1-click vào Postman).
 * 3. Kích hoạt nút "Authorize" (Bearer Auth) trên giao diện Swagger để test token JWT.
 */

import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('BrewLite API')
  .setDescription('API đặt cà phê không dùng tiền mặt. Hợp đồng chi tiết: docs/API-CONTRACT.md')
  .setVersion('1.0')
  .addBearerAuth() // Thêm nút Authorize nhập JWT Bearer token trên giao diện web Swagger
  .build();

/**
 * Gắn Swagger vào ứng dụng NestJS
 */
export function setupSwagger(app: INestApplication) {
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig));
}
