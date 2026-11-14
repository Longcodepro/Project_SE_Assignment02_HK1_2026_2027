export interface ProductCategory {
    id: number;
    name: string;
}

// Thực thể sản phẩm
export interface Product {
    id: number | string;
    name: string;
    price: number;
    imageUrl: string;
    isAvailable?: boolean;
    stock?: number;
    category?: string | ProductCategory;
}

export type UserRole = 'CUSTOMER' | 'BARISTA' | 'CASHIER' | 'MANAGER';
export interface User {
    id?: string | number;
    phone: string;
    role?: UserRole;
    email?: string;
    name?: string;
    loyaltyPoints?: number;
}

export interface LoyaltyHistoryItem {
    orderId: string;
    pointsEarned: number;
    createdAt: string;
}

export interface LoyaltyInfo {
    balance: number;
    history: LoyaltyHistoryItem[];
}

export interface AuthResponse {
    accessToken: string;
    user?: User;
}

export interface OrderItem {
    id?: string | number;
    orderId?: string;
    productId: string | number;
    product?: Product;
    productName?: string;
    unitPrice?: number;
    toppings?: string[];
    size: 'S' | 'M' | 'L';
    quantity: number;
    lineTotal?: number;
}

export type OrderStatus =
    | 'PENDING'
    | 'PAID'
    | 'PREPARING'
    | 'READY'
    | 'COMPLETED'
    | 'PAYMENT_FAILED'
    | 'CANCELLED';

export interface Order {
    id: string | number;
    total: number;
    status: OrderStatus;
    createdAt: string;
    items: OrderItem[];
    // Số phiên bản của đơn, gửi lại khi đổi trạng thái (khóa lạc quan)
    version?: number;
    // Mã nhận hàng 6 số, chỉ có khi đơn READY
    pickupCode?: string | null;
}

export interface Payment {
    id: string | number;
    orderId: string;
    idempotencyKey: string;
    amount: number;
    method: 'WALLET' | 'CARD';
    status: 'PAID' | 'PAYMENT_FAILED';
}

export interface CartItem {
    cartItemId: string | number; // mã của từng loại sản phẩm trong Cart
    product: Product;
    size: 'S' | 'M' | 'L';
    toppings: string[];
    quantity: number;
    unitPrice: number; // giá của ly nước khi được add thêm topping
}

export interface KdsItem{
    productName: string;
    quantity: number;
    size: 'S' | 'M' | 'L';
    toppings: string[];
}

// Đơn trên màn hình của Cashier (GET /cashier/orders): READY chờ giao, PAID có thể hủy; không có mã nhận hàng
export interface CashierOrder {
    id: string;
    status: 'READY' | 'PAID';
    version: number;
    total: number;
    createdAt: string;
    items: KdsItem[];
}

export interface KdsOrder{
    id: string;
    status: 'PAID' | 'PREPARING';
    version: number;
    createdAt: string;
    items: KdsItem[];
}
