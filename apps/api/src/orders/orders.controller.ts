import { Body, Controller, Get, Headers, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser, JwtAuthGuard, type AuthUser } from '../auth/jwt-auth.guard.js';
import { parseIdempotencyKey } from '../common/idempotency.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { OrderHistoryDto, OrderSummaryDto } from './dto/order.dto.js';
import { OrdersService } from './orders.service.js';

@ApiTags('orders')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Thiếu hoặc sai token' })
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Đặt đơn; tổng tiền do server tính' })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: false,
    description: '1-128 ký tự [A-Za-z0-9_-]; gửi lại cùng key trả đơn cũ, không tạo đơn mới',
  })
  @ApiCreatedResponse({ type: OrderSummaryDto })
  @ApiBadRequestResponse({ description: 'Dữ liệu không hợp lệ hoặc sản phẩm không tồn tại' })
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateOrderDto,
    @Headers('idempotency-key') key?: string,
  ) {
    return this.ordersService.create(user.phone, dto, parseIdempotencyKey(key));
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lịch sử đơn của tôi, mới nhất trước' })
  @ApiOkResponse({ type: OrderHistoryDto, isArray: true })
  findMine(@CurrentUser() user: AuthUser) {
    return this.ordersService.findMine(user.phone);
  }
}
