/**
 * Cấu hình ValidationPipe chuẩn dùng chung cho toàn bộ ứng dụng và kiểm thử.
 *
 * Tác dụng của các cờ:
 * - whitelist: true -> Tự động loại bỏ mọi trường không được khai báo trong class DTO.
 * - forbidNonWhitelisted: true -> Nếu client cố tình gửi trường lạ (không có trong DTO), lập tức ném lỗi 400 Bad Request.
 *   Điều này ngăn chặn tấn công Mass Assignment (ví dụ client tự ý gửi { role: "ADMIN" } trong lúc đăng ký).
 * - transform: true -> Tự động chuyển đổi payload dạng plain object sang instance của class DTO (kích hoạt @Transform và type coercion).
 */

import { ValidationPipe } from '@nestjs/common';

export const createValidationPipe = () =>
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });
