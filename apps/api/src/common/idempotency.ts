/**
 * Tiện ích xử lý Idempotency Key (Chống gửi trùng lặp / Double submit).
 *
 * Ý nghĩa cơ học:
 * Trong thương mại điện tử / thanh toán, khi mạng lag, người dùng bấm nút Đặt hàng / Thanh toán 2 lần,
 * hoặc client tự retry request. Header Idempotency-Key giúp server nhận diện request bị gửi lặp:
 * - Lần 1: Thực hiện giao dịch và lưu Idempotency Key kèm kết quả vào Database.
 * - Lần 2 (cùng key): Server thấy key đã tồn tại trong DB thì lập tức trả lại kết quả cũ, KHÔNG tạo đơn mới,
 *   KHÔNG trừ tiền lần 2.
 */

import { BadRequestException } from '@nestjs/common';

// Ràng buộc định dạng key: chỉ gồm chữ cái, chữ số, dấu gạch dưới hoặc gạch ngang, độ dài 1-128 ký tự
const KEY = /^[A-Za-z0-9_-]{1,128}$/;

/**
 * Kiểm tra và chuẩn hóa Idempotency Key từ header gửi lên
 */
export function parseIdempotencyKey(raw?: string) {
  if (raw === undefined) return undefined;
  if (!KEY.test(raw)) {
    throw new BadRequestException(
      'Idempotency-Key must be 1-128 characters: letters, digits, _ or -',
    );
  }
  return raw;
}

/**
 * Kiểm tra xem ngoại lệ ném ra từ Prisma có phải là vi phạm ràng buộc Unique (P2002) hay không.
 * Thường dùng khi insert trùng Idempotency-Key hoặc trùng SĐT.
 */
export const isUniqueViolation = (e: unknown) =>
  (e as { code?: string } | null)?.code === 'P2002';
