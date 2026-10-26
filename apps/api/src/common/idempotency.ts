import { BadRequestException } from '@nestjs/common';

const KEY = /^[A-Za-z0-9_-]{1,128}$/;

// Header Idempotency-Key là tùy chọn; có thì phải đúng định dạng.
// ponytail: không so sánh nội dung yêu cầu với lần đầu, cùng key là trả kết quả cũ.
export function parseIdempotencyKey(raw?: string) {
  if (raw === undefined) return undefined;
  if (!KEY.test(raw)) {
    throw new BadRequestException(
      'Idempotency-Key must be 1-128 characters: letters, digits, _ or -',
    );
  }
  return raw;
}

export const isUniqueViolation = (e: unknown) =>
  (e as { code?: string } | null)?.code === 'P2002';
