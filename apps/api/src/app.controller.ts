import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service.js';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Kiểm tra backend đang chạy' })
  @ApiOkResponse({ description: 'Hello World!', schema: { type: 'string' } })
  getHello(): string {
    return this.appService.getHello();
  }
}
