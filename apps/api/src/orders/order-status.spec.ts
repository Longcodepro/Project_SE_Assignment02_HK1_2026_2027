import { ConflictException } from '@nestjs/common';
import {
  ORDER_TRANSITIONS,
  assertTransition,
  canTransition,
} from './order-status.js';

const ALL = [
  'PENDING',
  'PAID',
  'PAYMENT_FAILED',
  'PREPARING',
  'READY',
  'COMPLETED',
  'CANCELLED',
] as const;

// Bảng §6.5 của context-and-scope.md, viết lại độc lập với code để test bắt được sai lệch
const VALID = new Set([
  'PENDING>PAID',
  'PENDING>PAYMENT_FAILED',
  'PAYMENT_FAILED>PAID',
  'PENDING>CANCELLED',
  'PAYMENT_FAILED>CANCELLED',
  'PAID>PREPARING',
  'PAID>CANCELLED',
  'PREPARING>READY',
  'READY>COMPLETED',
]);

describe('Order state machine', () => {
  it('đúng 9 chuyển hợp lệ và chặn mọi cặp còn lại (7 x 7 cặp)', () => {
    let hopLe = 0;
    for (const from of ALL) {
      for (const to of ALL) {
        const expected = VALID.has(`${from}>${to}`);
        expect(canTransition(from, to), `${from} > ${to}`).toBe(expected);
        if (expected) hopLe++;
      }
    }
    expect(hopLe).toBe(9);
  });

  it('COMPLETED và CANCELLED là trạng thái cuối', () => {
    expect(ORDER_TRANSITIONS.COMPLETED).toEqual([]);
    expect(ORDER_TRANSITIONS.CANCELLED).toEqual([]);
  });

  it.each(['PREPARING', 'READY', 'COMPLETED'] as const)(
    'không có đường hủy từ %s',
    (from) => {
      expect(canTransition(from, 'CANCELLED')).toBe(false);
      expect(() => assertTransition(from, 'CANCELLED')).toThrow(ConflictException);
    },
  );

  it.each([
    ['PAID', 'PAID'],
    ['PAID', 'PENDING'],
    ['PAID', 'PAYMENT_FAILED'],
    ['PAYMENT_FAILED', 'PENDING'],
    ['PENDING', 'PENDING'],
    ['PREPARING', 'PAID'],
    ['READY', 'PREPARING'],
    ['PAID', 'READY'],
    ['PAID', 'COMPLETED'],
    ['CANCELLED', 'PAID'],
  ] as const)('chặn chuyển %s → %s bằng 409', (from, to) => {
    expect(() => assertTransition(from, to)).toThrow(ConflictException);
  });

  it('cho phép chuyển hợp lệ', () => {
    for (const key of VALID) {
      const [from, to] = key.split('>') as [(typeof ALL)[number], (typeof ALL)[number]];
      expect(() => assertTransition(from, to)).not.toThrow();
    }
  });
});
