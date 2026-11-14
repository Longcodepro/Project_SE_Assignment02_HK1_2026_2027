import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isUniqueViolation } from '../common/idempotency.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreatePromotionDto, UpdatePromotionDto } from './dto/promotion.dto.js';

const SELECT = {
  id: true,
  code: true,
  discountType: true,
  discountValue: true,
  minOrderAmount: true,
  isActive: true,
  expiryDate: true,
  maxUses: true,
  usedCount: true,
} as const;

// Ràng buộc chéo giữa kiểu giảm và giá trị: DTO chỉ biết từng trường riêng lẻ
function assertValue(type: string, value: number) {
  if (type === 'PERCENT' && value > 100) {
    throw new BadRequestException('discountValue của mã PERCENT phải từ 1 đến 100');
  }
}

const toDate = (v: string | null | undefined) => (v == null ? v : new Date(v));

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.promotion.findMany({ orderBy: { id: 'desc' }, select: SELECT });
  }

  async create(dto: CreatePromotionDto) {
    assertValue(dto.discountType, dto.discountValue);
    try {
      return await this.prisma.promotion.create({
        data: {
          code: dto.code,
          discountType: dto.discountType,
          discountValue: dto.discountValue,
          minOrderAmount: dto.minOrderAmount,
          expiryDate: toDate(dto.expiryDate) ?? null,
          maxUses: dto.maxUses ?? null,
        },
        select: SELECT,
      });
    } catch (e) {
      if (isUniqueViolation(e)) throw new ConflictException('Mã giảm giá đã tồn tại');
      throw e;
    }
  }

  async update(id: number, dto: UpdatePromotionDto) {
    if (Object.values(dto).every((v) => v === undefined)) {
      throw new BadRequestException('Cần gửi ít nhất một trường để sửa');
    }
    const current = await this.prisma.promotion.findUnique({ where: { id }, select: SELECT });
    if (!current) throw new NotFoundException('Không tìm thấy mã giảm giá');

    assertValue(dto.discountType ?? current.discountType, dto.discountValue ?? current.discountValue);
    const maxUses = dto.maxUses === undefined ? current.maxUses : dto.maxUses;
    if (maxUses !== null && maxUses < current.usedCount) {
      throw new BadRequestException('Tổng lượt tối đa không được nhỏ hơn số lượt đã dùng');
    }

    return this.prisma.promotion.update({
      where: { id },
      data: {
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        minOrderAmount: dto.minOrderAmount,
        isActive: dto.isActive,
        expiryDate: toDate(dto.expiryDate),
        maxUses: dto.maxUses,
      },
      select: SELECT,
    });
  }
}
