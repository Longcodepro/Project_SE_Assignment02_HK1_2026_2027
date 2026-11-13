import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, Min } from 'class-validator';
import { OrderStatus, Size } from '../../generated/prisma/enums.js';

// Barista chỉ được đẩy đơn tới hai trạng thái này
export const KDS_TARGETS = ['PREPARING', 'READY'] as const;
export type KdsTarget = (typeof KDS_TARGETS)[number];

export class UpdateKdsStatusDto {
  @ApiProperty({ enum: KDS_TARGETS, example: 'PREPARING' })
  @IsIn(KDS_TARGETS)
  status!: KdsTarget;

  @ApiProperty({ example: 1, minimum: 0, description: 'Lấy từ GET /kds/orders; sai thì 409' })
  @IsInt()
  @Min(0)
  version!: number;
}

export class KdsItemDto {
  @ApiProperty({ example: 'Cà phê sữa' })
  productName!: string;

  @ApiProperty({ example: 2 })
  quantity!: number;

  @ApiProperty({ enum: Size, example: Size.M })
  size!: string;

  @ApiProperty({ type: String, isArray: true, example: ['tran-chau'] })
  toppings!: string[];
}

export class KdsOrderDto {
  @ApiProperty({ example: 'ord_a1b2c3d4e5' })
  id!: string;

  @ApiProperty({ enum: [OrderStatus.PAID, OrderStatus.PREPARING], example: OrderStatus.PAID })
  status!: string;

  @ApiProperty({ example: 1, description: 'Gửi lại khi đổi trạng thái' })
  version!: number;

  @ApiProperty({ example: '2026-11-13T03:40:26.834Z' })
  createdAt!: Date;

  @ApiProperty({ type: KdsItemDto, isArray: true })
  items!: KdsItemDto[];
}

export class KdsStatusResultDto {
  @ApiProperty({ example: 'ord_a1b2c3d4e5' })
  id!: string;

  @ApiProperty({ enum: KDS_TARGETS, example: OrderStatus.PREPARING })
  status!: string;

  @ApiProperty({ example: 2, description: 'Đã tăng 1, dùng cho lần đổi tiếp theo' })
  version!: number;
}
