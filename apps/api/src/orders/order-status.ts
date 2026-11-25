/**
 * Máy trạng thái đơn hàng (State Machine).
 *
 * Luồng chuyển trạng thái hợp lệ:
 *   PENDING ──► PAID ──► PREPARING ──► READY ──► COMPLETED
 *      │         ▲  │
 *      ▼         │  └───────────────► CANCELLED (hoàn tiền mô phỏng)
 *   PAYMENT_FAILED ──► CANCELLED
 *      └──────────────► PAID          (thanh toán lại)
 *
 * Quy tắc:
 * - COMPLETED và CANCELLED là trạng thái cuối (terminal), không thể chuyển tiếp.
 * - Đơn từ PREPARING trở đi (đang pha chế) không được phép hủy.
 */

import { ConflictException } from '@nestjs/common';
import type { OrderStatus } from '../generated/prisma/enums.js';

// Danh sách các trạng thái tiếp theo được phép từ mỗi trạng thái
export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ['PAID', 'PAYMENT_FAILED', 'CANCELLED'],
  PAYMENT_FAILED: ['PAID', 'CANCELLED'],
  PAID: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY'],
  READY: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

// Kiểm tra nhanh xem bước chuyển trạng thái có hợp lệ không
export const canTransition = (from: OrderStatus, to: OrderStatus) =>
  ORDER_TRANSITIONS[from].includes(to);

// Ném lỗi 409 Conflict nếu chuyển sai quy trình (ví dụ: nhảy từ PENDING sang READY)
export function assertTransition(from: OrderStatus, to: OrderStatus) {
  if (!canTransition(from, to)) {
    throw new ConflictException(
      `Không thể chuyển đơn từ ${from} sang ${to}`,
    );
  }
}
