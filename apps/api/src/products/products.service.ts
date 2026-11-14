import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    // Món của danh mục đang ẩn không hiện trên menu
    const products = await this.prisma.product.findMany({
      where: { category: { isActive: true } },
      orderBy: { id: 'asc' },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    });
    return products.map(({ categoryId: _categoryId, ...p }) => p);
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id, category: { isActive: true } },
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    });
    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm có id ${id}`);
    }
    const { categoryId: _categoryId, ...rest } = product;
    return rest;
  }
}
