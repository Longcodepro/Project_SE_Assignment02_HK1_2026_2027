import type { OrderStatus } from '@/types';

export const CANCEL_REASON_MAX = 200;

// Khách hủy được khi quán chưa bắt đầu pha chế (PREPARING, READY, COMPLETED, CANCELLED thì không)
const CUSTOMER_CANCELLABLE: readonly OrderStatus[] = ['PENDING', 'PAYMENT_FAILED', 'PAID'];

export const canCustomerCancel = (status: OrderStatus) => CUSTOMER_CANCELLABLE.includes(status);

// Đơn đã trả tiền thì phải ghi lý do (hoàn tiền mô phỏng cần truy vết); đơn chưa trả tiền thì tùy chọn
export const cancelNeedsReason = (status: OrderStatus) => status === 'PAID';

// Trả về thông báo lỗi để hiện cho người dùng, hoặc null nếu hợp lệ
export function validateCancelReason(status: OrderStatus, reason: string): string | null {
    const trimmed = reason.trim();
    if (cancelNeedsReason(status) && !trimmed) return 'Vui lòng ghi lý do hủy đơn đã thanh toán.';
    if (trimmed.length > CANCEL_REASON_MAX) return `Lý do tối đa ${CANCEL_REASON_MAX} ký tự.`;
    return null;
}
