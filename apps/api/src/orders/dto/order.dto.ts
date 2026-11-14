import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus, Size } from '../../generated/prisma/enums.js';
import { TOPPING_PRICE } from '../pricing.js';

// Kết quả POST /orders
export class OrderSummaryDto {
  @ApiProperty({ example: 'ord_a1b2c3d4e5' })
  id!: string;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PENDING })
  status!: string;

  @ApiProperty({ example: 71000, description: 'VND, do server tính, đã trừ giảm giá' })
  total!: number;

  @ApiProperty({ example: 0, description: 'VND được giảm nhờ mã giảm giá; 0 nếu không dùng mã' })
  discountAmount!: number;

  @ApiProperty({ type: String, nullable: true, example: 'WELCOME10', description: 'Mã đã áp, null nếu không dùng' })
  promoCode!: string | null;
}

export class OrderHistoryItemDto {
  @ApiProperty({ example: 1 })
  productId!: number;

  @ApiProperty({ example: 'Cà phê sữa' })
  productName!: string;

  @ApiProperty({ example: 2 })
  quantity!: number;

  @ApiProperty({ enum: Size, example: Size.M })
  size!: string;

  @ApiProperty({ enum: Object.keys(TOPPING_PRICE), isArray: true, example: ['tran-chau'] })
  toppings!: string[];

  @ApiProperty({ example: 42000, description: 'VND, giá 1 ly đã gồm size + topping' })
  unitPrice!: number;
}

// Một phần tử của GET /orders/me
export class OrderHistoryDto extends OrderSummaryDto {
  @ApiProperty({
    type: String,
    nullable: true,
    example: '038417',
    description: 'Mã nhận hàng 6 số; chỉ có khi status là READY, ngược lại null',
  })
  pickupCode!: string | null;

  @ApiProperty({ example: '2026-11-06T13:55:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ type: OrderHistoryItemDto, isArray: true })
  items!: OrderHistoryItemDto[];
}
