import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ProductDto } from './dto/product.dto.js';
import { ProductsService } from './products.service.js';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách sản phẩm trên menu, sắp theo id tăng dần' })
  @ApiOkResponse({ type: ProductDto, isArray: true })
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết một sản phẩm theo id' })
  @ApiOkResponse({ type: ProductDto })
  @ApiNotFoundResponse({ description: 'Không tìm thấy sản phẩm' })
  @ApiBadRequestResponse({ description: 'id không phải số' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }
}
