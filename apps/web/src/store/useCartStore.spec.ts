import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore } from "./useCartStore";
import { Product } from "@/types";

const mockProduct: Product = {
  id: 1,
  name: 'Cà phê sữa',
  price: 29000,
  imageUrl: '/cafe-sua.jpg',
  isAvailable: true,
};
const mockProduct2: Product = {
  id: 2,
  name: 'Trà đào cam sả',
  price: 35000,
  imageUrl: '/tra-dao.jpg',
  isAvailable: true,
};

describe('useCartStore (Quản lý giỏ hàng phía Client)', () => {
  beforeEach(() => {
    // Reset giỏ hàng trước mỗi test case
    useCartStore.getState().clearCart();
  });
  it('1. Giỏ hàng khởi đầu rỗng', () => {
    const state = useCartStore.getState();
    expect(state.items).toHaveLength(0);
    expect(state.getTotalItems()).toBe(0);
    expect(state.getTotalPrice()).toBe(0);
  });
  it('2. Thêm món mới vào giỏ hàng', () => {
    useCartStore.getState().addToCart(mockProduct, 'S', [], 29000);
    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].cartItemId).toBe('1-S-');
    expect(items[0].quantity).toBe(1);
    expect(items[0].unitPrice).toBe(29000);
    expect(useCartStore.getState().getTotalPrice()).toBe(29000);
  });
  it('3. Gộp dòng khi thêm cùng món, cùng size và cùng topping (tăng số lượng)', () => {
    // Thêm lần 1
    useCartStore.getState().addToCart(mockProduct, 'M', ['tran-chau'], 42000);
    // Thêm lần 2 cùng tùy chọn
    useCartStore.getState().addToCart(mockProduct, 'M', ['tran-chau'], 42000);
    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1); // Không tạo dòng mới
    expect(items[0].quantity).toBe(2); // Số lượng gộp thành 2
    expect(useCartStore.getState().getTotalItems()).toBe(2);
    expect(useCartStore.getState().getTotalPrice()).toBe(84000); // 42000 * 2
  });
  it('4. Tách thành các dòng riêng biệt khi khác size hoặc khác topping', () => {
    // Món 1: Size S, không topping
    useCartStore.getState().addToCart(mockProduct, 'S', [], 29000);
    // Món 2: Cùng món nhưng Size M (+5k = 34k)
    useCartStore.getState().addToCart(mockProduct, 'M', [], 34000);
    // Món 3: Cùng món, Size M nhưng thêm Trân châu (+8k = 42k)
    useCartStore.getState().addToCart(mockProduct, 'M', ['tran-chau'], 42000);
    // Món 4: Món khác hoàn toàn
    useCartStore.getState().addToCart(mockProduct2, 'L', [], 45000);
    const items = useCartStore.getState().items;
    expect(items).toHaveLength(4);
    expect(useCartStore.getState().getTotalItems()).toBe(4);
    expect(useCartStore.getState().getTotalPrice()).toBe(29000 + 34000 + 42000 + 45000);
  });
  it('5. Tăng giảm số lượng (updateQuantity) và chặn không cho giảm dưới 1', () => {
    useCartStore.getState().addToCart(mockProduct, 'S', [], 29000);
    const cartItemId = '1-S-';
    // Tăng lên 1
    useCartStore.getState().updateQuantity(cartItemId, 1);
    expect(useCartStore.getState().items[0].quantity).toBe(2);
    // Giảm đi 1
    useCartStore.getState().updateQuantity(cartItemId, -1);
    expect(useCartStore.getState().items[0].quantity).toBe(1);
    // Cố tình giảm tiếp: số lượng tối thiểu vẫn phải là 1 (không biến mất, không âm)
    useCartStore.getState().updateQuantity(cartItemId, -1);
    expect(useCartStore.getState().items[0].quantity).toBe(1);
  });
  it('6. Xóa một món khỏi giỏ hàng (removeFromCart)', () => {
    useCartStore.getState().addToCart(mockProduct, 'S', [], 29000);
    useCartStore.getState().addToCart(mockProduct2, 'M', [], 40000);
    expect(useCartStore.getState().items).toHaveLength(2);
    useCartStore.getState().removeFromCart('1-S-');
    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].cartItemId).toBe('2-M-');
    expect(useCartStore.getState().getTotalPrice()).toBe(40000);
  });
  it('7. Dọn sạch giỏ hàng (clearCart)', () => {
    useCartStore.getState().addToCart(mockProduct, 'S', [], 29000);
    useCartStore.getState().addToCart(mockProduct2, 'M', [], 40000);
    expect(useCartStore.getState().items).toHaveLength(2);
    useCartStore.getState().clearCart();
    expect(useCartStore.getState().items).toHaveLength(0);
    expect(useCartStore.getState().getTotalItems()).toBe(0);
    expect(useCartStore.getState().getTotalPrice()).toBe(0);
  });
});
