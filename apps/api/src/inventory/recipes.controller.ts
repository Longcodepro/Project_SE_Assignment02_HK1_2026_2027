import { Body, Controller, Get, Param, ParseIntPipe, Put, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles, RolesGuard } from '../auth/roles.guard.js';
import { ToppingParamsDto } from '../menu/dto/menu.dto.js';
import {
  ProductRecipeDto,
  ReplaceRecipeDto,
  ReplaceToppingRecipeDto,
  ToppingRecipeDto,
} from './dto/inventory.dto.js';
import { InventoryService } from './inventory.service.js';

@ApiTags('admin-inventory')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Thiếu hoặc sai token' })
@ApiForbiddenResponse({ description: 'Không phải tài khoản MANAGER' })
@ApiBadRequestResponse({ description: 'Dữ liệu không hợp lệ, trùng dòng hoặc nguyên liệu không tồn tại' })
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MANAGER')
export class RecipesController {
  constructor(private readonly inventory: InventoryService) {}

  @Get('products/:id/recipe')
  @ApiOperation({ summary: 'Công thức một ly của món theo size' })
  @ApiOkResponse({ type: ProductRecipeDto })
  @ApiNotFoundResponse({ description: 'Không tìm thấy món' })
  getProductRecipe(@Param('id', ParseIntPipe) id: number) {
    return this.inventory.getProductRecipe(id);
  }

  @Put('products/:id/recipe')
  @ApiOperation({ summary: 'Thay toàn bộ công thức của món ([] để xóa)' })
  @ApiOkResponse({ type: ProductRecipeDto })
  @ApiNotFoundResponse({ description: 'Không tìm thấy món' })
  replaceProductRecipe(@Param('id', ParseIntPipe) id: number, @Body() dto: ReplaceRecipeDto) {
    return this.inventory.replaceProductRecipe(id, dto);
  }

  @Get('toppings/:code/recipe')
  @ApiOperation({ summary: 'Công thức một phần topping' })
  @ApiOkResponse({ type: ToppingRecipeDto })
  @ApiNotFoundResponse({ description: 'Không tìm thấy topping' })
  getToppingRecipe(@Param() { code }: ToppingParamsDto) {
    return this.inventory.getToppingRecipe(code);
  }

  @Put('toppings/:code/recipe')
  @ApiOperation({ summary: 'Thay toàn bộ công thức của topping ([] để xóa)' })
  @ApiOkResponse({ type: ToppingRecipeDto })
  @ApiNotFoundResponse({ description: 'Không tìm thấy topping' })
  replaceToppingRecipe(@Param() { code }: ToppingParamsDto, @Body() dto: ReplaceToppingRecipeDto) {
    return this.inventory.replaceToppingRecipe(code, dto);
  }
}
