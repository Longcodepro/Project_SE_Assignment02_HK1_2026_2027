import axios from "axios";
import { Product, Order, CreatedOrder, AuthResponse, User, LoyaltyInfo, KdsOrder, CashierOrder, AdminCategory, AdminProduct, AdminTopping, SizeSurcharge, Ingredient, CreateReceiptPayload, ProductRecipe, ToppingRecipe, StaffUser, CreateStaffPayload, AdminPromotion, CreatePromotionPayload, ReportData, IngredientReceipt, MenuOptions} from "@/types";

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

        // Lấy phụ thu size và danh sách topping đang bán công khai từ Database
    getMenuOptions: async (): Promise<MenuOptions> => {
        const res = await axios.get(`${getApiUrl()}/menu-options`);
        return res.data;
    },

    // 12a. Cashier hủy đơn đã thanh toán (PAID) tại quầy, bắt buộc có lý do
    cancelCashierOrder: async (
        orderId: string,
        version: number,
        reason: string,
    ): Promise<{ id: string; status: string; version: number; refundedAt: string | null }> => {
        const res = await axios.post(`${getApiUrl()}/cashier/orders/${orderId}/cancel`, { version, reason });
        return res.data;
    },

    // 12c. Đánh giá 1-5 sao kèm nhận xét cho đơn COMPLETED của mình, mỗi đơn một lần
    reviewOrder: async (
        orderId: string,
        stars: number,
        comment?: string,
    ): Promise<{ id: number; orderId: string; stars: number; comment: string | null; createdAt: string }> => {
        const res = await axios.post(`${getApiUrl()}/orders/${orderId}/review`, {
            stars,
            ...(comment ? { comment } : {}),
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

    // --- CỤM API QUẢN TRỊ MENU (TASK S4.3) ---
    getAdminCategories: async (token: string): Promise<AdminCategory[]> => {
        const res = await axios.get(`${getApiUrl()}/admin/categories`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    },

    createCategory: async (name: string, token: string): Promise<AdminCategory> => {
        const res = await axios.post(`${getApiUrl()}/admin/categories`, { name }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    },

    updateCategory: async (id: number, data: { name?: string; isActive?: boolean }, token: string) => {
        const res = await axios.patch(`${getApiUrl()}/admin/categories/${id}`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    },

    createProduct: async (payload: {
        name: string;
        price: number;
        categoryId: number;
        description?: string;
        imageUrl: string;
    }, token: string): Promise<AdminProduct> => {
        const res = await axios.post(`${getApiUrl()}/admin/products`, payload, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    },

    getAdminProducts: async (token: string): Promise<AdminProduct[]> => {
        const res = await axios.get(`${getApiUrl()}/admin/products`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    },

    updateProduct: async (id: number, data: Partial<AdminProduct>, token: string) => {
        const res = await axios.patch(`${getApiUrl()}/admin/products/${id}`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    },

    getAdminToppings: async (token: string): Promise<AdminTopping[]> => {
        const res = await axios.get(`${getApiUrl()}/admin/toppings`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    },

    createTopping: async (
        data: { code: string; name: string; price: number },
        token: string
    ): Promise<AdminTopping> => {
        try {
            const res = await axios.post(`${getApiUrl()}/admin/toppings`, data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data;
        } catch (error: unknown) {
            let msg = 'Lỗi khi tạo topping mới';
            if (axios.isAxiosError(error) && error.response?.data?.message) {
                const resMsg = error.response.data.message;
                msg = Array.isArray(resMsg) ? resMsg.join(', ') : resMsg;
            } else if (error instanceof Error) {
                msg = error.message;
            }
            throw new Error(msg);
        }
    },

    updateTopping: async (code: string, data: { name?: string; price?: number; isAvailable?: boolean }, token: string) => {
        const res = await axios.patch(`${getApiUrl()}/admin/toppings/${code}`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    },

    getAdminSizes: async (token: string): Promise<SizeSurcharge[]> => {
        const res = await axios.get(`${getApiUrl()}/admin/sizes`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    },

    updateSize: async (size: string, surcharge: number, token: string) => {
        const res = await axios.patch(`${getApiUrl()}/admin/sizes/${size}`, { surcharge }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    },

    // 1. Lấy danh sách toàn bộ nguyên liệu kèm số lượng tồn kho
    getAdminIngredients: async (token: string): Promise<Ingredient[]> => {
        const res = await axios.get(`${getApiUrl()}/admin/ingredients`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    },

    createIngredient: async (
        data: { name: string; unit: 'G' | 'ML' | 'PIECE'; minStock?: number },
        token: string
    ): Promise<Ingredient> => {
        const res = await axios.post(`${getApiUrl()}/admin/ingredients`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    },

    // 2c. Sửa thông tin nguyên liệu (đổi tên hoặc đổi ngưỡng minStock)
    updateIngredient: async (
        id: number,
        data: { name?: string; minStock?: number },
        token: string
    ): Promise<Ingredient> => {
        const res = await axios.patch(`${getApiUrl()}/admin/ingredients/${id}`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    },

    // 2. Lấy danh sách nguyên liệu sắp hết (stock <= minStock, thiếu nhiều nhất lên đầu)
    getAdminInventoryAlerts: async (token: string): Promise<Ingredient[]> => {
        const res = await axios.get(`${getApiUrl()}/admin/ingredients/alerts`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    },

    // 3. Nhập kho cho một nguyên liệu (ghi phiếu nhập và tự động cộng dồn tồn kho)
    createIngredientReceipt: async (
        ingredientId: number,
        payload: CreateReceiptPayload,
        token: string
    ) => {
        const res = await axios.post(
            `${getApiUrl()}/admin/ingredients/${ingredientId}/receipts`,
            payload,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    },

    // Lấy danh sách lịch sử phiếu nhập kho của một nguyên liệu (mới nhất trước)
    getIngredientReceipts: async (
        ingredientId: number,
        token: string,
        limit: number = 50
    ): Promise<IngredientReceipt[]> => {
        const res = await axios.get(
            `${getApiUrl()}/admin/ingredients/${ingredientId}/receipts?limit=${limit}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return res.data;
    },

     // 4. Xem công thức pha chế của một món theo từng size (S, M, L)
    getProductRecipe: async (productId: number, token: string): Promise<ProductRecipe> => {
        const res = await axios.get(`${getApiUrl()}/admin/products/${productId}/recipe`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    },

    // Cập nhật toàn bộ công thức định lượng của món theo các size
    updateProductRecipe: async (
        productId: number,
        items: Array<{ size: 'S' | 'M' | 'L'; ingredientId: number; quantity: number }>,
        token: string
    ): Promise<ProductRecipe> => {
        try {
            const res = await axios.put(
                `${getApiUrl()}/admin/products/${productId}/recipe`,
                { items },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return res.data;
        } catch (error: unknown) {
            let msg = 'Lỗi khi cập nhật công thức món';
            if (axios.isAxiosError(error) && error.response?.data?.message) {
                const resMsg = error.response.data.message;
                msg = Array.isArray(resMsg) ? resMsg.join(', ') : resMsg;
            } else if (error instanceof Error) {
                msg = error.message;
            }
            throw new Error(msg);
        }
    },

    // 5. Xem công thức định lượng của 1 loại topping
    getToppingRecipe: async (code: string, token: string): Promise<ToppingRecipe> => {
        const res = await axios.get(`${getApiUrl()}/admin/toppings/${code}/recipe`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    },

    // Cập nhật/thay thế công thức định lượng của topping
    updateToppingRecipe: async (
        code: string,
        items: Array<{ ingredientId: number; quantity: number }>,
        token: string
    ): Promise<ToppingRecipe> => {
        try {
            const res = await axios.put(
                `${getApiUrl()}/admin/toppings/${code}/recipe`,
                { items },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            return res.data;
        } catch (error: unknown) {
            let msg = 'Lỗi khi cập nhật công thức topping';
            if (axios.isAxiosError(error) && error.response?.data?.message) {
                const resMsg = error.response.data.message;
                msg = Array.isArray(resMsg) ? resMsg.join(', ') : resMsg;
            } else if (error instanceof Error) {
                msg = error.message;
            }
            throw new Error(msg);
        }
    },

    

    // ==========================================
    // QUẢN TRỊ VIÊN: NHÂN SỰ, VOUCHER, BÁO CÁO (S4.10)
    // ==========================================
    // 1. Nhân sự
    getAdminStaff: async (token: string): Promise<StaffUser[]> => {
        const res = await axios.get(`${getApiUrl()}/admin/staff`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    },

    createStaff: async (data: CreateStaffPayload, token: string): Promise<StaffUser> => {
        const res = await axios.post(`${getApiUrl()}/admin/staff`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    },

    updateStaff: async (phone: string, data: { role?: 'BARISTA' | 'CASHIER'; isLocked?: boolean }, token: string) => {
        const res = await axios.patch(`${getApiUrl()}/admin/staff/${phone}`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    },

      // 2. Quản lý Voucher (Mã giảm giá)
    getAdminPromotions: async (token: string): Promise<AdminPromotion[]> => {
        const res = await axios.get(`${getApiUrl()}/admin/promotions`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    },

    createPromotion: async (data: CreatePromotionPayload, token: string): Promise<AdminPromotion> => {
        const res = await axios.post(`${getApiUrl()}/admin/promotions`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    },

    updatePromotion: async (id: number, data: { isActive?: boolean }, token: string) => {
        const res = await axios.patch(`${getApiUrl()}/admin/promotions/${id}`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    },

    // 3. Báo cáo doanh thu & sản lượng
    getAdminReports: async (groupBy: 'day' | 'week' | 'month', token: string): Promise<ReportData> => {
        const res = await axios.get(`${getApiUrl()}/admin/reports?groupBy=${groupBy}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data;
    },
    
};
