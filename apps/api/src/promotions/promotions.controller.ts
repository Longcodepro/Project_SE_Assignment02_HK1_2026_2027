import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles, RolesGuard } from '../auth/roles.guard.js';
import { CreatePromotionDto, PromotionDto, UpdatePromotionDto } from './dto/promotion.dto.js';
import { PromotionsService } from './promotions.service.js';

@ApiTags('admin-promotions')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Thiếu hoặc sai token' })
@ApiForbiddenResponse({ description: 'Không phải tài khoản MANAGER' })
@Controller('admin/promotions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MANAGER')
export class PromotionsController {
  constructor(private readonly promotions: PromotionsService) {}

  @Get()
  @ApiOperation({ summary: 'Mọi mã giảm giá (kể cả đã vô hiệu), mới tạo nhất lên đầu' })
  @ApiOkResponse({ type: PromotionDto, isArray: true })
  list() {
    return this.promotions.list();
  }

  @Post()
  @ApiOperation({ summary: 'Tạo mã giảm giá (FIXED hoặc PERCENT)' })
  @ApiCreatedResponse({ type: PromotionDto })
  @ApiBadRequestResponse({ description: 'Dữ liệu không hợp lệ' })
  @ApiConflictResponse({ description: 'Mã đã tồn tại' })
  create(@Body() dto: CreatePromotionDto) {
    return this.promotions.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Sửa, vô hiệu hoặc kích hoạt lại mã giảm giá' })
  @ApiOkResponse({ type: PromotionDto })
  @ApiBadRequestResponse({ description: 'Body rỗng, sai kiểu hoặc vi phạm ràng buộc' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy mã giảm giá' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePromotionDto) {
    return this.promotions.update(id, dto);
  }
}
