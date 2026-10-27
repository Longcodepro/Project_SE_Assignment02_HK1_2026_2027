'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { apiService } from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';
import { Order, OrderStatus } from '@/types';
import { Clock, Coffee, CheckCircle2, AlertCircle, ChevronRight, RefreshCw, ChefHat, LogIn } from 'lucide-react';

export default function OrderHistoryPage(){
    const isClient = useSyncExternalStore(() => () => {}, () => true, () => false);
    const { token, openAuthModal } = useAuthStore();

    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    // Cooldown để tránh spam refresh liên tục
    const [isCoolDown, setIsCoolDown] = useState<boolean>(false);

    // Gọi API lấy danh sách đơn thật
    const fetchOrders = async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await apiService.getMyOrders();
            setOrders(data);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Không thể tải lịch sử đơn hàng';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        if (isCoolDown || loading || !token) return;

        void fetchOrders();
        setIsCoolDown(true);

        // 3 giây mới cho bấm lại
        setTimeout(() => {
            setIsCoolDown(false);
        }, 3000);
    };

    useEffect(() => {
        if (!token) return;

        let isMounted = true;
        const load = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await apiService.getMyOrders();
                if (isMounted) setOrders(data);
            } catch (err: unknown) {
                if (isMounted) {
                    const msg = err instanceof Error ? err.message : 'Không thể tải lịch sử đơn hàng';
                    setError(msg);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        void load();

        return () => {
            isMounted = false;
        };
    }, [token]);

    // Hàm hiển thị màu sắc theo trạng thái đơn
    const renderStatusBadge = (status: OrderStatus) => {
        switch (status) {
            case 'PREPARING': return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse">
                    <ChefHat className="w-3.5 h-3.5 text-amber-700" />
                    Đang pha chế
                </span>
            );

            case 'READY': return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Sẵn sàng nhận
                </span>
            );

            case 'COMPLETED': return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-gray-500" />
                    Hoàn thành
                </span>
            );

            case 'PAID': return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    Đã thanh toán
                </span>
            );

            case 'CANCELLED':
            case 'PAYMENT_FAILED': return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                    Lỗi thanh toán
                </span>
            );

            default: return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200">
                    {status}
                </span>
            );
        }
    };

    return (
        <div className="min-h-screen bg-[#FAF7F2] text-gray-900 font-sans flex flex-col">
            <Navbar />

            <main className="flex-1 max-w-4xl w-full mx-auto px-3.5 sm:px-6 py-5 sm:py-8">
                {/* TIÊU ĐỀ TRANG */}
                <div className="flex items-center justify-between mb-5 sm:mb-8 pb-3 sm:pb-4 border-b border-amber-200/60">
                    <div>
                        <h1 className="text-xl sm:text-3xl font-black text-amber-950 flex items-center gap-2">
                            <Clock className="w-5 h-5 sm:w-7 sm:h-7 text-amber-700" />
                            Lịch sử đơn hàng
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                            Theo dõi tiến độ pha chế và các hóa đơn đã đặt tại BrewLite
                        </p>
                    </div>

                    <button
                        onClick={handleRefresh}
                        disabled={isCoolDown || loading || !token}
                        title={isCoolDown ? "Vui lòng đợi 3 giây..." : "Tải lại danh sách"}
                        className={`p-2 sm:p-2.5 rounded-xl transition ${
                            isCoolDown || !token ? 'opacity-40 cursor-not-allowed' : 'hover:bg-amber-100/60 text-amber-800'
                        }`}
                    >
                        <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* 1. TRƯỜNG HỢP CHƯA ĐĂNG NHẬP */}
                {isClient && !token && (
                    <div className="bg-white border border-amber-100 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center max-w-md mx-auto my-6 sm:my-8 shadow-sm">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 text-amber-800">
                            <LogIn className="w-8 h-8 sm:w-10 sm:h-10 stroke-[1.5]" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-1.5 sm:mb-2">Bạn chưa đăng nhập</h3>
                        <p className="text-xs text-gray-500 mb-5 sm:mb-6">
                            Vui lòng đăng nhập tài khoản để tra cứu lịch sử các đơn hàng và trạng thái pha chế thực tế của bạn tại quán.
                        </p>
                        <button
                            type="button"
                            onClick={() => openAuthModal('login')}
                            className="inline-flex items-center justify-center gap-2 bg-amber-900 hover:bg-amber-800 text-white font-bold py-2.5 sm:py-3 px-5 sm:px-6 rounded-xl sm:rounded-2xl text-xs sm:text-sm transition shadow-md"
                        >
                            <LogIn className="w-4 h-4" />
                            <span>Đăng nhập tài khoản</span>
                        </button>
                    </div>
                )}

                {/* 2. TRẠNG THÁI ĐANG TẢI (LOADING) */}
                {token && loading && (
                    <div className="py-16 sm:py-20 flex flex-col items-center justify-center text-center">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-amber-200 border-t-amber-800 rounded-full animate-spin mb-3 sm:mb-4"></div>
                        <p className="text-xs sm:text-sm font-semibold text-gray-600">Đang tải danh sách đơn hàng...</p>
                    </div>
                )}

                {/* 3. TRẠNG THÁI LỖI (ERROR) */}
                {token && !loading && error && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center max-w-md mx-auto my-6 sm:my-8">
                        <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-500 mx-auto mb-2 sm:mb-3" />
                        <h3 className="text-base sm:text-lg font-bold text-red-900 mb-1">Không thể tải dữ liệu</h3>
                        <p className="text-xs text-red-600 mb-4 sm:mb-6">{error}</p>
                        <button
                            onClick={fetchOrders}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 sm:py-2.5 px-5 sm:px-6 rounded-xl text-xs sm:text-sm transition"
                        >
                            Thử lại ngay
                        </button>
                    </div>
                )}

                {/* 4. TRẠNG THÁI RỖNG (EMPTY) */}
                {token && !loading && !error && orders.length === 0 && (
                    <div className="bg-white border border-amber-100 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center max-w-md mx-auto my-6 sm:my-8 shadow-sm">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                            <Coffee className="w-8 h-8 sm:w-10 sm:h-10 text-amber-600 stroke-[1.5]" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-1.5 sm:mb-2">Chưa có đơn hàng nào</h3>
                        <p className="text-xs text-gray-500 mb-5 sm:mb-6">
                            Bạn chưa đặt món nước nào tại quán. Hãy khám phá thực đơn cà phê thơm ngon của BrewLite nhé!
                        </p>
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center gap-2 bg-amber-900 hover:bg-amber-800 text-white font-bold py-2.5 sm:py-3 px-5 sm:px-6 rounded-xl sm:rounded-2xl text-xs sm:text-sm transition shadow-md"
                        >
                            <span>Khám phá thực đơn</span>
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                )}

                {/* 5. DANH SÁCH CÁC ĐƠN HÀNG (SUCCESS) */}
                {token && !loading && !error && orders.length > 0 && (
                    <div className="space-y-3.5 sm:space-y-5">
                        {orders.map((order) => (
                            <div
                                key={order.id}
                                className="bg-white rounded-2xl sm:rounded-3xl border border-amber-100/80 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow"
                            >
                                {/* Header thẻ đơn: Mã đơn, Thời gian, Badge trạng thái */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 pb-3 sm:pb-4 border-b border-gray-100">
                                    <div className="flex items-center gap-1.5 text-xs sm:text-sm">
                                        <span className="font-mono font-black text-amber-950">
                                            #{order.id}
                                        </span>
                                        <span className="text-gray-300">•</span>
                                        <span className="text-gray-500 text-[11px] sm:text-xs">
                                            {new Date(order.createdAt).toLocaleString('vi-VN', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                    <div>
                                        {renderStatusBadge(order.status)}
                                    </div>
                                </div>

                                {/* Thông báo tiến độ đặc biệt cho đơn Đang pha chế hoặc Mời nhận */}
                                {order.status === 'PREPARING' && (
                                    <div className="mt-2.5 sm:mt-3.5 bg-amber-50/70 border border-amber-200/60 rounded-xl px-3 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-xs font-medium text-amber-900 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0"></span>
                                        <span>Barista đang pha chế món của bạn, vui lòng đợi ít phút nhé!</span>
                                    </div>
                                )}
                                {order.status === 'READY' && (
                                    <div className="mt-2.5 sm:mt-3.5 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-1.5 sm:px-3.5 sm:py-2 text-[11px] sm:text-xs font-bold text-emerald-800 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                                        <span>Cà phê của bạn đã sẵn sàng! Mời bạn tới quầy nhận nước.</span>
                                    </div>
                                )}

                                {/* Danh sách món nước trong đơn */}
                                <div className="divide-y divide-gray-50 py-1.5 sm:py-2">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="py-2 sm:py-2.5 flex items-center justify-between text-xs sm:text-sm gap-2">
                                            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                                                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-amber-100/60 text-amber-900 font-bold flex items-center justify-center text-[10px] sm:text-xs shrink-0">
                                                    {item.quantity}x
                                                </div>
                                                <div className="truncate">
                                                    <span className="font-bold text-gray-800 truncate">
                                                        {item.productName || item.product?.name || `Món #${item.productId}`}
                                                    </span>
                                                    <span className="text-gray-400 text-[11px] sm:text-xs ml-1 font-medium">
                                                        (Size {item.size})
                                                    </span>
                                                    {item.toppings && item.toppings.length > 0 && (
                                                        <span className="text-amber-700 text-[11px] sm:text-xs ml-1 block sm:inline">
                                                            + {item.toppings.join(', ')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="font-semibold text-gray-700 shrink-0">
                                                {(item.lineTotal ?? ((item.unitPrice || 0) * item.quantity)).toLocaleString('vi-VN')}đ
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Footer thẻ đơn: Tổng tiền */}
                                <div className="pt-2.5 sm:pt-3 border-t border-dashed border-amber-200/80 flex items-center justify-between">
                                    <span className="text-xs font-medium text-gray-500">Tổng thanh toán:</span>
                                    <span className="text-sm sm:text-lg font-black text-amber-900">
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
