import { ConflictException } from '@nestjs/common';
import type { OrderStatus } from '../generated/prisma/enums.js';

// Nguồn sự thật duy nhất cho vòng đời đơn hàng (docs/requirements/context-and-scope.md §6.5):
//
//   PENDING ──► PAID ──► PREPARING ──► READY ──► COMPLETED
//      │         ▲  │
//      ▼         │  └───────────────► CANCELLED (khách hoặc Cashier, hoàn tiền mô phỏng)
//   PAYMENT_FAILED ──► CANCELLED      (khách, chưa trả tiền nên không hoàn)
//      └──────────────► PAID          (thanh toán lại)
//
// Không có đường hủy từ PREPARING, READY, COMPLETED. COMPLETED và CANCELLED là cuối.
// Thanh toán lại mà vẫn lỗi thì đơn giữ nguyên PAYMENT_FAILED, không tính là một lần chuyển.
// Bảng này chỉ nói chuyển nào hợp lệ; ai được thực hiện thì do @Roles ở từng endpoint quyết định.
export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ['PAID', 'PAYMENT_FAILED', 'CANCELLED'],
  PAYMENT_FAILED: ['PAID', 'CANCELLED'],
  PAID: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY'],
  READY: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

export const canTransition = (from: OrderStatus, to: OrderStatus) =>
  ORDER_TRANSITIONS[from].includes(to);

export function assertTransition(from: OrderStatus, to: OrderStatus) {
  if (!canTransition(from, to)) {
    throw new ConflictException(
      `Không thể chuyển đơn từ ${from} sang ${to}`,
    );
  }
}
