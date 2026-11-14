import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUniqueViolation } from '../common/idempotency.js';
import { isRecordNotFound } from '../common/prisma-errors.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  CreateIngredientDto,
  CreateReceiptDto,
  ReplaceRecipeDto,
  ReplaceToppingRecipeDto,
  UpdateIngredientDto,
} from './dto/inventory.dto.js';

const INGREDIENT = { id: true, name: true, unit: true, stock: true, minStock: true } as const;
const RECEIPT = {
  id: true,
  ingredientId: true,
  quantity: true,
  note: true,
  createdByPhone: true,
  createdAt: true,
} as const;
const SIZE_ORDER: readonly string[] = ['S', 'M', 'L'];
const DUPLICATE_NAME = 'Nguyên liệu đã tồn tại';

function assertNotEmpty(dto: object) {
  if (Object.values(dto).every((v) => v === undefined)) {
    throw new BadRequestException('Cần gửi ít nhất một trường để sửa');
  }
}

function assertNoDuplicates(keys: string[], message: string) {
  if (new Set(keys).size !== keys.length) throw new BadRequestException(message);
}

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Nguyên liệu ----
  listIngredients() {
    return this.prisma.ingredient.findMany({ orderBy: { id: 'asc' }, select: INGREDIENT });
  }

  async createIngredient(dto: CreateIngredientDto) {
    try {
      return await this.prisma.ingredient.create({
        data: { name: dto.name, unit: dto.unit, minStock: dto.minStock },
        select: INGREDIENT,
      });
    } catch (e) {
      if (isUniqueViolation(e)) throw new ConflictException(DUPLICATE_NAME);
      throw e;
    }
  }

  async updateIngredient(id: number, dto: UpdateIngredientDto) {
    assertNotEmpty(dto);
    try {
      return await this.prisma.ingredient.update({
        where: { id },
        data: { name: dto.name, minStock: dto.minStock },
        select: INGREDIENT,
      });
    } catch (e) {
      if (isRecordNotFound(e)) throw new NotFoundException('Không tìm thấy nguyên liệu');
      if (isUniqueViolation(e)) throw new ConflictException(DUPLICATE_NAME);
      throw e;
    }
  }

  // ---- Phiếu nhập kho ----
  // Cộng tồn và ghi phiếu trong một transaction nên tồn luôn bằng tổng các phiếu (cộng trừ theo đơn)
  receive(ingredientId: number, createdByPhone: string, dto: CreateReceiptDto) {
    return this.prisma.$transaction(async (tx) => {
      let ingredient: { stock: number };
      try {
        ingredient = await tx.ingredient.update({
          where: { id: ingredientId },
          data: { stock: { increment: dto.quantity } },
          select: { stock: true },
        });
      } catch (e) {
        if (isRecordNotFound(e)) throw new NotFoundException('Không tìm thấy nguyên liệu');
        throw e;
      }
      const receipt = await tx.stockReceipt.create({
        data: {
          ingredientId,
          quantity: dto.quantity,
          note: dto.note?.trim() || null,
          createdByPhone,
        },
        select: RECEIPT,
      });
      return { ...receipt, stock: ingredient.stock };
    });
  }

  async listReceipts(ingredientId: number, limit = 50) {
    const exists = await this.prisma.ingredient.findUnique({
      where: { id: ingredientId },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Không tìm thấy nguyên liệu');
    return this.prisma.stockReceipt.findMany({
      where: { ingredientId },
      orderBy: { id: 'desc' },
      take: limit,
      select: RECEIPT,
    });
  }

  // ---- Công thức ----
  private async assertIngredientsExist(ids: number[]) {
    const unique = [...new Set(ids)];
    if (!unique.length) return;
    const found = await this.prisma.ingredient.findMany({
      where: { id: { in: unique } },
      select: { id: true },
    });
    const have = new Set(found.map((f) => f.id));
    const missing = unique.filter((id) => !have.has(id));
    if (missing.length) {
      throw new BadRequestException(`Nguyên liệu không tồn tại: ${missing.join(', ')}`);
    }
  }

  async getProductRecipe(productId: number) {
    const product = await this.prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) throw new NotFoundException('Không tìm thấy món');
    const rows = await this.prisma.recipeItem.findMany({
      where: { productId },
      select: {
        size: true,
        ingredientId: true,
        quantity: true,
        ingredient: { select: { name: true, unit: true } },
      },
    });
    const items = rows
      .map(({ ingredient, ...r }) => ({ ...r, ingredientName: ingredient.name, unit: ingredient.unit }))
      .sort(
        (a, b) =>
          SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size) || a.ingredientId - b.ingredientId,
      );
    return { productId, items };
  }

  async replaceProductRecipe(productId: number, dto: ReplaceRecipeDto) {
    const product = await this.prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) throw new NotFoundException('Không tìm thấy món');
    assertNoDuplicates(
      dto.items.map((i) => `${i.size}:${i.ingredientId}`),
      'Mỗi cặp size và nguyên liệu chỉ được khai báo một lần',
    );
    await this.assertIngredientsExist(dto.items.map((i) => i.ingredientId));

    await this.prisma.$transaction(async (tx) => {
      await tx.recipeItem.deleteMany({ where: { productId } });
      if (dto.items.length) {
        await tx.recipeItem.createMany({
          data: dto.items.map((i) => ({ productId, size: i.size, ingredientId: i.ingredientId, quantity: i.quantity })),
        });
      }
    });
    return this.getProductRecipe(productId);
  }

  async getToppingRecipe(toppingCode: string) {
    const topping = await this.prisma.topping.findUnique({ where: { code: toppingCode }, select: { code: true } });
    if (!topping) throw new NotFoundException('Không tìm thấy topping');
    const rows = await this.prisma.toppingRecipeItem.findMany({
      where: { toppingCode },
      orderBy: { ingredientId: 'asc' },
      select: { ingredientId: true, quantity: true, ingredient: { select: { name: true, unit: true } } },
    });
    return {
      toppingCode,
      items: rows.map(({ ingredient, ...r }) => ({ ...r, ingredientName: ingredient.name, unit: ingredient.unit })),
    };
  }

  async replaceToppingRecipe(toppingCode: string, dto: ReplaceToppingRecipeDto) {
    const topping = await this.prisma.topping.findUnique({ where: { code: toppingCode }, select: { code: true } });
    if (!topping) throw new NotFoundException('Không tìm thấy topping');
    assertNoDuplicates(
      dto.items.map((i) => String(i.ingredientId)),
      'Mỗi nguyên liệu chỉ được khai báo một lần',
    );
    await this.assertIngredientsExist(dto.items.map((i) => i.ingredientId));

    await this.prisma.$transaction(async (tx) => {
      await tx.toppingRecipeItem.deleteMany({ where: { toppingCode } });
      if (dto.items.length) {
        await tx.toppingRecipeItem.createMany({
          data: dto.items.map((i) => ({ toppingCode, ingredientId: i.ingredientId, quantity: i.quantity })),
        });
      }
    });
    return this.getToppingRecipe(toppingCode);
  }
}
