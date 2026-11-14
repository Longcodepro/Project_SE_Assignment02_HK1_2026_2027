import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { Size } from '../../generated/prisma/enums.js';

const MAX_MONEY = 10_000_000;
const IMAGE_URL = /^(\/|https?:\/\/)\S+$/;
const TOPPING_CODE = /^[a-z0-9-]{2,32}$/;

// Trường không bắt buộc nhưng đã gửi thì không được null (khác @IsOptional cho phép null)
const WhenSent = () => ValidateIf((_o, v) => v !== undefined);
const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

// ---- Danh mục ----
export class CreateCategoryDto {
  @ApiProperty({ example: 'Trà sữa', minLength: 1, maxLength: 50 })
  @Transform(trim)
  @IsString()
  @Length(1, 50)
  name!: string;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Trà sữa', minLength: 1, maxLength: 50 })
  @WhenSent()
  @Transform(trim)
  @IsString()
  @Length(1, 50)
  name?: string;

  @ApiPropertyOptional({ example: false, description: 'false là ẩn danh mục cùng các món của nó khỏi menu' })
  @WhenSent()
  @IsBoolean()
  isActive?: boolean;
}

export class CategoryDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Cà phê' })
  name!: string;

  @ApiProperty({ example: true })
  isActive!: boolean;
}

// ---- Món ----
export class CreateProductDto {
  @ApiProperty({ example: 'Cà phê sữa', minLength: 1, maxLength: 100 })
  @Transform(trim)
  @IsString()
  @Length(1, 100)
  name!: string;

  @ApiPropertyOptional({ example: 'Cà phê phin pha sữa đặc', maxLength: 500, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @ApiProperty({ example: '/images/ca-phe-sua.svg', description: 'Bắt đầu bằng /, http:// hoặc https://' })
  @IsString()
  @MaxLength(500)
  @Matches(IMAGE_URL, { message: 'imageUrl must start with /, http:// or https://' })
  imageUrl!: string;

  @ApiProperty({ example: 29000, minimum: 1, description: 'VND, giá size S' })
  @IsInt()
  @Min(1)
  @Max(MAX_MONEY)
  price!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  categoryId!: number;

  @ApiPropertyOptional({ example: true, default: true })
  @WhenSent()
  @IsBoolean()
  isAvailable?: boolean;
}

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'Cà phê sữa', minLength: 1, maxLength: 100 })
  @WhenSent()
  @Transform(trim)
  @IsString()
  @Length(1, 100)
  name?: string;

  @ApiPropertyOptional({ example: 'Cà phê phin pha sữa đặc', maxLength: 500, nullable: true, description: 'null để xóa mô tả' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @ApiPropertyOptional({ example: '/images/ca-phe-sua.svg' })
  @WhenSent()
  @IsString()
  @MaxLength(500)
  @Matches(IMAGE_URL, { message: 'imageUrl must start with /, http:// or https://' })
  imageUrl?: string;

  @ApiPropertyOptional({ example: 32000, minimum: 1 })
  @WhenSent()
  @IsInt()
  @Min(1)
  @Max(MAX_MONEY)
  price?: number;

  @ApiPropertyOptional({ example: 1 })
  @WhenSent()
  @IsInt()
  @Min(1)
  categoryId?: number;

  @ApiPropertyOptional({ example: false })
  @WhenSent()
  @IsBoolean()
  isAvailable?: boolean;
}

class AdminProductCategoryDto extends CategoryDto {}

export class AdminProductDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Cà phê sữa' })
  name!: string;

  @ApiProperty({ type: String, nullable: true, example: 'Cà phê phin pha sữa đặc' })
  description!: string | null;

  @ApiProperty({ example: '/images/ca-phe-sua.svg' })
  imageUrl!: string;

  @ApiProperty({ example: 29000, description: 'VND, giá size S' })
  price!: number;

  @ApiProperty({ example: true })
  isAvailable!: boolean;

  @ApiProperty({ type: AdminProductCategoryDto })
  category!: AdminProductCategoryDto;
}

// ---- Topping ----
export class ToppingParamsDto {
  @ApiProperty({ example: 'tran-chau' })
  @Matches(TOPPING_CODE, { message: 'code must be 2-32 characters: lowercase letters, digits or -' })
  code!: string;
}

export class CreateToppingDto {
  @ApiProperty({ example: 'pudding', description: '2-32 ký tự: chữ thường, số, -; không đổi được sau khi tạo' })
  @Matches(TOPPING_CODE, { message: 'code must be 2-32 characters: lowercase letters, digits or -' })
  code!: string;

  @ApiProperty({ example: 'Pudding', minLength: 1, maxLength: 50 })
  @Transform(trim)
  @IsString()
  @Length(1, 50)
  name!: string;

  @ApiProperty({ example: 7000, minimum: 0, description: 'VND' })
  @IsInt()
  @Min(0)
  @Max(MAX_MONEY)
  price!: number;
}

export class UpdateToppingDto {
  @ApiPropertyOptional({ example: 'Pudding trứng', minLength: 1, maxLength: 50 })
  @WhenSent()
  @Transform(trim)
  @IsString()
  @Length(1, 50)
  name?: string;

  @ApiPropertyOptional({ example: 8000, minimum: 0 })
  @WhenSent()
  @IsInt()
  @Min(0)
  @Max(MAX_MONEY)
  price?: number;

  @ApiPropertyOptional({ example: false, description: 'false là ngừng bán' })
  @WhenSent()
  @IsBoolean()
  isActive?: boolean;
}

export class ToppingDto {
  @ApiProperty({ example: 'tran-chau' })
  code!: string;

  @ApiProperty({ example: 'Trân châu đen' })
  name!: string;

  @ApiProperty({ example: 8000, description: 'VND' })
  price!: number;

  @ApiProperty({ example: true })
  isActive!: boolean;
}

// ---- Phụ thu size ----
export class SizeParamsDto {
  @ApiProperty({ enum: Size, example: 'M' })
  @IsIn(Object.values(Size))
  size!: Size;
}

export class UpdateSizeDto {
  @ApiProperty({ example: 6000, minimum: 0, description: 'VND, cộng vào giá món (size S)' })
  @IsInt()
  @Min(0)
  @Max(MAX_MONEY)
  extra!: number;
}

export class SizeSurchargeDto {
  @ApiProperty({ enum: Size, example: 'M' })
  size!: string;

  @ApiProperty({ example: 5000 })
  extra!: number;
}

// ---- Lựa chọn khi gọi món (công khai) ----
export class MenuOptionToppingDto {
  @ApiProperty({ example: 'tran-chau' })
  code!: string;

  @ApiProperty({ example: 'Trân châu đen' })
  name!: string;

  @ApiProperty({ example: 8000 })
  price!: number;
}

export class MenuOptionsDto {
  @ApiProperty({ type: SizeSurchargeDto, isArray: true, description: 'Theo thứ tự S, M, L' })
  sizes!: SizeSurchargeDto[];

  @ApiProperty({ type: MenuOptionToppingDto, isArray: true, description: 'Chỉ topping đang bán, sắp theo code' })
  toppings!: MenuOptionToppingDto[];
}
