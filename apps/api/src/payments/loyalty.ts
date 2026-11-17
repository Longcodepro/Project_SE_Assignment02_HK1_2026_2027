/**
 * Công thức tính điểm thưởng tích lũy (Loyalty Points).
 * Quy ước: 1 điểm cho mỗi 1.000đ của đơn hàng (làm tròn xuống).
 */

export const VND_PER_POINT = 1000;

export const pointsFor = (orderTotal: number) =>
  Math.floor(orderTotal / VND_PER_POINT);
