import { randomInt } from 'node:crypto';

// 6 chữ số, giữ cả số 0 đứng đầu nên luôn là chuỗi
export const newPickupCode = () => randomInt(0, 1_000_000).toString().padStart(6, '0');
