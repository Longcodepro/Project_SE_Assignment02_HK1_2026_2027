import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { SIZE_EXTRA, TOPPING_PRICE, type SizeId, type ToppingId } from '../pricing.js';

export class OrderItemDto {
  @ApiProperty({ example: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  productId!: number;

  @ApiProperty({ example: 2, minimum: 1, maximum: 99 })
  @IsInt()
  @Min(1)
  @Max(99)
  quantity!: number;

  @ApiProperty({ enum: Object.keys(SIZE_EXTRA), example: 'M', description: 'Phụ thu S +0, M +5.000, L +10.000đ' })
  @IsIn(Object.keys(SIZE_EXTRA))
  size!: SizeId;

  @ApiPropertyOptional({
    enum: Object.keys(TOPPING_PRICE),
    isArray: true,
    example: ['tran-chau'],
    description: 'tran-chau +8.000, kem-cheese +10.000, thach-cafe +6.000đ; không trùng nhau',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsIn(Object.keys(TOPPING_PRICE), { each: true })
  toppings?: ToppingId[];
}

export class CreateOrderDto {
  @ApiProperty({ type: OrderItemDto, isArray: true, minItems: 1 })
  @IsArray()
  @ArrayNotEmpty({ message: 'items must not be empty' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @ApiPropertyOptional({
    example: 'WELCOME10',
    description: 'Mã giảm giá, tối đa một mã mỗi đơn; server tính số tiền giảm',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{3,32}$/, { message: 'promoCode must be 3-32 characters: letters, digits, _ or -' })
  promoCode?: string;
}
