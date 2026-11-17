/**
 * OrdersController: Tiếp nhận các yêu cầu liên quan đến đơn hàng của khách.
 * Tất cả endpoint đều được bảo vệ bởi JwtAuthGuard (phải đăng nhập).
 */

import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  CurrentUser,
  JwtAuthGuard,
  type AuthUser,
} from '../auth/jwt-auth.guard.js';
import { parseIdempotencyKey } from '../common/idempotency.js';
import {
  CancelOrderDto,
  CancelOrderResultDto,
} from './dto/cancel-order.dto.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { OrderHistoryDto, OrderSummaryDto } from './dto/order.dto.js';
import { OrdersService } from './orders.service.js';

@ApiTags('orders')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Thiếu hoặc sai token' })
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * Đặt đơn hàng mới
   * Nhận header Idempotency-Key tùy chọn để chống tạo đơn trùng khi mạng lag.
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Đặt đơn; tổng tiền do server tính' })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: false,
    description: '1-128 ký tự; gửi lại cùng key trả đơn cũ, không tạo đơn mới',
  })
  @ApiCreatedResponse({ type: OrderSummaryDto })
  @ApiBadRequestResponse({ description: 'Dữ liệu không hợp lệ hoặc sản phẩm không tồn tại' })
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateOrderDto,
    @Headers('idempotency-key') key?: string,
  ) {
    // user.phone lấy trực tiếp từ Token đã giải mã, không tin số điện thoại từ body
    return this.ordersService.create(user.phone, dto, parseIdempotencyKey(key));
  }

  /**
   * Khách hàng hủy đơn của chính mình
   * Chỉ hủy được khi đơn ở PENDING, PAYMENT_FAILED hoặc PAID (PAID bắt buộc có lý do).
   */
  @Post(':id/cancel')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Khách hủy đơn của mình; PAID cần lý do' })
  @ApiOkResponse({ type: CancelOrderResultDto })
  @ApiBadRequestResponse({ description: 'version/reason không hợp lệ, hoặc đơn PAID thiếu lý do' })
  @ApiNotFoundResponse({ description: 'Không có đơn này hoặc không phải đơn của bạn' })
  @ApiConflictResponse({ description: 'Sai version (bị đổi trước đó) hoặc đơn đã sang PREPARING' })
  cancel(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: CancelOrderDto,
  ) {
    return this.ordersService.cancel(id, dto, {
      kind: 'customer',
      phone: user.phone,
    });
  }

  /**
   * Xem lịch sử các đơn hàng của chính tài khoản đang đăng nhập
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lịch sử đơn của tôi, mới nhất trước' })
  @ApiOkResponse({ type: OrderHistoryDto, isArray: true })
  findMine(@CurrentUser() user: AuthUser) {
    return this.ordersService.findMine(user.phone);
  }
}
