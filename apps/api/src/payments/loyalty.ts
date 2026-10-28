// 1 điểm cho mỗi 1.000đ của đơn, làm tròn xuống
export const VND_PER_POINT = 1000;

export const pointsFor = (orderTotal: number) =>
  Math.floor(orderTotal / VND_PER_POINT);
