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

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Thanh toán mô phỏng bằng Ví hoặc Thẻ' })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: false,
    description: '1-128 ký tự [A-Za-z0-9_-]; gửi lại cùng key trả kết quả cũ, không trừ tiền lần nữa',
  })
  @ApiCreatedResponse({
    type: PaymentResponseDto,
    description: 'Cả khi bị từ chối: status = PAYMENT_FAILED kèm reason',
  })
  @ApiBadRequestResponse({ description: 'Dữ liệu không hợp lệ' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy đơn hàng' })
  @ApiConflictResponse({ description: 'Đơn đã thanh toán hoặc bị xử lý đồng thời' })
  pay(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreatePaymentDto,
    @Headers('idempotency-key') key?: string,
  ) {
    return this.payments.pay(user.phone, dto, parseIdempotencyKey(key));
  }
}
