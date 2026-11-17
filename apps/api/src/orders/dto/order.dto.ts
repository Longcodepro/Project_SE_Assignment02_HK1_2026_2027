/**
 * DTO định dạng dữ liệu trả về cho Đơn hàng (Summary & History).
 */

import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus, Size } from '../../generated/prisma/enums.js';
import { OrderReviewDto } from '../../reviews/dto/review.dto.js';

/**
 * Tóm tắt đơn hàng trả về sau khi tạo mới (POST /orders)
 */
export class OrderSummaryDto {
  @ApiProperty({ example: 'ord_a1b2c3d4e5', description: 'Mã đơn hàng duy nhất' })
  id!: string;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PENDING })
  status!: string;

  @ApiProperty({
    example: 71000,
    description: 'Tổng tiền thực trả (VND, server tự tính, đã trừ giảm giá)',
  })
  total!: number;

  @ApiProperty({
    example: 0,
    description: 'Số tiền được giảm từ voucher (0 nếu không áp mã)',
  })
  discountAmount!: number;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'WELCOME10',
    description: 'Mã giảm giá đã áp dụng (null nếu không dùng)',
  })
  promoCode!: string | null;
}

/**
 * Chi tiết một dòng món trong lịch sử đơn hàng
 */
export class OrderHistoryItemDto {
  @ApiProperty({ example: 1 })
  productId!: number;

  @ApiProperty({ example: 'Cà phê sữa' })
  productName!: string;

  @ApiProperty({ example: 2 })
  quantity!: number;

  @ApiProperty({ enum: Size, example: Size.M })
  size!: string;

  @ApiProperty({
    type: String,
    isArray: true,
    example: ['tran-chau'],
    description: 'Mã các topping kèm theo',
  })
  toppings!: string[];

  @ApiProperty({
    example: 42000,
    description: 'VND, đơn giá 1 ly tại thời điểm mua (đã gồm phụ thu size + topping)',
  })
  unitPrice!: number;
}

/**
 * Cấu trúc đầy đủ một đơn hàng trong danh sách lịch sử (GET /orders/me)
 */
export class OrderHistoryDto extends OrderSummaryDto {
  @ApiProperty({
    type: String,
    nullable: true,
    example: '038417',
    description: 'Mã nhận hàng 6 số; chỉ xuất hiện khi status là READY để ra quầy nhận món',
  })
  pickupCode!: string | null;

  @ApiProperty({
    example: 2,
    description: 'Phiên bản đơn hàng phục vụ khóa lạc quan khi hủy đơn',
  })
  version!: number;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'Đổi ý',
    description: 'Lý do hủy đơn nếu đã bị hủy',
  })
  cancelReason!: string | null;

  @ApiProperty({
    type: OrderReviewDto,
    nullable: true,
    description: 'Đánh giá sao và nhận xét của khách (null nếu chưa đánh giá)',
  })
  review!: OrderReviewDto | null;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    example: '2026-11-14T04:10:00.000Z',
    description: 'Thời điểm hoàn tiền mô phỏng',
  })
  refundedAt!: Date | null;

  @ApiProperty({ example: '2026-11-06T13:55:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ type: OrderHistoryItemDto, isArray: true })
  items!: OrderHistoryItemDto[];
}
