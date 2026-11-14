import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Matches } from 'class-validator';
import { OrderStatus, Size } from '../../generated/prisma/enums.js';

// Hai loại đơn Cashier xử lý được: giao món (READY) và hủy tại quầy (PAID)
export const CASHIER_LIST_STATUSES = ['READY', 'PAID'] as const;

export class CashierListQueryDto {
  @ApiPropertyOptional({ enum: CASHIER_LIST_STATUSES, description: 'Bỏ trống thì lấy cả hai' })
  @IsOptional()
  @IsIn(CASHIER_LIST_STATUSES)
  status?: (typeof CASHIER_LIST_STATUSES)[number];
}

export class CompleteOrderDto {
  @ApiProperty({ example: '038417', description: 'Đúng 6 chữ số, khách đọc ở GET /orders/me' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'pickupCode must be exactly 6 digits' })
  pickupCode!: string;
}

export class CashierItemDto {
  @ApiProperty({ example: 'Cà phê sữa' })
  productName!: string;

  @ApiProperty({ example: 2 })
  quantity!: number;

  @ApiProperty({ enum: Size, example: Size.M })
  size!: string;

  @ApiProperty({ type: String, isArray: true, example: ['tran-chau'] })
  toppings!: string[];
}

export class CashierOrderDto {
  @ApiProperty({ example: 'ord_a1b2c3d4e5' })
  id!: string;

  @ApiProperty({ enum: [OrderStatus.READY, OrderStatus.PAID], example: OrderStatus.READY })
  status!: string;

  @ApiProperty({ example: 3, description: 'Gửi lại khi đổi trạng thái (hủy đơn)' })
  version!: number;

  @ApiProperty({ example: 84000, description: 'VND' })
  total!: number;

  @ApiProperty({ example: '2026-11-14T03:40:26.834Z' })
  createdAt!: Date;

  @ApiProperty({ type: CashierItemDto, isArray: true })
  items!: CashierItemDto[];
}

export class CompleteOrderResultDto {
  @ApiProperty({ example: 'ord_a1b2c3d4e5' })
  id!: string;

  @ApiProperty({ enum: [OrderStatus.COMPLETED], example: OrderStatus.COMPLETED })
  status!: string;

  @ApiProperty({ example: 4, description: 'Đã tăng 1' })
  version!: number;
}
