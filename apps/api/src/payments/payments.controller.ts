/**
 * PaymentsController: Tiếp nhận yêu cầu thanh toán POST /payments.
 * Yêu cầu đăng nhập (JwtAuthGuard).
 */

import { Body, Controller, Headers, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser, JwtAuthGuard, type AuthUser } from '../auth/jwt-auth.guard.js';
import { parseIdempotencyKey } from '../common/idempotency.js';
import { CreatePaymentDto, PaymentResponseDto } from './dto/create-payment.dto.js';
import { PaymentsService } from './payments.service.js';

@ApiTags('payments')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Thiếu hoặc sai token' })
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  /**
   * Thanh toán đơn hàng bằng Ví hoặc Thẻ
   * Nhận header Idempotency-Key tùy chọn để chống trừ tiền 2 lần khi gửi lặp request.
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Thanh toán mô phỏng bằng Ví hoặc Thẻ' })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: false,
    description: '1-128 ký tự; gửi lại cùng key trả kết quả cũ, không trừ tiền lần nữa',
  })
  @ApiCreatedResponse({
    type: PaymentResponseDto,
    description: 'Trả về 201 cả khi thẻ bị từ chối (status = PAYMENT_FAILED kèm lý do)',
  })
  @ApiBadRequestResponse({ description: 'Dữ liệu không hợp lệ (sai số thẻ, sai method)' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy đơn hàng' })
  @ApiConflictResponse({ description: 'Đơn đã thanh toán rồi hoặc bị xử lý đồng thời' })
  pay(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreatePaymentDto,
    @Headers('idempotency-key') key?: string,
  ) {
    return this.payments.pay(user.phone, dto, parseIdempotencyKey(key));
  }
}
