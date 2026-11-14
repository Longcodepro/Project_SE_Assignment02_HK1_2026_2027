import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  Matches,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { DiscountType } from '../../generated/prisma/enums.js';

export const DISCOUNT_TYPES = ['FIXED', 'PERCENT'] as const;
export const MAX_DISCOUNT_VALUE = 10_000_000;
const MAX_MIN_ORDER = 100_000_000;

// Trường không bắt buộc nhưng đã gửi thì không được null (khác @IsOptional cho phép null)
const WhenSent = () => ValidateIf((_o, v) => v !== undefined);

const upperCase = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.toUpperCase() : value;

export class CreatePromotionDto {
  @ApiProperty({ example: 'TET2027', description: '3-32 ký tự: chữ, số, _ hoặc -; lưu chữ hoa, không đổi được' })
  @Transform(upperCase)
  @Matches(/^[A-Z0-9_-]{3,32}$/, { message: 'code must be 3-32 characters: letters, digits, _ or -' })
  code!: string;

  @ApiProperty({ enum: DISCOUNT_TYPES, example: 'PERCENT' })
  @IsIn(DISCOUNT_TYPES)
  discountType!: (typeof DISCOUNT_TYPES)[number];

  @ApiProperty({ example: 15, minimum: 1, description: 'PERCENT: 1 đến 100; FIXED: VND' })
  @IsInt()
  @Min(1)
  @Max(MAX_DISCOUNT_VALUE)
  discountValue!: number;

  @ApiPropertyOptional({ example: 60000, minimum: 0, default: 0, description: 'VND, tính trước giảm' })
  @WhenSent()
  @IsInt()
  @Min(0)
  @Max(MAX_MIN_ORDER)
  minOrderAmount?: number;

  @ApiPropertyOptional({ example: '2027-02-20T16:59:59.000Z', nullable: true, description: 'Bỏ trống hoặc null là không hết hạn' })
  @IsOptional()
  @IsISO8601({ strict: true })
  expiryDate?: string | null;

  @ApiPropertyOptional({ example: 200, minimum: 1, nullable: true, description: 'Bỏ trống hoặc null là không giới hạn' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number | null;
}

export class UpdatePromotionDto {
  @ApiPropertyOptional({ enum: DISCOUNT_TYPES })
  @WhenSent()
  @IsIn(DISCOUNT_TYPES)
  discountType?: (typeof DISCOUNT_TYPES)[number];

  @ApiPropertyOptional({ example: 20, minimum: 1 })
  @WhenSent()
  @IsInt()
  @Min(1)
  @Max(MAX_DISCOUNT_VALUE)
  discountValue?: number;

  @ApiPropertyOptional({ example: 80000, minimum: 0 })
  @WhenSent()
  @IsInt()
  @Min(0)
  @Max(MAX_MIN_ORDER)
  minOrderAmount?: number;

  @ApiPropertyOptional({ example: '2027-02-20T16:59:59.000Z', nullable: true, description: 'null để bỏ hạn' })
  @IsOptional()
  @IsISO8601({ strict: true })
  expiryDate?: string | null;

  @ApiPropertyOptional({ example: 500, minimum: 1, nullable: true, description: 'null để bỏ giới hạn; không nhỏ hơn usedCount' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number | null;

  @ApiPropertyOptional({ example: false, description: 'false là vô hiệu mã' })
  @WhenSent()
  @IsBoolean()
  isActive?: boolean;
}

export class PromotionDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'WELCOME10' })
  code!: string;

  @ApiProperty({ enum: DiscountType, example: DiscountType.PERCENT })
  discountType!: string;

  @ApiProperty({ example: 10 })
  discountValue!: number;

  @ApiProperty({ example: 50000 })
  minOrderAmount!: number;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ type: String, format: 'date-time', nullable: true, example: null })
  expiryDate!: Date | null;

  @ApiProperty({ type: Number, nullable: true, example: 1000 })
  maxUses!: number | null;

  @ApiProperty({ example: 3 })
  usedCount!: number;
}
