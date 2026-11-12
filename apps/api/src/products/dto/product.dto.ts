import { ApiProperty } from '@nestjs/swagger';

export class CategoryDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Cà phê' })
  name!: string;
}

export class ProductDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Cà phê sữa' })
  name!: string;

  @ApiProperty({ example: 29000, description: 'VND, giá size S' })
  price!: number;

  @ApiProperty({ example: 'https://example.com/ca-phe-sua.jpg' })
  imageUrl!: string;

  @ApiProperty({ type: CategoryDto })
  category!: CategoryDto;

  @ApiProperty({ example: true })
  isAvailable!: boolean;
}
