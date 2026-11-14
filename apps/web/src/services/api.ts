import axios from "axios";
import { Product, Order, CreatedOrder, AuthResponse, User, LoyaltyInfo, KdsOrder, CashierOrder } from "@/types";

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

    // 1. Đăng ký tài khoản (dùng số điện thoại di động VN)
    register: async (payload: { phone: string; password: string; name?: string; email?: string }): Promise<User> => {
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

    // 2. Đăng nhập lấy JWT Access Token (dùng số điện thoại)
    login: async (payload: { phone: string; password: string }): Promise<AuthResponse> => {
        try {
            const res = await axios.post(`${getApiUrl()}/auth/login`, payload);
            return res.data;
        } catch (error: unknown) {
            let msg = 'Số điện thoại hoặc mật khẩu không chính xác';
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

    // 3b. Lấy chi tiết một sản phẩm
    getProductById: async (id: number): Promise<Product> => {
        try {
            const response = await axios.get(`${getApiUrl()}/products/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Lỗi khi lấy chi tiết sản phẩm #${id}!`, error);
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
            discountAmount: orderRes.data.discountAmount ?? 0,
        };
    },

    // 4b. Thanh toán lại đơn hàng đang ở trạng thái PAYMENT_FAILED (POST /payments)
    payOrder: async (payload: {
        orderId: string;
        paymentMethod: 'WALLET' | 'CARD';
        cardNumber?: string;
    }) => {
        const payIdempotencyKey = `pay_retry_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const paymentBody: { orderId: string; method: 'WALLET' | 'CARD'; cardNumber?: string } = {
            orderId: payload.orderId,
            method: payload.paymentMethod,
        };
        if (payload.paymentMethod === 'CARD') {
            paymentBody.cardNumber = payload.cardNumber || '9704000000000001';
        }

        const res = await axios.post(
            `${getApiUrl()}/payments`,
            paymentBody,
            {
                headers: {
                    'Idempotency-Key': payIdempotencyKey,
                },
            }
        );
        return res.data;
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
            let msg = 'Không thể tải lịch sử đơn hàng từ máy chủ.';
            if (axios.isAxiosError(error) && error.response?.data?.message) {
                const resMsg = error.response.data.message;
                msg = Array.isArray(resMsg) ? resMsg.join(', ') : resMsg;
            } else if (error instanceof Error) {
                msg = error.message;
            }
            throw new Error(msg);
        }
    },

    // 6. Thông tin tích điểm và lịch sử (GET /loyalty/me)
    getLoyalty: async (): Promise<LoyaltyInfo> => {
        try {
            const res = await axios.get(`${getApiUrl()}/loyalty/me`);
            return res.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 401) {
                throw new Error('Vui lòng đăng nhập để xem thông tin tích điểm.');
            }
            let msg = 'Không thể tải thông tin điểm tích lũy.';
            if (axios.isAxiosError(error) && error.response?.data?.message) {
                const resMsg = error.response.data.message;
                msg = Array.isArray(resMsg) ? resMsg.join(', ') : resMsg;
            } else if (error instanceof Error) {
                msg = error.message;
            }
            throw new Error(msg);
        }
    },

    //7.lấy danh sách sản phẩm cho Barista
    getKdsOrders : async(): Promise<KdsOrder[]>=>{
        const res = await axios.get<KdsOrder[]>(`${getApiUrl()}/kds/orders`);
        return res.data;
    },

    //8.cập nhật trạng thái đơn pha chế (kèm version khóa lạc quan)
    updateKdsStatus: async(
        orderId: string,
        status: 'PREPARING' | 'READY',
        version: number
    ): Promise<{id: string; status: string; version: number}> =>{
        const res = await axios.patch(`${getApiUrl()}/kds/orders/${orderId}/status`, {status, version});
        return res.data;
    },

    // 9. Đơn Cashier xử lý được: READY (chờ giao món) và PAID (có thể hủy), cũ nhất lên đầu
    getCashierOrders: async (status?: 'READY' | 'PAID'): Promise<CashierOrder[]> => {
        const res = await axios.get<CashierOrder[]>(`${getApiUrl()}/cashier/orders`, {
            params: status ? { status } : undefined,
        });
        return res.data;
    },

    // 10. Cashier nhập mã khách đọc để giao món: READY -> COMPLETED
    completeOrder: async (orderId: string, pickupCode: string): Promise<{ id: string; status: string; version: number }> => {
        const res = await axios.post(`${getApiUrl()}/cashier/orders/${orderId}/complete`, { pickupCode });
        return res.data;
    },

    // 11. Tạo đơn (chưa thanh toán), có thể kèm mã giảm giá: server tính số tiền giảm và tổng mới
    createOrder: async (payload: {
        items: { productId: string | number; size: string; quantity: number; toppings: string[] }[];
        promoCode?: string;
    }): Promise<CreatedOrder> => {
        const res = await axios.post<CreatedOrder>(
            `${getApiUrl()}/orders`,
            {
                items: payload.items.map((i) => ({
                    productId: Number(i.productId),
                    quantity: i.quantity,
                    size: i.size,
                    toppings: i.toppings,
                })),
                ...(payload.promoCode ? { promoCode: payload.promoCode } : {}),
            },
            { headers: { 'Idempotency-Key': `ord_${Date.now()}_${Math.random().toString(36).substring(2, 10)}` } },
        );
        return res.data;
    },

    // 12. Khách hủy đơn của mình (PENDING, PAYMENT_FAILED, PAID); đơn PAID bắt buộc có lý do
    cancelOrder: async (
        orderId: string,
        version: number,
        reason?: string,
    ): Promise<{ id: string; status: string; version: number; refundedAt: string | null }> => {
        const res = await axios.post(`${getApiUrl()}/orders/${orderId}/cancel`, {
            version,
            ...(reason ? { reason } : {}),
        });
        return res.data;
    },

    // 12b. Bỏ đơn nháp (đơn chưa trả tiền) để trả lại lượt dùng mã; lỗi thì bỏ qua vì chỉ là dọn dẹp
    discardDraftOrder: async (orderId: string): Promise<void> => {
        try {
            const orders = await apiService.getMyOrders();
            const order = orders.find((o) => String(o.id) === orderId);
            if (order && typeof order.version === 'number' && ['PENDING', 'PAYMENT_FAILED'].includes(order.status)) {
                await apiService.cancelOrder(orderId, order.version);
            }
        } catch {
            // Đơn nháp còn sót lại không ảnh hưởng người dùng
        }
    },

};
