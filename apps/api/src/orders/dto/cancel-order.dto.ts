import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { OrderStatus } from '../../generated/prisma/enums.js';

export class CancelOrderDto {
  @ApiProperty({ example: 2, minimum: 0, description: 'Lấy từ GET /orders/me; sai thì 409' })
  @IsInt()
  @Min(0)
  version!: number;

  @ApiPropertyOptional({
    example: 'Đổi ý, không muốn uống nữa',
    maxLength: 200,
    description: 'Bắt buộc khi đơn đang PAID',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}

export class CancelOrderResultDto {
  @ApiProperty({ example: 'ord_a1b2c3d4e5' })
  id!: string;

  @ApiProperty({ enum: [OrderStatus.CANCELLED], example: OrderStatus.CANCELLED })
  status!: string;

  @ApiProperty({ example: 3, description: 'Đã tăng 1' })
  version!: number;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    example: '2026-11-14T04:10:00.000Z',
    description: 'Thời điểm hoàn tiền mô phỏng; null nếu đơn chưa từng PAID',
  })
  refundedAt!: Date | null;
}
