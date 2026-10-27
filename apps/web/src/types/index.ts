// Thực thể sản phẩm
export interface Product {
    id: number | string;
    name: string;
    price: number;
    imageUrl: string;
    stock?: number;
    category?: string;
}

export interface User {
    id: string | number;
    email: string;
    name?: string;
    loyaltyPoints?: number;
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
