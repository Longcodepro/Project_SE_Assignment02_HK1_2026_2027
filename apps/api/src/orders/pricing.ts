// Giá một ly = giá món (size S) + phụ thu size + giá các topping.
// Phụ thu và giá topping đọc từ CSDL (Sprint 4); giá luôn tính lại ở server,
// không tin giá client gửi lên. Dòng đơn lưu sẵn unitPrice nên đổi giá không ảnh hưởng đơn cũ.
export const unitPrice = (basePrice: number, sizeExtra: number, toppingPrices: number[]) =>
  basePrice + sizeExtra + toppingPrices.reduce((sum, price) => sum + price, 0);
