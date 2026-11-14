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
import { Size } from '../../generated/prisma/enums.js';

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

  @ApiProperty({ enum: Size, example: 'M', description: 'Phụ thu theo bảng giá hiện hành (GET /menu-options)' })
  @IsIn(Object.values(Size))
  size!: Size;

  @ApiPropertyOptional({
    type: String,
    isArray: true,
    example: ['tran-chau'],
    description: 'Mã topping đang bán (GET /menu-options); không trùng nhau; mã lạ trả 400',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Matches(/^[a-z0-9-]{2,32}$/, { each: true, message: 'mỗi topping phải là mã topping hợp lệ' })
  toppings?: string[];
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
