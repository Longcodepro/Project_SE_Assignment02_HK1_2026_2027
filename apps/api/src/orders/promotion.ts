/**
 * Logic kiểm tra và tính toán giảm giá của Mã khuyến mãi (Voucher).
 */

import { BadRequestException, ConflictException } from '@nestjs/common';
import type { DiscountType } from '../generated/prisma/enums.js';

export type PromotionRule = {
  discountType: DiscountType; // FIXED (giảm số tiền cố định) hoặc PERCENT (giảm %)
  discountValue: number;
  minOrderAmount: number;     // Giá trị đơn tối thiểu để được áp dụng
  isActive: boolean;
  expiryDate: Date | null;
  maxUses: number | null;     // Số lượt dùng tối đa toàn hệ thống (null = vô hạn)
  usedCount: number;          // Số lượt đã sử dụng thực tế
};

/**
 * Kiểm tra mã giảm giá có hợp lệ để áp dụng vào đơn hay không
 */
export function assertPromotionUsable(
  p: PromotionRule,
  subtotal: number,
  now = new Date(),
) {
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

/**
 * Tính số tiền thực tế được giảm:
 * - FIXED: Giảm tối đa bằng giá trị đơn (không làm tổng tiền thành số âm).
 * - PERCENT: Tính theo % và làm tròn xuống bằng Math.floor.
 */
export const discountFor = (p: PromotionRule, subtotal: number) =>
  p.discountType === 'FIXED'
    ? Math.min(p.discountValue, subtotal)
    : Math.floor((subtotal * p.discountValue) / 100);
