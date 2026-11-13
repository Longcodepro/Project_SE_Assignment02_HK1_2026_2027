import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser, JwtAuthGuard, type AuthUser } from '../auth/jwt-auth.guard.js';
import { LoyaltyService } from './loyalty.service.js';

export class LoyaltyHistoryDto {
  @ApiProperty({ example: 'ord_a1b2c3d4e5' })
  orderId!: string;

  @ApiProperty({ example: 71 })
  pointsEarned!: number;

  @ApiProperty({ example: '2026-11-06T13:55:00.000Z' })
  createdAt!: Date;
}

export class LoyaltyDto {
  @ApiProperty({ example: 120, description: 'Tổng điểm hiện có' })
  balance!: number;

  @ApiProperty({ type: LoyaltyHistoryDto, isArray: true, description: 'Các lần tích điểm, mới nhất trước' })
  history!: LoyaltyHistoryDto[];
}

@ApiTags('loyalty')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Thiếu hoặc sai token' })
@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyalty: LoyaltyService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Điểm tích lũy và lịch sử tích điểm của tôi' })
  @ApiOkResponse({ type: LoyaltyDto })
  @ApiNotFoundResponse({ description: 'Người dùng không tồn tại' })
  getMyLoyalty(@CurrentUser() user: AuthUser) {
    return this.loyalty.getMyLoyalty(user.phone);
  }
}
