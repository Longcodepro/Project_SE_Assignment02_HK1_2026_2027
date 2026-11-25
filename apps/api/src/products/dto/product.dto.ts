/**
 * DTO (Data Transfer Object) cho Module Products.
 *
 * Nhiệm vụ:
 * 1. Định nghĩa cấu trúc dữ liệu trả về cho Client (khuôn mẫu object JSON).
 * 2. Cung cấp metadata cho thư viện Swagger (@nestjs/swagger) để tự động sinh tài liệu API tại /docs.
 */

import { ApiProperty } from '@nestjs/swagger';

/**
 * Khuôn mẫu danh mục thu nhỏ đi kèm theo sản phẩm
 */
export class CategoryDto {
  @ApiProperty({ example: 1, description: 'ID danh mục' })
  id!: number;

  @ApiProperty({ example: 'Cà phê', description: 'Tên danh mục hiển thị' })
  name!: string;
}

/**
 * Khuôn mẫu sản phẩm hiển thị trên Menu
 */
export class ProductDto {
  @ApiProperty({ example: 1, description: 'ID sản phẩm (Primary Key)' })
  id!: number;

  @ApiProperty({ example: 'Cà phê sữa', description: 'Tên món' })
  name!: string;

  // nullable: true để Swagger biết trường này có thể là null
  @ApiProperty({ type: String, nullable: true, example: 'Cà phê phin pha sữa đặc', description: 'Mô tả chi tiết món' })
  description!: string | null;

  @ApiProperty({ example: 29000, description: 'VND, giá gốc cho size S' })
  price!: number;

  @ApiProperty({ example: 'https://example.com/ca-phe-sua.jpg', description: 'Đường dẫn ảnh sản phẩm' })
  imageUrl!: string;

  // Lồng CategoryDto vào trong ProductDto
  @ApiProperty({ type: CategoryDto, description: 'Thông tin danh mục chứa món này' })
  category!: CategoryDto;

  @ApiProperty({ example: true, description: 'Trạng thái còn món hay hết món' })
  isAvailable!: boolean;
}
