import { describe, expect, it } from 'vitest';
import { cartKeyOf, isValidPromoCode, normalizePromoCode } from './promo';

describe('normalizePromoCode', () => {
    it('cắt khoảng trắng đầu cuối và viết hoa', () => {
        expect(normalizePromoCode('  welcome10 ')).toBe('WELCOME10');
    });
});

describe('isValidPromoCode', () => {
    it.each(['WELCOME10', 'GIAM15K', 'tet_2027', 'a-b'])('%s hợp lệ', (code) => {
        expect(isValidPromoCode(code)).toBe(true);
    });

    it.each(['', 'ab', 'có dấu', 'WELCOME 10', 'a'.repeat(33), 'MA!'])('"%s" không hợp lệ', (code) => {
        expect(isValidPromoCode(code)).toBe(false);
    });
});

describe('cartKeyOf', () => {
    const ly = { productId: 1, size: 'M', quantity: 2, toppings: ['kem-cheese', 'tran-chau'] };

    it('không phụ thuộc thứ tự món hay thứ tự topping', () => {
        const khac = { productId: 2, size: 'S', quantity: 1, toppings: [] };
        const nguoc = { ...ly, toppings: ['tran-chau', 'kem-cheese'] };
        expect(cartKeyOf([ly, khac])).toBe(cartKeyOf([khac, nguoc]));
    });

    it.each([
        ['đổi số lượng', { ...ly, quantity: 3 }],
        ['đổi size', { ...ly, size: 'L' }],
        ['đổi topping', { ...ly, toppings: ['tran-chau'] }],
        ['đổi món', { ...ly, productId: 9 }],
    ])('khác nhau khi %s', (_ten, doi) => {
        expect(cartKeyOf([doi])).not.toBe(cartKeyOf([ly]));
    });

    it('giỏ rỗng là chuỗi rỗng', () => {
        expect(cartKeyOf([])).toBe('');
    });
});
