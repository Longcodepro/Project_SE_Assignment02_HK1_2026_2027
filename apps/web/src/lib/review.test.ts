import { describe, expect, it } from 'vitest';
import type { Order } from '@/types';
import { pickOrderToReview, REVIEW_COMMENT_MAX, validateReview } from './review';

const don = (id: string, status: Order['status'], review: Order['review']): Order => ({
    id,
    status,
    review,
    total: 42000,
    createdAt: '2026-11-14T03:00:00Z',
    items: [],
});

describe('pickOrderToReview', () => {
    it('chọn đơn COMPLETED chưa đánh giá, ưu tiên đơn đứng trước (mới nhất)', () => {
        const ds = [don('b', 'COMPLETED', null), don('a', 'COMPLETED', null)];
        expect(pickOrderToReview(ds, [])?.id).toBe('b');
    });

    it('bỏ qua đơn đã đánh giá, đơn chưa hoàn tất và đơn khách đã bấm Để sau', () => {
        const ds = [
            don('1', 'COMPLETED', { stars: 5, comment: null }),
            don('2', 'READY', null),
            don('3', 'CANCELLED', null),
            don('4', 'COMPLETED', null),
            don('5', 'COMPLETED', null),
        ];
        expect(pickOrderToReview(ds, ['4'])?.id).toBe('5');
    });

    it('server chưa trả trường review (undefined) thì không nhắc', () => {
        expect(pickOrderToReview([don('1', 'COMPLETED', undefined)], [])).toBeUndefined();
    });

    it('không còn đơn nào cần đánh giá', () => {
        expect(pickOrderToReview([], [])).toBeUndefined();
        expect(pickOrderToReview([don('1', 'COMPLETED', null)], ['1'])).toBeUndefined();
    });
});

describe('validateReview', () => {
    it.each([1, 3, 5])('%i sao hợp lệ', (stars) => {
        expect(validateReview(stars, '')).toBeNull();
    });

    it.each([0, 6, -1, 2.5, Number.NaN])('%s sao không hợp lệ', (stars) => {
        expect(validateReview(stars, '')).toMatch(/1 đến 5 sao/);
    });

    it(`nhận xét tối đa ${REVIEW_COMMENT_MAX} ký tự (không tính khoảng trắng đầu cuối)`, () => {
        expect(validateReview(5, `  ${'a'.repeat(REVIEW_COMMENT_MAX)}  `)).toBeNull();
        expect(validateReview(5, 'a'.repeat(REVIEW_COMMENT_MAX + 1))).toMatch(/tối đa/);
    });
});
