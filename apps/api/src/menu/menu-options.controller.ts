import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MenuOptionsDto } from './dto/menu.dto.js';
import { MenuService } from './menu.service.js';

@ApiTags('products')
@Controller('menu-options')
export class MenuOptionsController {
  constructor(private readonly menu: MenuService) {}

  @Get()
  @ApiOperation({ summary: 'Phụ thu size và topping đang bán, để client không ghi cứng giá' })
  @ApiOkResponse({ type: MenuOptionsDto })
  options() {
    return this.menu.options();
  }
}
