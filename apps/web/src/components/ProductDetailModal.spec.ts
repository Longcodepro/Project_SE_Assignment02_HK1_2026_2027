import { describe, it, expect } from 'vitest';
import { SIZE_OPTIONS, TOPPING_OPTIONS, calculateFinalPrice } from './ProductDetailModal';

describe('ProductDetailModal Pricing (Khớp bảng giá Server)', () => {
  const BASE_PRICE = 29000; // Giá gốc Cà phê sữa

  it('1. Cấu hình phụ thu Size khớp với quy định server (SIZE_EXTRA)', () => {
    const sizeS = SIZE_OPTIONS.find((s) => s.id === 'S');
    const sizeM = SIZE_OPTIONS.find((s) => s.id === 'M');
    const sizeL = SIZE_OPTIONS.find((s) => s.id === 'L');

    expect(sizeS?.extraPrice).toBe(0);
    expect(sizeM?.extraPrice).toBe(5000);
    expect(sizeL?.extraPrice).toBe(10000);
  });

  it('2. Cấu hình giá Topping khớp với quy định server (TOPPING_PRICE)', () => {
    const tranChau = TOPPING_OPTIONS.find((t) => t.id === 'tran-chau');
    const kemCheese = TOPPING_OPTIONS.find((t) => t.id === 'kem-cheese');
    const thachCafe = TOPPING_OPTIONS.find((t) => t.id === 'thach-cafe');

    expect(tranChau?.price).toBe(8000);
    expect(kemCheese?.price).toBe(10000);
    expect(thachCafe?.price).toBe(6000);
  });

  it('3. Size S không phụ thu', () => {
    const price = calculateFinalPrice(BASE_PRICE, 'S', []);
    expect(price).toBe(29000);
  });

  it('4. Size M phụ thu đúng 5.000đ', () => {
    const price = calculateFinalPrice(BASE_PRICE, 'M', []);
    expect(price).toBe(34000);
  });

  it('5. Size L phụ thu đúng 10.000đ', () => {
    const price = calculateFinalPrice(BASE_PRICE, 'L', []);
    expect(price).toBe(39000);
  });

  it('6. Thêm 1 topping tính đúng giá topping', () => {
    const priceWithTranChau = calculateFinalPrice(BASE_PRICE, 'S', ['tran-chau']);
    expect(priceWithTranChau).toBe(29000 + 8000); // 37000

    const priceWithKemCheese = calculateFinalPrice(BASE_PRICE, 'S', ['kem-cheese']);
    expect(priceWithKemCheese).toBe(29000 + 10000); // 39000

    const priceWithThach = calculateFinalPrice(BASE_PRICE, 'S', ['thach-cafe']);
    expect(priceWithThach).toBe(29000 + 6000); // 35000
  });

  it('7. Combo mẫu khớp Playwright E2E: Size M + Trân châu đen = 42.000đ', () => {
    // 29.000 (gốc) + 5.000 (Size M) + 8.000 (Trân châu) = 42.000đ
    const price = calculateFinalPrice(BASE_PRICE, 'M', ['tran-chau']);
    expect(price).toBe(42000);
  });

  it('8. Nhiều topping cùng lúc: Size L + Trân châu + Kem cheese', () => {
    // 29.000 (gốc) + 10.000 (Size L) + 8.000 (Trân châu) + 10.000 (Kem cheese) = 57.000đ
    const price = calculateFinalPrice(BASE_PRICE, 'L', ['tran-chau', 'kem-cheese']);
    expect(price).toBe(57000);
  });
});