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
import {
  AdminProductDto,
  CategoryDto,
  CreateCategoryDto,
  CreateProductDto,
  CreateToppingDto,
  SizeParamsDto,
  SizeSurchargeDto,
  ToppingDto,
  ToppingParamsDto,
  UpdateCategoryDto,
  UpdateProductDto,
  UpdateSizeDto,
  UpdateToppingDto,
} from './dto/menu.dto.js';
import { MenuService } from './menu.service.js';

@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Thiếu hoặc sai token' })
@ApiForbiddenResponse({ description: 'Không phải tài khoản MANAGER' })
@ApiBadRequestResponse({ description: 'Dữ liệu không hợp lệ, body rỗng hoặc có trường lạ' })
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MANAGER')
export class MenuAdminController {
  constructor(private readonly menu: MenuService) {}

  @ApiTags('admin-menu')
  @Get('categories')
  @ApiOperation({ summary: 'Mọi danh mục (kể cả đang ẩn)' })
  @ApiOkResponse({ type: CategoryDto, isArray: true })
  listCategories() {
    return this.menu.listCategories();
  }

  @ApiTags('admin-menu')
  @Post('categories')
  @ApiOperation({ summary: 'Thêm danh mục' })
  @ApiCreatedResponse({ type: CategoryDto })
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.menu.createCategory(dto);
  }

  @ApiTags('admin-menu')
  @Patch('categories/:id')
  @ApiOperation({ summary: 'Đổi tên, ẩn hoặc hiện danh mục' })
  @ApiOkResponse({ type: CategoryDto })
  @ApiNotFoundResponse({ description: 'Không tìm thấy danh mục' })
  updateCategory(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCategoryDto) {
    return this.menu.updateCategory(id, dto);
  }

  @ApiTags('admin-menu')
  @Get('products')
  @ApiOperation({ summary: 'Mọi món (kể cả thuộc danh mục đang ẩn)' })
  @ApiOkResponse({ type: AdminProductDto, isArray: true })
  listProducts() {
    return this.menu.listProducts();
  }

  @ApiTags('admin-menu')
  @Post('products')
  @ApiOperation({ summary: 'Thêm món' })
  @ApiCreatedResponse({ type: AdminProductDto })
  createProduct(@Body() dto: CreateProductDto) {
    return this.menu.createProduct(dto);
  }

  @ApiTags('admin-menu')
  @Patch('products/:id')
  @ApiOperation({ summary: 'Sửa món (tên, mô tả, ảnh, giá, danh mục, còn hàng)' })
  @ApiOkResponse({ type: AdminProductDto })
  @ApiNotFoundResponse({ description: 'Không tìm thấy món' })
  updateProduct(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.menu.updateProduct(id, dto);
  }

  @ApiTags('admin-pricing')
  @Get('toppings')
  @ApiOperation({ summary: 'Mọi topping (kể cả ngừng bán)' })
  @ApiOkResponse({ type: ToppingDto, isArray: true })
  listToppings() {
    return this.menu.listToppings();
  }

  @ApiTags('admin-pricing')
  @Post('toppings')
  @ApiOperation({ summary: 'Thêm topping' })
  @ApiCreatedResponse({ type: ToppingDto })
  @ApiConflictResponse({ description: 'Mã topping đã tồn tại' })
  createTopping(@Body() dto: CreateToppingDto) {
    return this.menu.createTopping(dto);
  }

  @ApiTags('admin-pricing')
  @Patch('toppings/:code')
  @ApiOperation({ summary: 'Sửa tên, giá, bật hoặc tắt bán topping' })
  @ApiOkResponse({ type: ToppingDto })
  @ApiNotFoundResponse({ description: 'Không tìm thấy topping' })
  updateTopping(@Param() { code }: ToppingParamsDto, @Body() dto: UpdateToppingDto) {
    return this.menu.updateTopping(code, dto);
  }

  @ApiTags('admin-pricing')
  @Get('sizes')
  @ApiOperation({ summary: 'Phụ thu của ba size S, M, L' })
  @ApiOkResponse({ type: SizeSurchargeDto, isArray: true })
  listSizes() {
    return this.menu.listSizes();
  }

  @ApiTags('admin-pricing')
  @Patch('sizes/:size')
  @ApiOperation({ summary: 'Đổi phụ thu một size' })
  @ApiOkResponse({ type: SizeSurchargeDto })
  @ApiNotFoundResponse({ description: 'Chưa cấu hình phụ thu cho size này' })
  updateSize(@Param() { size }: SizeParamsDto, @Body() dto: UpdateSizeDto) {
    return this.menu.updateSize(size, dto);
  }
}
