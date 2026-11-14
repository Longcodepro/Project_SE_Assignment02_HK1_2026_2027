import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUniqueViolation } from '../common/idempotency.js';
import { isRecordNotFound } from '../common/prisma-errors.js';
import type { Size } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  CreateCategoryDto,
  CreateProductDto,
  CreateToppingDto,
  UpdateCategoryDto,
  UpdateProductDto,
  UpdateSizeDto,
  UpdateToppingDto,
} from './dto/menu.dto.js';

const CATEGORY = { id: true, name: true, isActive: true } as const;
const PRODUCT = {
  id: true,
  name: true,
  description: true,
  imageUrl: true,
  price: true,
  isAvailable: true,
  category: { select: CATEGORY },
} as const;
const TOPPING = { code: true, name: true, price: true, isActive: true } as const;

const SIZE_ORDER: readonly string[] = ['S', 'M', 'L'];
const bySizeOrder = <T extends { size: string }>(rows: T[]) =>
  [...rows].sort((a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size));

function assertNotEmpty(dto: object) {
  if (Object.values(dto).every((v) => v === undefined)) {
    throw new BadRequestException('Cần gửi ít nhất một trường để sửa');
  }
}

// Chạy một lệnh sửa; không có dòng nào khớp thì 404
async function updateOrNotFound<T>(run: () => Promise<T>, message: string) {
  try {
    return await run();
  } catch (e) {
    if (isRecordNotFound(e)) throw new NotFoundException(message);
    throw e;
  }
}

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Lựa chọn công khai ----
  async options() {
    const [sizes, toppings] = await Promise.all([
      this.prisma.sizeSurcharge.findMany({ select: { size: true, extra: true } }),
      this.prisma.topping.findMany({
        where: { isActive: true },
        orderBy: { code: 'asc' },
        select: { code: true, name: true, price: true },
      }),
    ]);
    return { sizes: bySizeOrder(sizes), toppings };
  }

  // ---- Danh mục ----
  listCategories() {
    return this.prisma.category.findMany({ orderBy: { id: 'asc' }, select: CATEGORY });
  }

  createCategory(dto: CreateCategoryDto) {
    return this.prisma.category.create({ data: { name: dto.name }, select: CATEGORY });
  }

  updateCategory(id: number, dto: UpdateCategoryDto) {
    assertNotEmpty(dto);
    return updateOrNotFound(
      () =>
        this.prisma.category.update({
          where: { id },
          data: { name: dto.name, isActive: dto.isActive },
          select: CATEGORY,
        }),
      'Không tìm thấy danh mục',
    );
  }

  // ---- Món ----
  listProducts() {
    return this.prisma.product.findMany({ orderBy: { id: 'asc' }, select: PRODUCT });
  }

  private async assertCategoryExists(id: number) {
    const category = await this.prisma.category.findUnique({ where: { id }, select: { id: true } });
    if (!category) throw new BadRequestException('Danh mục không tồn tại');
  }

  async createProduct(dto: CreateProductDto) {
    await this.assertCategoryExists(dto.categoryId);
    return this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description ?? null,
        imageUrl: dto.imageUrl,
        price: dto.price,
        categoryId: dto.categoryId,
        isAvailable: dto.isAvailable,
      },
      select: PRODUCT,
    });
  }

  async updateProduct(id: number, dto: UpdateProductDto) {
    assertNotEmpty(dto);
    if (dto.categoryId !== undefined) await this.assertCategoryExists(dto.categoryId);
    return updateOrNotFound(
      () =>
        this.prisma.product.update({
          where: { id },
          data: {
            name: dto.name,
            description: dto.description,
            imageUrl: dto.imageUrl,
            price: dto.price,
            categoryId: dto.categoryId,
            isAvailable: dto.isAvailable,
          },
          select: PRODUCT,
        }),
      'Không tìm thấy món',
    );
  }

  // ---- Topping ----
  listToppings() {
    return this.prisma.topping.findMany({ orderBy: { code: 'asc' }, select: TOPPING });
  }

  async createTopping(dto: CreateToppingDto) {
    try {
      return await this.prisma.topping.create({
        data: { code: dto.code, name: dto.name, price: dto.price },
        select: TOPPING,
      });
    } catch (e) {
      if (isUniqueViolation(e)) throw new ConflictException('Topping đã tồn tại');
      throw e;
    }
  }

  updateTopping(code: string, dto: UpdateToppingDto) {
    assertNotEmpty(dto);
    return updateOrNotFound(
      () =>
        this.prisma.topping.update({
          where: { code },
          data: { name: dto.name, price: dto.price, isActive: dto.isActive },
          select: TOPPING,
        }),
      'Không tìm thấy topping',
    );
  }

  // ---- Phụ thu size ----
  async listSizes() {
    return bySizeOrder(await this.prisma.sizeSurcharge.findMany({ select: { size: true, extra: true } }));
  }

  updateSize(size: Size, dto: UpdateSizeDto) {
    return updateOrNotFound(
      () =>
        this.prisma.sizeSurcharge.update({
          where: { size },
          data: { extra: dto.extra },
          select: { size: true, extra: true },
        }),
      'Chưa cấu hình phụ thu cho size này',
    );
  }
}
