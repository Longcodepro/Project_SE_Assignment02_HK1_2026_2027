import axios from "axios";
import { Product, Order } from "@/types";

const API_URL=process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

axios.interceptors.response.use(
    (response)=>response,
    (error)=>{
        //nếu backend trả về lỗi 429
        if(error.response?.status===429){
            return Promise.reject(
                new Error('Hệ thống đang bận do có quá nhiều yêu cầu. Vui lòng đợi 30 giây rồi thử lại nhé!')
            );
        }
        return Promise.reject(error)
    }
)
export const apiService={
    getProducts :async (): Promise<Product[]>=>{
        try{
            const response = await axios.get(`${API_URL}/products`);
            return response.data;
        }catch(error){
            console.error("lỗi khi lấy danh sách sản phẩm!")
            throw error;
        }
    },

    createOrderAndPay: async (orderPayload: {
        items: {
            productId: string | number;
            size: string;
            quantity: number;
            toppings: string[]; 
        }[];
        paymentMethod: 'WALLET' | 'CARD'
    })=>
    {
        //1.gọi tạo đơn POST /order (endpoint order)
        const orderRes = await axios.post (`${API_URL}/orders`, {items: orderPayload.items});
        const orderId = orderRes.data.id;

        //2.gọi thanh toán POST /payment (endpoint payment)
        const paymentRes = await axios.post(`${API_URL}/payments`, {
            orderId,
            method: orderPayload.paymentMethod,
            idempotencyKey:`pay_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        });

        return{
            orderId,
            status: paymentRes.data.status, //'PAID' hoặc 'PAYMENT_FAILED'
            total: orderRes.data.total,
        };
    },

    //endpoint lịch sử đơn hàng
    getMyOrders: async (): Promise<Order[]> => {
        try{
            const res = await axios.get (`${API_URL}/orders/me`);
            return res.data;
        }catch (error) {
            if (axios.isAxiosError(error)&&error.response?.status===429)
            {
                throw error;
            }
            console.warn("Backend chưa có /order/me, sử dụng dữ liệu giả lập", error);
            //dữ liệu giả để chạy test
            return[
                {
                    id: "ord_1042",
                    status: "PREPARING",
                    total: 75000,
                    createdAt: new Date(Date.now()-5*60000).toISOString(),
                    items: [
                        {
                            productId: "1",
                            product: { id: 1, name: "Cà phê sữa đá Tây Nguyên", price: 29000, imageUrl: "", stock: 10 },
                            size: "M",
                            quantity: 1,
                            lineTotal: 35000
                        },
                        {
                            productId: "3",
                            product: { id: 3, name: "Trà sữa Ô Long nướng", price: 35000, imageUrl: "", stock: 10 },
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
                            productId: "2",
                            product: { id: 2, name: "Bạc xỉu truyền thống", price: 29000, imageUrl: "", stock: 10 },
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
                            productId: "1",
                            product: { id: 1, name: "Cà phê sữa đá Tây Nguyên", price: 29000, imageUrl: "", stock: 10 },
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