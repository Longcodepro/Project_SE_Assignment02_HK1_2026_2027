/**
 * DTO cho chức năng thanh toán đơn hàng (POST /payments).
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsString, Matches, ValidateIf } from 'class-validator';
import { OrderStatus } from '../../generated/prisma/enums.js';

export class CreatePaymentDto {
  @ApiProperty({ example: 'ord_a1b2c3d4e5', description: 'Mã đơn hàng cần thanh toán' })
  @IsString()
  orderId!: string;

  @ApiProperty({
    enum: ['WALLET', 'CARD'],
    example: 'WALLET',
    description: 'Phương thức thanh toán: Ví điện tử (tối đa 500k) hoặc Thẻ',
  })
  @IsIn(['WALLET', 'CARD'])
  method!: 'WALLET' | 'CARD';

  // Số thẻ: Chỉ bắt buộc khi method = CARD. Tuyệt đối không lưu số thẻ vào database.
  @ApiPropertyOptional({
    example: '4111111111111111',
    description: 'Số thẻ ngân hàng 13-19 chữ số (4 số cuối 0000 sẽ bị từ chối để test)',
  })
  @ValidateIf((o: CreatePaymentDto) => o.method === 'CARD')
  @Matches(/^\d{13,19}$/, { message: 'cardNumber phải là chuỗi từ 13 đến 19 chữ số' })
  cardNumber?: string;
}

/**
 * Kết quả giao dịch trả về cho Client
 */
export class PaymentResponseDto {
  @ApiProperty({ example: 1, description: 'ID giao dịch thanh toán' })
  paymentId!: number;

  @ApiProperty({ example: 'ord_a1b2c3d4e5' })
  orderId!: string;

  @ApiProperty({ enum: ['WALLET', 'CARD'], example: 'WALLET' })
  method!: string;

  @ApiProperty({ example: 71000, description: 'Số tiền đã thanh toán (VND)' })
  amount!: number;

  @ApiProperty({
    enum: [OrderStatus.PAID, OrderStatus.PAYMENT_FAILED],
    example: OrderStatus.PAID,
    description: 'Trạng thái kết quả: PAID nếu thành công, PAYMENT_FAILED nếu bị từ chối',
  })
  status!: string;

  @ApiProperty({ example: 71, description: 'Số điểm thưởng nhận được (1 điểm / 1.000đ)' })
  pointsEarned!: number;

  @ApiPropertyOptional({ example: 'Thẻ bị từ chối', description: 'Lý do lỗi (chỉ có khi PAYMENT_FAILED)' })
  reason?: string;
}
