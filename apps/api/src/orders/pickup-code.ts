/**
 * Sinh mã nhận hàng 6 chữ số ngẫu nhiên an toàn bằng node:crypto.
 * Ví dụ: "038417" (padStart để giữ số 0 ở đầu).
 * Mã này được sinh khi Barista bấm READY để khách đọc cho thu ngân/quầy lấy nước.
 */

import { randomInt } from 'node:crypto';

export const newPickupCode = () =>
  randomInt(0, 1_000_000).toString().padStart(6, '0');
