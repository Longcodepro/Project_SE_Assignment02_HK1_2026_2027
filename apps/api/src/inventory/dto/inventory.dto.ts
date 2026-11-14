import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Size, Unit } from '../../generated/prisma/enums.js';

// Một phiếu nhập tối đa 100 triệu đơn vị để tồn kho không tràn số nguyên 32 bit
const MAX_RECEIPT = 100_000_000;
const MAX_RECIPE_QUANTITY = 1_000_000;
const MAX_RECIPE_ITEMS = 200;

const WhenSent = () => ValidateIf((_o, v) => v !== undefined);
const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

// ---- Nguyên liệu ----
export class CreateIngredientDto {
  @ApiProperty({ example: 'Sữa đặc', minLength: 1, maxLength: 100 })
  @Transform(trim)
  @IsString()
  @Length(1, 100)
  name!: string;

  @ApiProperty({
    enum: Unit,
    example: 'ML',
    description: 'Không đổi được sau khi tạo',
  })
  @IsIn(Object.values(Unit))
  unit!: Unit;

  @ApiPropertyOptional({
    example: 500,
    minimum: 0,
    default: 0,
    description: 'Chạm ngưỡng này thì cảnh báo sắp hết',
  })
  @WhenSent()
  @IsInt()
  @Min(0)
  @Max(MAX_RECEIPT)
  minStock?: number;
}

export class UpdateIngredientDto {
  @ApiPropertyOptional({
    example: 'Sữa đặc có đường',
    minLength: 1,
    maxLength: 100,
  })
  @WhenSent()
  @Transform(trim)
  @IsString()
  @Length(1, 100)
  name?: string;

  @ApiPropertyOptional({ example: 800, minimum: 0 })
  @WhenSent()
  @IsInt()
  @Min(0)
  @Max(MAX_RECEIPT)
  minStock?: number;
}

export class IngredientDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Cà phê rang xay' })
  name!: string;

  @ApiProperty({ enum: Unit, example: Unit.G })
  unit!: string;

  @ApiProperty({ example: 5000, description: 'Số lượng tồn theo unit' })
  stock!: number;

  @ApiProperty({ example: 1000 })
  minStock!: number;

  @ApiProperty({
    example: false,
    description: 'true khi stock <= minStock (sắp hết)',
  })
  isLow!: boolean;
}

// ---- Phiếu nhập kho ----
export class CreateReceiptDto {
  @ApiProperty({ example: 2000, minimum: 1, maximum: MAX_RECEIPT })
  @IsInt()
  @Min(1)
  @Max(MAX_RECEIPT)
  quantity!: number;

  @ApiPropertyOptional({ example: 'Nhập hàng NCC A', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;
}

export class ReceiptsQueryDto {
  @ApiPropertyOptional({ example: 50, minimum: 1, maximum: 200, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}

export class ReceiptDto {
  @ApiProperty({ example: 7 })
  id!: number;

  @ApiProperty({ example: 1 })
  ingredientId!: number;

  @ApiProperty({ example: 2000 })
  quantity!: number;

  @ApiProperty({ type: String, nullable: true, example: 'Nhập hàng NCC A' })
  note!: string | null;

  @ApiProperty({ example: '0900000001', description: 'Người thực hiện' })
  createdByPhone!: string;

  @ApiProperty({ example: '2026-11-15T03:00:00.000Z' })
  createdAt!: Date;
}

export class ReceiptResultDto extends ReceiptDto {
  @ApiProperty({ example: 7000, description: 'Tồn kho sau khi nhập' })
  stock!: number;
}

// ---- Công thức ----
export class RecipeItemInputDto {
  @ApiProperty({ enum: Size, example: 'M' })
  @IsIn(Object.values(Size))
  size!: Size;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  ingredientId!: number;

  @ApiProperty({
    example: 18,
    minimum: 1,
    description: 'Theo đơn vị của nguyên liệu, cho một ly',
  })
  @IsInt()
  @Min(1)
  @Max(MAX_RECIPE_QUANTITY)
  quantity!: number;
}

export class ReplaceRecipeDto {
  @ApiProperty({
    type: RecipeItemInputDto,
    isArray: true,
    description: 'Thay toàn bộ; [] để xóa công thức',
  })
  @IsArray()
  @ArrayMaxSize(MAX_RECIPE_ITEMS)
  @ValidateNested({ each: true })
  @Type(() => RecipeItemInputDto)
  items!: RecipeItemInputDto[];
}

export class ToppingRecipeItemInputDto {
  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  ingredientId!: number;

  @ApiProperty({
    example: 30,
    minimum: 1,
    description: 'Theo đơn vị của nguyên liệu, cho một phần topping',
  })
  @IsInt()
  @Min(1)
  @Max(MAX_RECIPE_QUANTITY)
  quantity!: number;
}

export class ReplaceToppingRecipeDto {
  @ApiProperty({
    type: ToppingRecipeItemInputDto,
    isArray: true,
    description: 'Thay toàn bộ; [] để xóa công thức',
  })
  @IsArray()
  @ArrayMaxSize(MAX_RECIPE_ITEMS)
  @ValidateNested({ each: true })
  @Type(() => ToppingRecipeItemInputDto)
  items!: ToppingRecipeItemInputDto[];
}

export class RecipeItemDto {
  @ApiProperty({ enum: Size, example: 'M' })
  size!: string;

  @ApiProperty({ example: 1 })
  ingredientId!: number;

  @ApiProperty({ example: 'Cà phê rang xay' })
  ingredientName!: string;

  @ApiProperty({ enum: Unit, example: Unit.G })
  unit!: string;

  @ApiProperty({ example: 18 })
  quantity!: number;
}

export class ProductRecipeDto {
  @ApiProperty({ example: 1 })
  productId!: number;

  @ApiProperty({ type: RecipeItemDto, isArray: true })
  items!: RecipeItemDto[];
}

export class ToppingRecipeItemDto {
  @ApiProperty({ example: 3 })
  ingredientId!: number;

  @ApiProperty({ example: 'Trân châu' })
  ingredientName!: string;

  @ApiProperty({ enum: Unit, example: Unit.G })
  unit!: string;

  @ApiProperty({ example: 30 })
  quantity!: number;
}

export class ToppingRecipeDto {
  @ApiProperty({ example: 'tran-chau' })
  toppingCode!: string;

  @ApiProperty({ type: ToppingRecipeItemDto, isArray: true })
  items!: ToppingRecipeItemDto[];
}
