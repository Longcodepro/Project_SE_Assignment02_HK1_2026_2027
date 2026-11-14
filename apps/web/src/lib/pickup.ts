// Mã nhận hàng: đúng 6 chữ số, có thể bắt đầu bằng 0 nên luôn là chuỗi
export const PICKUP_CODE_LENGTH = 6;

// Giữ lại tối đa 6 chữ số khi nhân viên gõ hoặc dán mã
export const sanitizePickupInput = (raw: string) => raw.replace(/\D/g, '').slice(0, PICKUP_CODE_LENGTH);

export const isValidPickupCode = (code: string) => new RegExp(`^\\d{${PICKUP_CODE_LENGTH}}$`).test(code);

// 038417 -> "038 417" cho khách dễ đọc to với nhân viên
export const formatPickupCode = (code: string) =>
    isValidPickupCode(code) ? `${code.slice(0, 3)} ${code.slice(3)}` : code;
