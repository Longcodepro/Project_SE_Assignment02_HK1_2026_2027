import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
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
}
