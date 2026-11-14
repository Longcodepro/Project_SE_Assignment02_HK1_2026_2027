import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, Matches } from 'class-validator';
import { GROUP_BY, type GroupBy } from '../report.js';

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MESSAGE = 'phải là ngày dạng YYYY-MM-DD';

export class ReportQueryDto {
  @ApiPropertyOptional({ example: '2026-11-01', description: 'Mặc định là to trừ 6 ngày' })
  @IsOptional()
  @Matches(DAY, { message: `from ${DAY_MESSAGE}` })
  from?: string;

  @ApiPropertyOptional({ example: '2026-11-14', description: 'Mặc định là hôm nay (giờ Việt Nam)' })
  @IsOptional()
  @Matches(DAY, { message: `to ${DAY_MESSAGE}` })
  to?: string;

  @ApiPropertyOptional({ enum: GROUP_BY, default: 'day' })
  @IsOptional()
  @IsIn(GROUP_BY)
  groupBy?: GroupBy;
}

class ReportBucketDto {
  @ApiProperty({ example: 1234000, description: 'VND, đơn PAID, PREPARING, READY, COMPLETED' })
  revenue!: number;

  @ApiProperty({ example: 12 })
  completedOrders!: number;

  @ApiProperty({ example: 20, description: 'Mọi đơn tạo trong kỳ' })
  totalOrders!: number;

  @ApiProperty({ example: 2 })
  cancelledOrders!: number;

  @ApiProperty({ example: 0.1, description: 'cancelledOrders / totalOrders, 4 chữ số thập phân' })
  cancelRate!: number;
}

class ReportSeriesDto extends ReportBucketDto {
  @ApiProperty({ example: '2026-11-02', description: 'Ngày, thứ Hai của tuần, hoặc YYYY-MM' })
  period!: string;
}

class TopProductDto {
  @ApiProperty({ example: 1 })
  productId!: number;

  @ApiProperty({ example: 'Cà phê sữa' })
  productName!: string;

  @ApiProperty({ example: 42, description: 'Tổng số ly bán trong cả khoảng' })
  quantity!: number;
}

export class ReportDto {
  @ApiProperty({ example: '2026-11-01' })
  from!: string;

  @ApiProperty({ example: '2026-11-14' })
  to!: string;

  @ApiProperty({ enum: GROUP_BY, example: 'week' })
  groupBy!: string;

  @ApiProperty({ type: ReportBucketDto })
  totals!: ReportBucketDto;

  @ApiProperty({ type: ReportSeriesDto, isArray: true })
  series!: ReportSeriesDto[];

  @ApiProperty({ type: TopProductDto, isArray: true, description: 'Tối đa 5 món bán chạy nhất' })
  topProducts!: TopProductDto[];
}
