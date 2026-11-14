import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser, JwtAuthGuard, type AuthUser } from '../auth/jwt-auth.guard.js';
import { CreateReviewDto, ReviewDto } from './dto/review.dto.js';
import { ReviewsService } from './reviews.service.js';

@ApiTags('reviews')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Thiếu hoặc sai token' })
@Controller('orders')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Post(':id/review')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Đánh giá 1-5 sao cho đơn COMPLETED của mình, mỗi đơn một lần' })
  @ApiCreatedResponse({ type: ReviewDto })
  @ApiBadRequestResponse({ description: 'stars ngoài 1-5 hoặc comment không hợp lệ' })
  @ApiNotFoundResponse({ description: 'Không có đơn này hoặc không phải đơn của bạn' })
  @ApiConflictResponse({ description: 'Đơn chưa COMPLETED hoặc đã được đánh giá' })
  create(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: CreateReviewDto) {
    return this.reviews.create(user.phone, id, dto);
  }
}
