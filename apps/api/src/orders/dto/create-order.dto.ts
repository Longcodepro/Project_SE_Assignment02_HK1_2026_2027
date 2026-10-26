import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { SIZE_EXTRA, TOPPING_PRICE, type SizeId, type ToppingId } from '../pricing.js';

export class OrderItemDto {
  @IsInt()
  @Min(1)
  productId!: number;

  @IsInt()
  @Min(1)
  @Max(99)
  quantity!: number;

  @IsIn(Object.keys(SIZE_EXTRA))
  size!: SizeId;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsIn(Object.keys(TOPPING_PRICE), { each: true })
  toppings?: ToppingId[];
}

export class CreateOrderDto {
  @IsArray()
  @ArrayNotEmpty({ message: 'items must not be empty' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];
}
