import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  stars!: number;

  @ApiPropertyOptional({ example: 'Cà phê ngon, ra món nhanh', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}

export class ReviewDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'ord_a1b2c3d4e5' })
  orderId!: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  stars!: number;

  @ApiProperty({ type: String, nullable: true, example: 'Cà phê ngon, ra món nhanh' })
  comment!: string | null;

  @ApiProperty({ example: '2026-11-14T04:30:00.000Z' })
  createdAt!: Date;
}

// Đánh giá đính kèm đơn ở GET /orders/me
export class OrderReviewDto {
  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  stars!: number;

  @ApiProperty({ type: String, nullable: true, example: 'Cà phê ngon, ra món nhanh' })
  comment!: string | null;
}
