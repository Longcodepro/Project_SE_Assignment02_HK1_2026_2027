import { newPickupCode } from './pickup-code.js';

describe('newPickupCode', () => {
  it('luôn là chuỗi đúng 6 chữ số, kể cả khi bắt đầu bằng 0', () => {
    for (let i = 0; i < 2000; i++) expect(newPickupCode()).toMatch(/^\d{6}$/);
  });

  it('các mã sinh ra không dồn về một giá trị (ngẫu nhiên)', () => {
    const codes = new Set(Array.from({ length: 200 }, newPickupCode));
    expect(codes.size).toBeGreaterThan(190);
  });
});
