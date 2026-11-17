/**
 * AppController: Tiếp nhận các request kiểm tra tình trạng sống còn của server (Health Check).
 *
 * Thường được gọi bởi:
 * - Docker healthcheck (docker-compose.yml).
 * - Load Balancer (Nginx) để kiểm tra backend container còn sống hay đã chết để định tuyến traffic.
 * - Uptime monitor để gửi cảnh báo khi sập server.
 */

import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service.js';

@ApiTags('health') // Nhóm vào mục 'health' trên Swagger
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Endpoint GET /: Trả về chuỗi chào mừng cơ bản
   */
  @Get()
  @ApiOperation({ summary: 'Kiểm tra backend đang chạy' })
  @ApiOkResponse({ description: 'Hello World!', schema: { type: 'string' } })
  getHello(): string {
    return this.appService.getHello();
  }

  /**
   * Endpoint GET /health: Dùng cho Nginx Load Balancer và Docker kiểm tra sức khỏe
   */
  @Get('health')
  @ApiOperation({ summary: 'Kiểm tra trạng thái sức khỏe hệ thống (Health Check)' })
  @ApiOkResponse({ description: 'Hệ thống hoạt động bình thường' })
  getHealth(): { status: string; timestamp: string } {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
