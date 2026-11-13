import { describe, expect, it } from 'vitest';
// Import thẳng bảng giá của server để bắt lệch giá giữa hai bên
import { SIZE_EXTRA, TOPPING_PRICE, unitPrice } from '../../../api/src/orders/pricing';
import { SIZE_OPTIONS, TOPPING_OPTIONS, calcUnitPrice } from './pricing';

describe('bảng giá khớp server', () => {
    it('phụ thu size giống nhau', () => {
        expect(Object.fromEntries(SIZE_OPTIONS.map((s) => [s.id, s.extraPrice]))).toEqual(SIZE_EXTRA);
    });

    it('giá topping giống nhau', () => {
        expect(Object.fromEntries(TOPPING_OPTIONS.map((t) => [t.id, t.price]))).toEqual(TOPPING_PRICE);
    });
});

describe('calcUnitPrice', () => {
    it('size S không topping giữ nguyên giá gốc', () => {
        expect(calcUnitPrice(29000, 'S', [])).toBe(29000);
    });

    it('cộng phụ thu size và topping: 29.000 + M 5.000 + trân châu 8.000', () => {
        expect(calcUnitPrice(29000, 'M', ['tran-chau'])).toBe(42000);
    });

    it('bỏ qua topping lạ', () => {
        expect(calcUnitPrice(29000, 'L', ['khong-co'])).toBe(39000);
    });

    it('cho cùng kết quả với server ở mọi tổ hợp size và topping', () => {
        const ids = TOPPING_OPTIONS.map((t) => t.id) as (keyof typeof TOPPING_PRICE)[];
        for (const size of SIZE_OPTIONS.map((s) => s.id)) {
            for (const mask of Array.from({ length: 2 ** ids.length }, (_, i) => i)) {
                const picked = ids.filter((_, i) => mask & (1 << i));
                expect(calcUnitPrice(29000, size, picked)).toBe(unitPrice(29000, size, picked));
            }
        }
    });
});
