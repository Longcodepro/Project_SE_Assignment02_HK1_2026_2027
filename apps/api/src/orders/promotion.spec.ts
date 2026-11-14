import { BadRequestException, ConflictException } from '@nestjs/common';
import { assertPromotionUsable, discountFor, type PromotionRule } from './promotion.js';

const rule = (over: Partial<PromotionRule> = {}): PromotionRule => ({
  discountType: 'PERCENT',
  discountValue: 10,
  minOrderAmount: 50000,
  isActive: true,
  expiryDate: null,
  maxUses: 100,
  usedCount: 0,
  ...over,
});
const now = new Date('2026-11-14T00:00:00Z');

describe('discountFor', () => {
  it('PERCENT làm tròn xuống', () => {
    expect(discountFor(rule({ discountValue: 10 }), 84000)).toBe(8400);
    expect(discountFor(rule({ discountValue: 33 }), 84000)).toBe(27720);
    expect(discountFor(rule({ discountValue: 15 }), 12345)).toBe(1851);
  });

  it('FIXED giảm đúng số tiền nhưng không vượt giá trị đơn', () => {
    const fixed = rule({ discountType: 'FIXED', discountValue: 15000 });
    expect(discountFor(fixed, 84000)).toBe(15000);
    expect(discountFor(fixed, 10000)).toBe(10000);
  });
});

describe('assertPromotionUsable', () => {
  it('mã hợp lệ thì không ném lỗi', () => {
    expect(() => assertPromotionUsable(rule(), 84000, now)).not.toThrow();
  });

  it('đúng bằng đơn tối thiểu vẫn dùng được', () => {
    expect(() => assertPromotionUsable(rule({ minOrderAmount: 84000 }), 84000, now)).not.toThrow();
  });

  it('hạn dùng: còn hạn thì dùng được, quá hạn thì 400', () => {
    expect(() => assertPromotionUsable(rule({ expiryDate: new Date('2026-11-15T00:00:00Z') }), 84000, now)).not.toThrow();
    expect(() => assertPromotionUsable(rule({ expiryDate: new Date('2026-11-13T23:59:59Z') }), 84000, now)).toThrow(
      new BadRequestException('Mã giảm giá đã hết hạn'),
    );
  });

  it('mã bị vô hiệu: 400', () => {
    expect(() => assertPromotionUsable(rule({ isActive: false }), 84000, now)).toThrow(BadRequestException);
  });

  it('chưa đủ đơn tối thiểu: 400, thông báo nêu số tiền', () => {
    expect(() => assertPromotionUsable(rule({ minOrderAmount: 100000 }), 84000, now)).toThrow(
      /tối thiểu 100000đ/,
    );
  });

  it('hết lượt: 409; còn một lượt thì dùng được; không giới hạn thì luôn dùng được', () => {
    expect(() => assertPromotionUsable(rule({ maxUses: 5, usedCount: 5 }), 84000, now)).toThrow(ConflictException);
    expect(() => assertPromotionUsable(rule({ maxUses: 5, usedCount: 4 }), 84000, now)).not.toThrow();
    expect(() => assertPromotionUsable(rule({ maxUses: null, usedCount: 99999 }), 84000, now)).not.toThrow();
  });
});
