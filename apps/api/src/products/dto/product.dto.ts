import { ApiProperty } from '@nestjs/swagger';

export class ProductDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Cà phê sữa' })
  name!: string;

  @ApiProperty({ example: 29000, description: 'VND, giá size S' })
  price!: number;

  @ApiProperty({ example: 'https://example.com/ca-phe-sua.jpg' })
  imageUrl!: string;
}
