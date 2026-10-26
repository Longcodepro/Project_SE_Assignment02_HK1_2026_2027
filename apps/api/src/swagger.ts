import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('BrewLite API')
  .setDescription('API đặt cà phê không dùng tiền mặt. Hợp đồng chi tiết: docs/API-CONTRACT.md')
  .setVersion('1.0')
  .build();

// UI ở /docs, JSON (import được vào Postman) ở /docs-json
export function setupSwagger(app: INestApplication) {
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig));
}
