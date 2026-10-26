'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { apiService } from '@/services/api';
import { Order, OrderStatus } from '@/types';
import { Clock, Coffee, CheckCircle2, AlertCircle, ChevronRight, RefreshCw, PackageCheck, ChefHat} from 'lucide-react';

export default function OrderHistoryPage(){
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string|null>(null);
    //cooldown để tránh request quá trớn
    const [isCoolDown, setIsCoolDown] = useState<boolean>(false)

    const handleRefresh = ()=>{
        if(isCoolDown || loading) return;

        fetchOrders();
        setIsCoolDown(true);

        //3 giây mới cho bấm lại
        setTimeout(()=>{
            setIsCoolDown(false);
        },3000);
    };

    //gọi API lấy danh sách đơn
    const fetchOrders = async()=>{
        setLoading(true);
        setError(null);

        try{
            const data = await apiService.getMyOrders();
            setOrders(data);
        }catch(err: unknown){
            const msg=err instanceof Error ? err.message :'không thể tạo lịch sử đơn hàng';
            setError(msg);
        }finally{
            setLoading(false);
        }
    };

    useEffect(()=>{
        fetchOrders();
    },[])

    //hàm hiển thị màu sắc theo trạng thái đơn
    const renderStatusBadge = (status: OrderStatus) =>
    {
        switch(status){
            case 'PREPARING': return(
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                    <ChefHat className="w-3.5 h-3.5 text-amber-700" />
                    Đang pha chế
                </span>
            );

            case 'READY': return(
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-gray-500" />
                    Hoàn thành
                </span>
            );

            case 'PAID': return(
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    Đã thanh toán

                </span>
            );

            case 'CANCELLED':

            case 'PAYMENT_FAILED': return(
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                    Lỗi thanh toán
                </span>
            );

            default: return(
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200">
                    {status}
                </span>
            );
        }
    };

    return(
        <div className="min-h-screen bg-[#FAF7F2] text-gray-900 font-sans flex flex-col">
            <Navbar />

            <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
                {/* TIÊU ĐỀ TRANG */}
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-amber-200/60">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-amber-950 flex items-center gap-2.5">
                            <Clock className="w-7 h-7 text-amber-700" />
                            Lịch sử đơn hàng
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                            Theo dõi tiến độ pha chế và xem lại các hóa đơn đã đặt tại BrewLite
                        </p>
                    </div>

                    <button
                        onClick={handleRefresh}
                        disabled={isCoolDown||loading}
                        title={isCoolDown ? "Vui lòng đợi 3 giây..." : "Tải lại danh sách"}
                        className={`p-2.5 rounded-xl transition ${isCoolDown ? 'opacity-40 cursor-not-allowed' : 'hover:bg-amber-100/60 text-amber-800'}`}

                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* 1. TRẠNG THÁI ĐANG TẢI (LOADING) */}
                {loading && (
                    <div className="py-20 flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-800 rounded-full animate-spin mb-4"></div>
                        <p className="text-sm font-semibold text-gray-600">Đang tải danh sách đơn hàng...</p>
                    </div>
                )}

                {/* 2. TRẠNG THÁI LỖI (ERROR) */}
                {!loading && error && (
                    <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center max-w-md mx-auto my-8">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-red-900 mb-1">Không thể tải dữ liệu</h3>
                        <p className="text-xs text-red-600 mb-6">{error}</p>
                        <button
                            onClick={fetchOrders}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition"
                        >
                            Thử lại ngay
                        </button>
                    </div>
                )}

                {/* 3. TRẠNG THÁI RỖNG (EMPTY) */}
                {!loading && !error && orders.length === 0 && (
                    <div className="bg-white border border-amber-100 rounded-3xl p-12 text-center max-w-md mx-auto my-8 shadow-sm">
                        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Coffee className="w-10 h-10 text-amber-600 stroke-[1.5]" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 mb-2">Chưa có đơn hàng nào</h3>
                        <p className="text-xs text-gray-500 mb-6">
                            Bạn chưa đặt món nước nào tại quán. Hãy khám phá thực đơn cà phê thơm ngon của BrewLite nhé!
                        </p>
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center gap-2 bg-amber-900 hover:bg-amber-800 text-white font-bold py-3 px-6 rounded-2xl text-sm transition shadow-md"
                        >
                            <span>Khám phá thực đơn</span>
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                )}

                {/* 4. DANH SÁCH CÁC ĐƠN HÀNG (SUCCESS) */}
                {!loading && !error && orders.length > 0 && (
                    <div className="space-y-5">
                        {orders.map((order) => (
                            <div
                                key={order.id}
                                className="bg-white rounded-3xl border border-amber-100/80 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow"
                            >
                                {/* Header thẻ đơn: Mã đơn, Thời gian, Badge trạng thái */}
                                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-black text-amber-950 text-base">
                                                #{order.id}
                                            </span>
                                            <span className="text-xs text-gray-400">•</span>
                                            <span className="text-xs text-gray-500">
                                                {new Date(order.createdAt).toLocaleString('vi-VN', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        {renderStatusBadge(order.status)}
                                    </div>
                                </div>

                                {/* Thông báo tiến độ đặc biệt cho đơn Đang pha chế hoặc Mời nhận */}
                                {order.status === 'PREPARING' && (
                                    <div className="mt-3.5 bg-amber-50/70 border border-amber-200/60 rounded-xl px-3.5 py-2 text-xs font-medium text-amber-900 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                                        <span>Barista đang pha chế món của bạn, vui lòng đợi ít phút nhé!</span>
                                    </div>
                                )}
                                {order.status === 'READY' && (
                                    <div className="mt-3.5 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2 text-xs font-bold text-emerald-800 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                        <span>Cà phê của bạn đã sẵn sàng! Mời bạn tới quầy nhận nước.</span>
                                    </div>
                                )}

                                {/* Danh sách món nước trong đơn */}
                                <div className="divide-y divide-gray-50 py-2">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="py-2.5 flex items-center justify-between text-xs sm:text-sm">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-6 h-6 rounded-lg bg-amber-100/60 text-amber-900 font-bold flex items-center justify-center text-xs">
                                                    {item.quantity}x
                                                </div>
                                                <div>
                                                    <span className="font-bold text-gray-800">
                                                        {item.product?.name || `Món nước #${item.productId}`}
                                                    </span>
                                                    <span className="text-gray-400 text-xs ml-1.5 font-medium">
                                                        (Size {item.size})
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="font-semibold text-gray-700">
                                                {item.lineTotal.toLocaleString('vi-VN')}đ
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Footer thẻ đơn: Tổng tiền */}
                                <div className="pt-3 border-t border-dashed border-amber-200/80 flex items-center justify-between">
                                    <span className="text-xs font-medium text-gray-500">Tổng thanh toán:</span>
                                    <span className="text-base sm:text-lg font-black text-amber-900">
                                        {order.total.toLocaleString('vi-VN')}đ
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}    
            </main>
        </div>
    );
}


