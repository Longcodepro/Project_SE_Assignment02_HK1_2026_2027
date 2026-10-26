import { ConflictException } from '@nestjs/common';
import type { OrderStatus } from '../generated/prisma/enums.js';

// Nguồn sự thật duy nhất cho vòng đời đơn hàng:
//   PENDING ──► PAID
//      │          ▲
//      ▼          │ (thanh toán lại)
//   PAYMENT_FAILED
// PAID là trạng thái cuối. Thanh toán lại mà vẫn lỗi thì đơn giữ nguyên
// PAYMENT_FAILED, không tính là một lần chuyển trạng thái.
export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ['PAID', 'PAYMENT_FAILED'],
  PAYMENT_FAILED: ['PAID'],
  PAID: [],
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
