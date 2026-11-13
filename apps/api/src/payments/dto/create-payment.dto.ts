import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsString, Matches, ValidateIf } from 'class-validator';
import { OrderStatus } from '../../generated/prisma/enums.js';

export class CreatePaymentDto {
  @ApiProperty({ example: 'ord_a1b2c3d4e5' })
  @IsString()
  orderId!: string;

  @ApiProperty({ enum: ['WALLET', 'CARD'], example: 'WALLET', description: 'Ví từ chối khi đơn trên 500.000đ' })
  @IsIn(['WALLET', 'CARD'])
  method!: 'WALLET' | 'CARD';

  // Chỉ cần khi trả bằng thẻ. Số thẻ không được lưu lại.
  @ApiPropertyOptional({
    example: '4111111111111111',
    description: 'Bắt buộc khi method = CARD (13-19 chữ số); 4 số cuối 0000 bị từ chối',
  })
  @ValidateIf((o: CreatePaymentDto) => o.method === 'CARD')
  @Matches(/^\d{13,19}$/, { message: 'cardNumber must be 13-19 digits' })
  cardNumber?: string;
}

export class PaymentResponseDto {
  @ApiProperty({ example: 1 })
  paymentId!: number;

  @ApiProperty({ example: 'ord_a1b2c3d4e5' })
  orderId!: string;

  @ApiProperty({ enum: ['WALLET', 'CARD'], example: 'WALLET' })
  method!: string;

  @ApiProperty({ example: 71000, description: 'VND' })
  amount!: number;

  @ApiProperty({ enum: [OrderStatus.PAID, OrderStatus.PAYMENT_FAILED], example: OrderStatus.PAID })
  status!: string;

  @ApiProperty({ example: 71, description: 'Điểm tích lũy: 1 điểm / 1.000đ khi thành công' })
  pointsEarned!: number;

  @ApiPropertyOptional({ example: 'Thẻ bị từ chối', description: 'Chỉ có khi PAYMENT_FAILED' })
  reason?: string;
}
