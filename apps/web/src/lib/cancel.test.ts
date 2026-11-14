import { describe, expect, it } from 'vitest';
import { CANCEL_REASON_MAX, canCustomerCancel, cancelNeedsReason, validateCancelReason } from './cancel';

describe('canCustomerCancel', () => {
    it.each(['PENDING', 'PAYMENT_FAILED', 'PAID'] as const)('%s còn hủy được', (status) => {
        expect(canCustomerCancel(status)).toBe(true);
    });

    it.each(['PREPARING', 'READY', 'COMPLETED', 'CANCELLED'] as const)('%s không hủy được', (status) => {
        expect(canCustomerCancel(status)).toBe(false);
    });
});

describe('cancelNeedsReason', () => {
    it('chỉ đơn đã thanh toán bắt buộc lý do', () => {
        expect(cancelNeedsReason('PAID')).toBe(true);
        expect(cancelNeedsReason('PENDING')).toBe(false);
        expect(cancelNeedsReason('PAYMENT_FAILED')).toBe(false);
    });
});

describe('validateCancelReason', () => {
    it('đơn PAID thiếu lý do hoặc chỉ có khoảng trắng thì báo lỗi', () => {
        expect(validateCancelReason('PAID', '')).toMatch(/ghi lý do/);
        expect(validateCancelReason('PAID', '   ')).toMatch(/ghi lý do/);
    });

    it('đơn PAID có lý do thì hợp lệ', () => {
        expect(validateCancelReason('PAID', 'Đổi ý')).toBeNull();
    });

    it('đơn chưa trả tiền không cần lý do', () => {
        expect(validateCancelReason('PENDING', '')).toBeNull();
        expect(validateCancelReason('PAYMENT_FAILED', '')).toBeNull();
    });

    it(`lý do quá ${CANCEL_REASON_MAX} ký tự bị từ chối, đúng ${CANCEL_REASON_MAX} thì được`, () => {
        expect(validateCancelReason('PAID', 'a'.repeat(CANCEL_REASON_MAX))).toBeNull();
        expect(validateCancelReason('PAID', 'a'.repeat(CANCEL_REASON_MAX + 1))).toMatch(/tối đa/);
    });
});
