import { BadRequestException, ConflictException } from '@nestjs/common';
import type { DiscountType } from '../generated/prisma/enums.js';

export type PromotionRule = {
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number;
  isActive: boolean;
  expiryDate: Date | null;
  maxUses: number | null;
  usedCount: number;
};

// Mã không dùng được thì ném lỗi rõ lý do; chưa giữ lượt (việc đó làm trong transaction tạo đơn)
export function assertPromotionUsable(p: PromotionRule, subtotal: number, now = new Date()) {
  if (!p.isActive) {
    throw new BadRequestException('Mã giảm giá không tồn tại hoặc đã bị vô hiệu');
  }
  if (p.expiryDate && p.expiryDate < now) {
    throw new BadRequestException('Mã giảm giá đã hết hạn');
  }
  if (subtotal < p.minOrderAmount) {
    throw new BadRequestException(
      `Đơn chưa đạt giá trị tối thiểu ${p.minOrderAmount}đ để dùng mã này`,
    );
  }
  if (p.maxUses !== null && p.usedCount >= p.maxUses) {
    throw new ConflictException('Mã giảm giá đã hết lượt sử dụng');
  }
}

// FIXED không giảm quá giá trị đơn; PERCENT làm tròn xuống
export const discountFor = (p: PromotionRule, subtotal: number) =>
  p.discountType === 'FIXED'
    ? Math.min(p.discountValue, subtotal)
    : Math.floor((subtotal * p.discountValue) / 100);
