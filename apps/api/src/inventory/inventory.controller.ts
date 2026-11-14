import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
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
import { CurrentUser, JwtAuthGuard, type AuthUser } from '../auth/jwt-auth.guard.js';
import { Roles, RolesGuard } from '../auth/roles.guard.js';
import {
  CreateIngredientDto,
  CreateReceiptDto,
  IngredientDto,
  ReceiptDto,
  ReceiptResultDto,
  ReceiptsQueryDto,
  UpdateIngredientDto,
} from './dto/inventory.dto.js';
import { InventoryService } from './inventory.service.js';

@ApiTags('admin-inventory')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Thiếu hoặc sai token' })
@ApiForbiddenResponse({ description: 'Vai trò không đủ quyền' })
@ApiBadRequestResponse({ description: 'Dữ liệu không hợp lệ, body rỗng hoặc có trường lạ' })
@Controller('admin/ingredients')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MANAGER')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  // Đọc kho và nhập kho cho cả Barista; tạo, sửa nguyên liệu chỉ Manager (quyền mặc định của lớp)
  @Get()
  @Roles('BARISTA', 'MANAGER')
  @ApiOperation({ summary: 'Mọi nguyên liệu kèm tồn kho (BARISTA, MANAGER)' })
  @ApiOkResponse({ type: IngredientDto, isArray: true })
  list() {
    return this.inventory.listIngredients();
  }

  @Post()
  @ApiOperation({ summary: 'Thêm nguyên liệu (MANAGER); tồn ban đầu bằng 0, nhập kho qua phiếu' })
  @ApiCreatedResponse({ type: IngredientDto })
  @ApiConflictResponse({ description: 'Tên nguyên liệu đã tồn tại' })
  create(@Body() dto: CreateIngredientDto) {
    return this.inventory.createIngredient(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Đổi tên hoặc ngưỡng cảnh báo (MANAGER); không sửa trực tiếp tồn kho' })
  @ApiOkResponse({ type: IngredientDto })
  @ApiNotFoundResponse({ description: 'Không tìm thấy nguyên liệu' })
  @ApiConflictResponse({ description: 'Tên nguyên liệu đã tồn tại' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateIngredientDto) {
    return this.inventory.updateIngredient(id, dto);
  }

  @Post(':id/receipts')
  @Roles('BARISTA', 'MANAGER')
  @ApiOperation({ summary: 'Nhập kho: ghi phiếu có người thực hiện và cộng tồn (BARISTA, MANAGER)' })
  @ApiCreatedResponse({ type: ReceiptResultDto })
  @ApiNotFoundResponse({ description: 'Không tìm thấy nguyên liệu' })
  receive(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateReceiptDto,
  ) {
    return this.inventory.receive(id, user.phone, dto);
  }

  @Get(':id/receipts')
  @Roles('BARISTA', 'MANAGER')
  @ApiOperation({ summary: 'Lịch sử nhập kho của một nguyên liệu, mới nhất trước (BARISTA, MANAGER)' })
  @ApiOkResponse({ type: ReceiptDto, isArray: true })
  @ApiNotFoundResponse({ description: 'Không tìm thấy nguyên liệu' })
  receipts(@Param('id', ParseIntPipe) id: number, @Query() { limit }: ReceiptsQueryDto) {
    return this.inventory.listReceipts(id, limit);
  }
}
