import { describe, expect, it } from 'vitest';
// Hàm tính giá của server; phụ thu size và giá topping do server đọc từ CSDL (Sprint 4)
import { unitPrice } from '../../../api/src/orders/pricing';
import { SIZE_OPTIONS, TOPPING_OPTIONS, calcUnitPrice } from './pricing';

// Giá seed mặc định của server (apps/api/prisma/seed.ts): bảng hiển thị mặc định phải khớp
describe('bảng giá mặc định khớp giá seed của server', () => {
    it('phụ thu size', () => {
        expect(Object.fromEntries(SIZE_OPTIONS.map((s) => [s.id, s.extraPrice]))).toEqual({ S: 0, M: 5000, L: 10000 });
    });

    it('giá topping', () => {
        expect(Object.fromEntries(TOPPING_OPTIONS.map((t) => [t.id, t.price]))).toEqual({
            'tran-chau': 8000,
            'kem-cheese': 10000,
            'thach-cafe': 6000,
        });
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

    it('cho cùng kết quả với hàm của server ở mọi tổ hợp size và topping', () => {
        const ids = TOPPING_OPTIONS.map((t) => t.id);
        for (const size of SIZE_OPTIONS) {
            for (const mask of Array.from({ length: 2 ** ids.length }, (_, i) => i)) {
                const picked = TOPPING_OPTIONS.filter((_, i) => mask & (1 << i));
                expect(calcUnitPrice(29000, size.id, picked.map((t) => t.id))).toBe(
                    unitPrice(
                        29000,
                        size.extraPrice,
                        picked.map((t) => t.price),
                    ),
                );
            }
        }
    });
});
