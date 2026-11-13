import { beforeEach, describe, expect, it, vi } from 'vitest';

// Store dùng persist(localStorage); môi trường node không có nên giả lập trước khi import
vi.hoisted(() => {
    const data = new Map<string, string>();
    globalThis.localStorage = {
        getItem: (k: string) => data.get(k) ?? null,
        setItem: (k: string, v: string) => void data.set(k, v),
        removeItem: (k: string) => void data.delete(k),
        clear: () => data.clear(),
        key: () => null,
        length: 0,
    } as Storage;
});

import { useCartStore } from './useCartStore';

const coffee = { id: 1, name: 'Cà phê sữa', price: 29000, imageUrl: '' };
const tea = { id: 2, name: 'Trà đào', price: 35000, imageUrl: '' };
const state = () => useCartStore.getState();

beforeEach(() => state().clearCart());

describe('useCartStore', () => {
    it('thêm món mới tạo một dòng, số lượng 1', () => {
        state().addToCart(coffee, 'M', [], 34000);
        expect(state().items).toHaveLength(1);
        expect(state().items[0]).toMatchObject({ cartItemId: '1-M-', quantity: 1, unitPrice: 34000 });
    });

    it('gộp dòng khi cùng món, size và topping (thứ tự topping không quan trọng)', () => {
        state().addToCart(coffee, 'M', ['tran-chau', 'kem-cheese'], 52000);
        state().addToCart(coffee, 'M', ['kem-cheese', 'tran-chau'], 52000);
        expect(state().items).toHaveLength(1);
        expect(state().items[0].quantity).toBe(2);
    });

    it('khác size hoặc khác topping thì thành dòng riêng', () => {
        state().addToCart(coffee, 'S', [], 29000);
        state().addToCart(coffee, 'L', [], 39000);
        state().addToCart(coffee, 'S', ['tran-chau'], 37000);
        expect(state().items).toHaveLength(3);
    });

    it('tăng giảm số lượng, không giảm dưới 1', () => {
        state().addToCart(coffee, 'S', [], 29000);
        const id = state().items[0].cartItemId;
        state().updateQuantity(id, 2);
        expect(state().items[0].quantity).toBe(3);
        state().updateQuantity(id, -10);
        expect(state().items[0].quantity).toBe(1);
    });

    it('xóa một dòng chỉ xóa đúng dòng đó', () => {
        state().addToCart(coffee, 'S', [], 29000);
        state().addToCart(tea, 'S', [], 35000);
        state().removeFromCart('1-S-');
        expect(state().items.map((i) => i.cartItemId)).toEqual(['2-S-']);
    });

    it('tổng ly và tổng tiền = Σ đơn giá × số lượng', () => {
        state().addToCart(coffee, 'M', [], 34000);
        state().addToCart(tea, 'S', [], 35000);
        state().updateQuantity('1-M-', 1); // cà phê x2
        expect(state().getTotalItems()).toBe(3);
        expect(state().getTotalPrice()).toBe(2 * 34000 + 35000);
    });

    it('clearCart làm trống giỏ', () => {
        state().addToCart(coffee, 'S', [], 29000);
        state().clearCart();
        expect(state().items).toEqual([]);
        expect(state().getTotalPrice()).toBe(0);
    });
});
