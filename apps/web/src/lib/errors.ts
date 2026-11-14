import axios from 'axios';

// Lấy thông báo lỗi người dùng đọc được từ lỗi của axios (message của NestJS có thể là chuỗi hoặc mảng)
export function apiErrorMessage(err: unknown, fallback = 'Đã xảy ra lỗi, vui lòng thử lại.'): string {
    if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message;
        if (Array.isArray(message) && message.length) return message.join(', ');
        if (typeof message === 'string' && message) return message;
    }
    if (err instanceof Error && err.message) return err.message;
    return fallback;
}

// Mã HTTP của lỗi axios; không phải lỗi HTTP thì undefined
export function httpStatus(err: unknown): number | undefined {
    return axios.isAxiosError(err) ? err.response?.status : undefined;
}
