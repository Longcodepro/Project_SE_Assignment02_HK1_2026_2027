import { Body, Controller, Get, HttpCode, Param, Post, Query, UseGuards } from '@nestjs/common';
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
import { CashierService } from './cashier.service.js';
import {
  CashierListQueryDto,
  CashierOrderDto,
  CompleteOrderDto,
  CompleteOrderResultDto,
} from './dto/cashier.dto.js';

@ApiTags('cashier')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Thiếu hoặc sai token' })
@ApiForbiddenResponse({ description: 'Không phải tài khoản CASHIER' })
@Controller('cashier/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('CASHIER')
export class CashierController {
  constructor(private readonly cashier: CashierService) {}

  @Get()
  @ApiOperation({ summary: 'Đơn READY (chờ giao) và PAID (có thể hủy), cũ nhất lên đầu' })
  @ApiOkResponse({ type: CashierOrderDto, isArray: true })
  @ApiBadRequestResponse({ description: 'status ngoài READY/PAID' })
  list(@Query() query: CashierListQueryDto) {
    return this.cashier.list(query);
  }

  @Post(':id/complete')
  @HttpCode(200)
  @ApiOperation({ summary: 'Nhập mã nhận hàng để giao món: READY → COMPLETED' })
  @ApiOkResponse({ type: CompleteOrderResultDto })
  @ApiBadRequestResponse({ description: 'pickupCode sai định dạng hoặc sai mã' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy đơn hàng' })
  @ApiConflictResponse({ description: 'Đơn không ở trạng thái READY hoặc vừa bị cập nhật' })
  complete(@Param('id') id: string, @Body() dto: CompleteOrderDto) {
    return this.cashier.complete(id, dto);
  }
}
