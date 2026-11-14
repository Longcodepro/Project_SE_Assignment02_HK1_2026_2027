import { AxiosError } from 'axios';
import { describe, expect, it } from 'vitest';
import { apiErrorMessage, httpStatus } from './errors';

// Lỗi HTTP giống hệt lỗi axios nhận được khi backend trả 4xx
const loiHttp = (status: number, data: unknown) =>
    new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
        status,
        statusText: '',
        headers: {},
        config: {} as never,
        data,
    });

describe('apiErrorMessage', () => {
    it('lấy message dạng chuỗi của backend', () => {
        expect(apiErrorMessage(loiHttp(400, { message: 'Mã nhận hàng không đúng' }))).toBe('Mã nhận hàng không đúng');
    });

    it('nối message dạng mảng (lỗi validate)', () => {
        expect(apiErrorMessage(loiHttp(400, { message: ['a phải là số', 'b không được rỗng'] }))).toBe(
            'a phải là số, b không được rỗng',
        );
    });

    it('lỗi HTTP không có message thì dùng thông điệp của Error', () => {
        expect(apiErrorMessage(loiHttp(500, {}))).toBe('Request failed');
    });

    it('Error thường lấy message; giá trị lạ dùng thông điệp dự phòng', () => {
        expect(apiErrorMessage(new Error('Mất kết nối'))).toBe('Mất kết nối');
        expect(apiErrorMessage('???', 'Dự phòng')).toBe('Dự phòng');
        expect(apiErrorMessage(undefined)).toBe('Đã xảy ra lỗi, vui lòng thử lại.');
    });
});

describe('httpStatus', () => {
    it('trả mã HTTP của lỗi axios, undefined với lỗi khác', () => {
        expect(httpStatus(loiHttp(409, {}))).toBe(409);
        expect(httpStatus(new Error('x'))).toBeUndefined();
    });
});
