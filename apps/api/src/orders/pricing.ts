/**
 * Công thức tính giá một ly nước tại Server (Server-side Pricing).
 *
 * Nguyên tắc:
 * Giá 1 ly = Giá gốc size S + Phụ thu size + Tổng giá các topping.
 * Server LUÔN TỰ TÍNH LẠI, tuyệt đối không tin giá client gửi lên để chống gian lận (sửa request).
 */

export const unitPrice = (
  basePrice: number,
  sizeExtra: number,
  toppingPrices: number[],
) => basePrice + sizeExtra + toppingPrices.reduce((sum, price) => sum + price, 0);
