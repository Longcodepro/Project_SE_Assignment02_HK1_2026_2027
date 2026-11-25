/**
 * DTO nhận dữ liệu đặt hàng mới từ Client.
 */

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

/**
 * Một dòng món trong giỏ hàng
 */
export class OrderItemDto {
  @ApiProperty({ example: 1, minimum: 1, description: 'ID sản phẩm' })
  @IsInt()
  @Min(1)
  productId!: number;

  @ApiProperty({ example: 2, minimum: 1, maximum: 99, description: 'Số lượng ly' })
  @IsInt()
  @Min(1)
  @Max(99)
  quantity!: number;

  @ApiProperty({ enum: Size, example: 'M', description: 'Size ly (S, M, L)' })
  @IsIn(Object.values(Size))
  size!: Size;

  @ApiPropertyOptional({
    type: String,
    isArray: true,
    example: ['tran-chau'],
    description: 'Danh sách mã topping (không được trùng nhau trong cùng 1 ly)',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique() // Chặn gửi trùng mã topping (ví dụ 2 lần 'tran-chau' trong cùng mảng)
  @Matches(/^[a-z0-9-]{2,32}$/, { each: true, message: 'mỗi topping phải là mã topping hợp lệ' })
  toppings?: string[];
}

/**
 * Payload toàn bộ đơn đặt hàng gửi lên POST /orders
 */
export class CreateOrderDto {
  @ApiProperty({ type: OrderItemDto, isArray: true, minItems: 1, description: 'Danh sách món đặt' })
  @IsArray()
  @ArrayNotEmpty({ message: 'Giỏ hàng không được rỗng' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @ApiPropertyOptional({
    example: 'WELCOME10',
    description: 'Mã giảm giá áp dụng cho đơn (tùy chọn)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{3,32}$/, { message: 'promoCode phải từ 3-32 ký tự' })
  promoCode?: string;
}
