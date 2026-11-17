/**
 * DTO cho chức năng hủy đơn hàng POST /orders/:id/cancel.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { OrderStatus } from '../../generated/prisma/enums.js';

/**
 * Payload gửi lên khi yêu cầu hủy đơn
 */
export class CancelOrderDto {
  @ApiProperty({
    example: 2,
    minimum: 0,
    description: 'Version của đơn hàng tại thời điểm xem. Dùng cho Khóa lạc quan (Optimistic Locking), sai version -> 409',
  })
  @IsInt()
  @Min(0)
  version!: number;

  @ApiPropertyOptional({
    example: 'Đổi ý, không muốn uống nữa',
    maxLength: 200,
    description: 'Lý do hủy đơn. BẮT BUỘC nếu đơn đã thanh toán (PAID)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}

/**
 * Kết quả trả về sau khi hủy đơn thành công
 */
export class CancelOrderResultDto {
  @ApiProperty({ example: 'ord_a1b2c3d4e5' })
  id!: string;

  @ApiProperty({ enum: [OrderStatus.CANCELLED], example: OrderStatus.CANCELLED })
  status!: string;

  @ApiProperty({ example: 3, description: 'Version mới sau khi hủy (tăng lên 1)' })
  version!: number;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    example: '2026-11-14T04:10:00.000Z',
    description: 'Thời điểm hoàn tiền mô phỏng (null nếu đơn chưa thanh toán)',
  })
  refundedAt!: Date | null;
}
