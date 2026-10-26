// Bảng giá phải khớp frontend (ProductDetailModal). Giá luôn tính lại ở server,
// không tin giá client gửi lên.
export const SIZE_EXTRA = { S: 0, M: 5000, L: 10000 } as const;

export const TOPPING_PRICE = {
  'tran-chau': 8000,
  'kem-cheese': 10000,
  'thach-cafe': 6000,
} as const;

export type SizeId = keyof typeof SIZE_EXTRA;
export type ToppingId = keyof typeof TOPPING_PRICE;

export const unitPrice = (
  basePrice: number,
  size: SizeId,
  toppings: ToppingId[],
) =>
  basePrice +
  SIZE_EXTRA[size] +
  toppings.reduce((sum, t) => sum + TOPPING_PRICE[t], 0);
