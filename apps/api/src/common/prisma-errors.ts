/**
 * Tiện ích nhận diện mã lỗi đặc thù của Prisma ORM.
 */

/**
 * Mã lỗi Prisma P2025: "An operation failed because it depends on one or more records that were required but not found."
 * Xảy ra khi chạy lệnh update() hoặc delete() với điều kiện WHERE không khớp bản ghi nào trong database.
 */
export const isRecordNotFound = (e: unknown) =>
  (e as { code?: string } | null)?.code === 'P2025';
