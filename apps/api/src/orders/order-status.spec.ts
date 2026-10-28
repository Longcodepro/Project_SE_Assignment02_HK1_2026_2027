import { ConflictException } from '@nestjs/common';
import {
  ORDER_TRANSITIONS,
  assertTransition,
  canTransition,
} from './order-status.js';

const ALL = ['PENDING', 'PAID', 'PAYMENT_FAILED'] as const;
const VALID = new Set([
  'PENDING>PAID',
  'PENDING>PAYMENT_FAILED',
  'PAYMENT_FAILED>PAID',
]);

describe('Order state machine', () => {
  it('chỉ cho đúng 3 chuyển trạng thái hợp lệ', () => {
    for (const from of ALL) {
      for (const to of ALL) {
        expect(canTransition(from, to), `${from} > ${to}`).toBe(
          VALID.has(`${from}>${to}`),
        );
      }
    }
  });

  it('PAID là trạng thái cuối', () => {
    expect(ORDER_TRANSITIONS.PAID).toEqual([]);
  });

  it.each([
    ['PAID', 'PENDING'],
    ['PAID', 'PAYMENT_FAILED'],
    ['PAYMENT_FAILED', 'PENDING'],
    ['PENDING', 'PENDING'],
  ] as const)('chặn chuyển %s → %s bằng 409', (from, to) => {
    expect(() => assertTransition(from, to)).toThrow(ConflictException);
  });

  it('cho phép chuyển hợp lệ', () => {
    expect(() => assertTransition('PENDING', 'PAID')).not.toThrow();
    expect(() => assertTransition('PAYMENT_FAILED', 'PAID')).not.toThrow();
  });
});
