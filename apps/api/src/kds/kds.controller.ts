import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles, RolesGuard } from '../auth/roles.guard.js';
import { KdsOrderDto, KdsStatusResultDto, UpdateKdsStatusDto } from './dto/kds.dto.js';
import { KdsService } from './kds.service.js';

@ApiTags('kds')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Thiếu hoặc sai token' })
@ApiForbiddenResponse({ description: 'Không phải tài khoản BARISTA' })
@Controller('kds/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('BARISTA')
export class KdsController {
  constructor(private readonly kds: KdsService) {}

  @Get()
  @ApiOperation({ summary: 'Đơn chờ pha chế (PAID, PREPARING), cũ nhất lên đầu' })
  @ApiOkResponse({ type: KdsOrderDto, isArray: true })
  list() {
    return this.kds.list();
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Chuyển PAID → PREPARING → READY, kiểm tra version' })
  @ApiOkResponse({ type: KdsStatusResultDto })
  @ApiBadRequestResponse({ description: 'status hoặc version không hợp lệ' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy đơn hàng' })
  @ApiConflictResponse({ description: 'Sai version hoặc chuyển sai thứ tự' })
  changeStatus(@Param('id') id: string, @Body() dto: UpdateKdsStatusDto) {
    return this.kds.changeStatus(id, dto);
  }
}
