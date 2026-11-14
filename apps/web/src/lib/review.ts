import type { Order } from '@/types';

export const REVIEW_COMMENT_MAX = 500;
const DISMISSED_KEY = 'brewlite_review_dismissed';

// Đơn đầu tiên (mới nhất trước) đã COMPLETED, chưa có đánh giá và khách chưa bấm "Để sau".
// review === undefined nghĩa là server chưa trả trường này nên không chắc, không nhắc.
export function pickOrderToReview(orders: Order[], dismissedIds: string[]): Order | undefined {
    return orders.find((o) => o.status === 'COMPLETED' && o.review === null && !dismissedIds.includes(String(o.id)));
}

// Trả về thông báo lỗi hoặc null nếu hợp lệ: 1 đến 5 sao, nhận xét tối đa 500 ký tự
export function validateReview(stars: number, comment: string): string | null {
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) return 'Vui lòng chọn từ 1 đến 5 sao.';
    if (comment.trim().length > REVIEW_COMMENT_MAX) return `Nhận xét tối đa ${REVIEW_COMMENT_MAX} ký tự.`;
    return null;
}

// Các đơn khách đã bấm "Để sau": nhớ trên máy để không hiện lại popup mỗi lần mở trang
export function loadDismissedReviews(): string[] {
    try {
        const raw = typeof window === 'undefined' ? null : window.localStorage.getItem(DISMISSED_KEY);
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
    } catch {
        return [];
    }
}

export function saveDismissedReviews(ids: string[]): void {
    try {
        window.localStorage.setItem(DISMISSED_KEY, JSON.stringify(ids.slice(-50)));
    } catch {
        // Trình duyệt chặn lưu trữ: popup chỉ nhắc lại ở lần sau, không ảnh hưởng chức năng
    }
}
