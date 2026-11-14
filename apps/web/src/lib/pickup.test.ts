import { describe, expect, it } from 'vitest';
import { formatPickupCode, isValidPickupCode, sanitizePickupInput } from './pickup';

describe('sanitizePickupInput', () => {
    it('bỏ ký tự không phải số và cắt còn 6 chữ số', () => {
        expect(sanitizePickupInput('03a8-41 7')).toBe('038417');
        expect(sanitizePickupInput('12345678')).toBe('123456');
        expect(sanitizePickupInput('abc')).toBe('');
    });

    it('giữ số 0 đứng đầu', () => {
        expect(sanitizePickupInput('000123')).toBe('000123');
    });
});

describe('isValidPickupCode', () => {
    it.each(['038417', '000000', '999999'])('%s hợp lệ', (code) => {
        expect(isValidPickupCode(code)).toBe(true);
    });

    it.each(['', '12345', '1234567', '12a456', ' 38417'])('"%s" không hợp lệ', (code) => {
        expect(isValidPickupCode(code)).toBe(false);
    });
});

describe('formatPickupCode', () => {
    it('chia hai nhóm ba số', () => {
        expect(formatPickupCode('038417')).toBe('038 417');
    });

    it('giá trị không phải mã 6 số giữ nguyên', () => {
        expect(formatPickupCode('123')).toBe('123');
    });
});
