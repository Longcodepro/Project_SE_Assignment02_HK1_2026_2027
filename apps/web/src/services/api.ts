import axios from "axios";
import { Product, Order, AuthResponse, User } from "@/types";

// Lấy URL Backend động: ưu tiên custom URL trong localStorage (để test trên mobile / demo từ xa), sau đó đến biến môi trường
export const getApiUrl = (): string => {
    if (typeof window !== 'undefined') {
        const customUrl = localStorage.getItem('brewlite_api_url');
        if (customUrl && customUrl.trim()) {
            return customUrl.trim().replace(/\/+$/, '');
        }
    }
    return (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/+$/, '');
};

export const setCustomApiUrl = (url: string): void => {
    if (typeof window !== 'undefined') {
        const clean = url.trim().replace(/\/+$/, '');
        if (clean) {
            localStorage.setItem('brewlite_api_url', clean);
        } else {
            localStorage.removeItem('brewlite_api_url');
        }
    }
};

export const resetCustomApiUrl = (): void => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('brewlite_api_url');
    }
};

export const isCustomApiUrlSet = (): boolean => {
    if (typeof window !== 'undefined') {
        return !!localStorage.getItem('brewlite_api_url');
    }
    return false;
};

// Tự động đính kèm JWT Bearer Token vào mọi request gửi sang Backend
axios.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('brewlite_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

axios.interceptors.response.use(
    (response) => response,
    (error) => {
        // Nếu backend trả về lỗi Rate Limit 429
        if (error.response?.status === 429) {
            return Promise.reject(
                new Error('Hệ thống đang bận do có quá nhiều yêu cầu. Vui lòng đợi 30 giây rồi thử lại nhé!')
            );
        }
        return Promise.reject(error);
    }
);

export const apiService = {
    // Kiểm tra kết nối tới Backend (Ping health-check)
    testConnection: async (targetUrl?: string): Promise<{ success: boolean; message: string }> => {
        const url = (targetUrl || getApiUrl()).replace(/\/+$/, '');
        try {
            const res = await axios.get(`${url}/`, { timeout: 6000 });
            if (res.status === 200) {
                return { success: true, message: 'Kết nối máy chủ Backend thành công (200 OK)!' };
            }
            return { success: false, message: `Máy chủ phản hồi với mã trạng thái ${res.status}` };
        } catch (err: unknown) {
            let msg = 'Không thể kết nối đến máy chủ';
            if (axios.isAxiosError(err)) {
                if (err.code === 'ECONNABORTED') {
                    msg = 'Hết thời gian chờ phản hồi (Timeout)';
                } else if (err.message) {
                    msg = err.message;
                }
            } else if (err instanceof Error) {
                msg = err.message;
            }
            return { success: false, message: msg };
        }
    },

    // 1. Đăng ký tài khoản
    register: async (payload: { email: string; password: string; name?: string }): Promise<User> => {
        try {
            const res = await axios.post(`${getApiUrl()}/auth/register`, payload);
            return res.data;
        } catch (error: unknown) {
            let msg = 'Đăng ký tài khoản không thành công';
            if (axios.isAxiosError(error) && error.response?.data?.message) {
                const resMsg = error.response.data.message;
                msg = Array.isArray(resMsg) ? resMsg.join(', ') : resMsg;
            } else if (error instanceof Error) {
                msg = error.message;
            }
            throw new Error(msg);
        }
    },

    // 2. Đăng nhập lấy JWT Access Token
    login: async (payload: { email: string; password: string }): Promise<AuthResponse> => {
        try {
            const res = await axios.post(`${getApiUrl()}/auth/login`, payload);
            return res.data;
        } catch (error: unknown) {
            let msg = 'Email hoặc mật khẩu không chính xác';
            if (axios.isAxiosError(error) && error.response?.data?.message) {
                const resMsg = error.response.data.message;
                msg = Array.isArray(resMsg) ? resMsg.join(', ') : resMsg;
            } else if (error instanceof Error) {
                msg = error.message;
            }
            throw new Error(msg);
        }
    },

    // 3. Lấy danh mục sản phẩm (Menu)
    getProducts: async (): Promise<Product[]> => {
        try {
            const response = await axios.get(`${getApiUrl()}/products`);
            return response.data;
        } catch (error) {
            console.error("Lỗi khi lấy danh sách sản phẩm!", error);
            throw error;
        }
    },

    // 4. Tạo đơn và thanh toán (POST /orders và POST /payments)
    createOrderAndPay: async (orderPayload: {
        items: {
            productId: string | number;
            size: string;
            quantity: number;
            toppings: string[]; 
        }[];
        paymentMethod: 'WALLET' | 'CARD';
        cardNumber?: string;
    }) => {
        const orderIdempotencyKey = `ord_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const payIdempotencyKey = `pay_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        // 1. Gọi tạo đơn POST /orders (chuẩn hóa productId dạng số)
        const orderRes = await axios.post(
            `${getApiUrl()}/orders`,
            {
                items: orderPayload.items.map((i) => ({
                    productId: Number(i.productId),
                    quantity: i.quantity,
                    size: i.size,
                    toppings: i.toppings,
                })),
            },
            {
                headers: {
                    'Idempotency-Key': orderIdempotencyKey,
                },
            }
        );
        const orderId = orderRes.data.id;

        // 2. Chuẩn bị body thanh toán chuẩn (Backend chỉ nhận orderId, method và cardNumber)
        const paymentBody: { orderId: string; method: 'WALLET' | 'CARD'; cardNumber?: string } = {
            orderId,
            method: orderPayload.paymentMethod,
        };
        if (orderPayload.paymentMethod === 'CARD') {
            paymentBody.cardNumber = orderPayload.cardNumber || '9704000000000001';
        }

        // Gọi thanh toán POST /payments kèm Idempotency-Key trong Header
        const paymentRes = await axios.post(
            `${getApiUrl()}/payments`,
            paymentBody,
            {
                headers: {
                    'Idempotency-Key': payIdempotencyKey,
                },
            }
        );

        return {
            orderId,
            status: paymentRes.data.status, // 'PAID' hoặc 'PAYMENT_FAILED'
            total: orderRes.data.total,
        };
    },

    // 5. Lịch sử đơn hàng (GET /orders/me)
    getMyOrders: async (): Promise<Order[]> => {
        try {
            const res = await axios.get(`${getApiUrl()}/orders/me`);
            return res.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 429) {
                throw error;
            }
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                throw new Error('Vui lòng đăng nhập để xem lịch sử đơn hàng của bạn.');
            }
            console.warn("Backend chưa kết nối được, sử dụng dữ liệu giả lập:", error);
            // Dữ liệu giả lập dự phòng khi backend offline
            return [
                {
                    id: "ord_1042",
                    status: "PREPARING",
                    total: 75000,
                    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
                    items: [
                        {
                            productId: 1,
                            productName: "Cà phê sữa đá Tây Nguyên",
                            unitPrice: 35000,
                            size: "M",
                            quantity: 1,
                            lineTotal: 35000
                        },
                        {
                            productId: 3,
                            productName: "Trà sữa Ô Long nướng",
                            unitPrice: 40000,
                            size: "L",
                            quantity: 1,
                            lineTotal: 40000
                        },
                    ]
                },
                {
                    id: "ord_1038",
                    status: "READY",
                    total: 29000,
                    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
                    items: [
                        {
                            productId: 2,
                            productName: "Bạc xỉu truyền thống",
                            unitPrice: 29000,
                            size: "S",
                            quantity: 1,
                            lineTotal: 29000
                        }
                    ]
                },
                {
                    id: "ord_0995",
                    status: "COMPLETED",
                    total: 64000,
                    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
                    items: [
                        {
                            productId: 1,
                            productName: "Cà phê sữa đá Tây Nguyên",
                            unitPrice: 32000,
                            size: "M",
                            quantity: 2,
                            lineTotal: 64000
                        }
                    ]
                }
            ];
        }
    },
};
