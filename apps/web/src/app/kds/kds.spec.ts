import { describe, it, expect } from 'vitest';
import { getWaitingTime } from './page';

describe('KDS Helper Functions', () => {
  it('trả về "Vừa đặt" khi thời gian dưới 1 phút', () => {
    const now = new Date('2026-11-14T10:00:30Z').getTime();
    const orderCreatedAt = '2026-11-14T10:00:00Z';
    expect(getWaitingTime(orderCreatedAt, now)).toBe('Vừa đặt');
  });

  it('trả về số phút khi thời gian từ 1 đến 59 phút', () => {
    const now = new Date('2026-11-14T10:15:00Z').getTime();
    const orderCreatedAt = '2026-11-14T10:05:00Z';
    expect(getWaitingTime(orderCreatedAt, now)).toBe('10 phút trước');
  });

  it('trả về giờ và phút khi thời gian từ 60 phút trở lên', () => {
    const now = new Date('2026-11-14T11:25:00Z').getTime();
    const orderCreatedAt = '2026-11-14T10:00:00Z';
    expect(getWaitingTime(orderCreatedAt, now)).toBe('1h 25p');
  });

  it('trả về "Đang tải..." khi chưa có currentTimestamp (tránh lỗi prerender Next.js)', () => {
    const orderCreatedAt = '2026-11-14T10:00:00Z';
    expect(getWaitingTime(orderCreatedAt, null)).toBe('Đang tải...');
  });
});
