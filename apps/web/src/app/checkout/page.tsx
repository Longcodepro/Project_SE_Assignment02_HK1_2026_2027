'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { apiService } from '@/services/api';
import { ArrowLeft, CreditCard, Wallet, ShieldCheck, Loader2, AlertCircle, LogIn } from 'lucide-react';
import { useSyncExternalStore } from 'react';

export default function CheckoutPage(){
    const router = useRouter();
    const isClient = useSyncExternalStore(() => () => {}, () => true, () => false);

    const { items, getTotalPrice, clearCart } = useCartStore();
    const { token, user, openAuthModal } = useAuthStore();

    // Trạng thái chọn phương thức: WALLET HOẶC CARD
    const [paymentMethod, setPaymentMethod] = useState<'WALLET' | 'CARD'>('WALLET');
    const [cardNumber, setCardNumber] = useState<string>('9704000000000001');

    // Nút giả lập để test lỗi khi demo
    const [simulateFail, setSimulateFail] = useState<boolean>(false);

    const [loading, setLoading] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    if (!isClient) return null;
    
    const totalPrice = getTotalPrice();

    // Nếu giỏ hàng trống, chuyển khách về lại menu
    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
                <Navbar />
                <div className="max-w-md mx-auto text-center py-16 sm:py-20 px-4">
                    <p className="text-gray-600 mb-4 text-sm sm:text-base">Bạn chưa có sản phẩm nào để thanh toán.</p>
                    <Link href="/" className="bg-amber-900 text-white font-bold px-6 py-3 rounded-2xl inline-block text-sm sm:text-base">
                        Về trang chủ chọn món
                    </Link>
                </div>
            </div>
        );
    }

    // Hàm xử lý khi bấm xác nhận thanh toán
    const handlePayment = async () => {
        try {
            setLoading(true);
            setErrorMsg(null);

            // Bắt buộc đăng nhập để gắn userId vào đơn và tích điểm
            if (!token) {
                openAuthModal('login');
                throw new Error('Vui lòng đăng nhập để hoàn tất tạo đơn và thanh toán');
            }

            // Demo bị lỗi thủ công
            if (simulateFail) {
                throw new Error('Mô phỏng thanh toán thất bại: số dư tài khoản không đủ hoặc thẻ bị khóa');
            }

            const payload = {
                items: items.map((item) => ({
                    productId: item.product.id,
                    size: item.size,
                    quantity: item.quantity,
                    toppings: item.toppings,
                })),
                paymentMethod,
                cardNumber: paymentMethod === 'CARD' ? cardNumber.trim() : undefined,
            };

            let resultOrder;

            try {
                // Thử gọi backend NestJS thật
                resultOrder = await apiService.createOrderAndPay(payload);
            } catch (beErr: unknown) {
                console.error('Lỗi khi gọi API thanh toán backend:', beErr);
                throw beErr;
            }

            if (resultOrder.status !== 'PAID') {
                throw new Error('Thanh toán thất bại (PAYMENT_FAILED). Vui lòng thử lại.');
            }

            // Nếu thanh toán thành công, làm sạch giỏ hàng và chuyển sang màn hình xác nhận
            clearCart();
            router.push(`/order-success?orderId=${resultOrder.orderId}&total=${resultOrder.total}&method=${paymentMethod}`);
        } catch (err: unknown) {
            // Thất bại thì giữ nguyên giỏ hàng
            const msg = err instanceof Error ? err.message : 'Thanh toán không thành công';
            setErrorMsg(msg);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="min-h-screen bg-[#FAF7F2] text-gray-900 font-sans flex flex-col">
            <Navbar />

            <main className="max-w-2xl mx-auto px-3.5 sm:px-4 py-5 sm:py-8 flex-1 w-full">
                {/* Nút quay lại giỏ hàng */}
                <Link
                    href="/cart"
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-amber-900 hover:text-amber-700 mb-4 sm:mb-6 transition"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại kiểm tra giỏ hàng
                </Link>

                <h1 className="text-xl sm:text-3xl font-black text-amber-950 mb-4 sm:mb-6">
                    Thanh toán đơn hàng
                </h1>

                {/* BANNER NHẮC ĐĂNG NHẬP (NẾU CHƯA ĐĂNG NHẬP) */}
                {!token && (
                    <div className="bg-amber-100/70 border-2 border-amber-300/80 rounded-2xl p-3.5 sm:p-4 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-950 animate-in fade-in">
                        <div className="text-xs">
                            <p className="font-extrabold text-sm text-amber-900 flex items-center gap-1.5">
                                <LogIn className="w-4 h-4 text-amber-700 shrink-0" />
                                Bạn chưa đăng nhập tài khoản
                            </p>
                            <p className="text-amber-800/90 mt-0.5 leading-relaxed">
                                Đăng nhập để đơn hàng được lưu vào tài khoản và nhận điểm tích lũy thành viên (1 điểm / 1.000đ).
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => openAuthModal('login')}
                            className="w-full sm:w-auto text-center bg-amber-900 hover:bg-amber-800 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shrink-0 transition shadow-sm active:scale-95"
                        >
                            Đăng nhập ngay
                        </button>
                    </div>
                )}

                {/* THÔNG BÁO LỖI NẾU THANH TOÁN THẤT BẠI */}
                {errorMsg && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-3.5 sm:p-4 mb-5 flex items-start gap-2.5 text-red-700 animate-in fade-in">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
                        <div>
                            <p className="font-bold text-xs sm:text-sm">Chưa thể hoàn tất thanh toán</p>
                            <p className="text-xs text-red-600 mt-0.5">{errorMsg}</p>
                        </div>
                    </div>
                )}

                <div className="space-y-4 sm:space-y-6">
                    {/* KHỐI 1: TÓM TẮT ĐƠN HÀNG */}
                    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-amber-100/80">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-400">
                                Tóm tắt đơn hàng ({items.length} món)
                            </h2>
                            {token && user && (
                                <span className="text-[11px] sm:text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border border-emerald-200 truncate max-w-[150px] sm:max-w-none">
                                    {user.name || user.email}
                                </span>
                            )}
                        </div>
                        <div className="divide-y divide-gray-100 text-xs sm:text-sm">
                            {items.map((item) => (
                                <div key={item.cartItemId} className="py-2.5 flex justify-between items-center gap-2">
                                    <div className="min-w-0">
                                        <span className="font-bold text-gray-800 truncate block sm:inline">{item.product.name}</span>
                                        <span className="text-[11px] sm:text-xs text-gray-500 sm:ml-2 block sm:inline">
                                            (Size {item.size} × {item.quantity})
                                        </span>
                                    </div>
                                    <span className="font-semibold text-gray-900 shrink-0">
                                        {(item.unitPrice * item.quantity).toLocaleString('vi-VN')}đ
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-dashed border-gray-200 mt-3 sm:mt-4 pt-3 sm:pt-4 flex justify-between items-center">
                            <span className="font-bold text-sm sm:text-base text-gray-800">Tổng tiền cần trả:</span>
                            <span className="font-black text-xl sm:text-2xl text-amber-900">
                                {totalPrice.toLocaleString('vi-VN')}đ
                            </span>
                        </div>
                    </div>

                    {/* KHỐI 2: CHỌN PHƯƠNG THỨC KHÔNG TIỀN MẶT */}
                    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-amber-100/80">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-400">
                                Phương thức thanh toán
                            </h2>
                            <span className="text-[10px] sm:text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Không tiền mặt
                            </span>
                        </div>

                        <div className="space-y-2.5 sm:space-y-3">
                            {/* Lựa chọn 1: Ví điện tử */}
                            <div
                                onClick={() => setPaymentMethod('WALLET')}
                                className={`flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition ${
                                    paymentMethod === 'WALLET'
                                    ? 'border-amber-800 bg-amber-50/70 text-amber-950'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center gap-2.5 sm:gap-3">
                                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center shrink-0">
                                        <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-xs sm:text-sm">Ví điện tử</p>
                                        <p className="text-[11px] text-gray-500">MoMo / ZaloPay / VNPay (tối đa 500k)</p>
                                    </div>
                                </div>
                                <div 
                                    className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                        paymentMethod === 'WALLET' ? 'border-amber-800' : 'border-gray-300'
                                    }`}
                                >
                                    {paymentMethod === 'WALLET' && <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-amber-800" />}
                                </div>
                            </div>

                            {/* Lựa chọn 2: Thẻ ngân hàng */}
                            <div
                                onClick={() => setPaymentMethod('CARD')}
                                className={`flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition ${
                                    paymentMethod === 'CARD'
                                    ? 'border-amber-800 bg-amber-50/70 text-amber-950'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center gap-2.5 sm:gap-3">
                                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                                        <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-xs sm:text-sm">Thẻ ATM / Thẻ Quốc tế</p>
                                        <p className="text-[11px] text-gray-500">Napas / Visa / MasterCard</p>
                                    </div>
                                </div>
                                <div
                                    className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                        paymentMethod === 'CARD' ? 'border-amber-800' : 'border-gray-300'
                                    }`}
                                >
                                    {paymentMethod === 'CARD' && <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-amber-800" />}
                                </div>
                            </div>

                            {/* Ô nhập số thẻ khi chọn Thẻ ngân hàng */}
                            {paymentMethod === 'CARD' && (
                                <div className="mt-2 p-3 sm:p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl sm:rounded-2xl space-y-1.5 animate-in fade-in">
                                    <label className="block text-xs font-bold text-blue-950">
                                        Số thẻ ngân hàng kiểm thử (13–19 chữ số):
                                    </label>
                                    <input
                                        type="text"
                                        value={cardNumber}
                                        onChange={(e) => setCardNumber(e.target.value)}
                                        placeholder="9704000000000001"
                                        maxLength={19}
                                        className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-base sm:text-sm text-gray-900 placeholder:text-gray-400 font-mono focus:ring-2 focus:ring-blue-600 focus:outline-none"
                                    />
                                    <p className="text-[10px] sm:text-[11px] text-gray-500">
                                        💡 Quy tắc: Đuôi khác <code className="font-bold text-blue-700">0000</code> là thành công; đuôi <code className="font-bold text-red-600">0000</code> sẽ bị từ chối.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* CÔNG TẮC MÔ PHỎNG LỖI (Để demo kiểm thử) */}
                        <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-100 flex items-center justify-between text-[11px] sm:text-xs text-gray-500">
                            <span>Chế độ kiểm thử demo:</span>
                            <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={simulateFail}
                                    onChange={(e) => setSimulateFail(e.target.checked)}
                                    className="rounded text-amber-800 focus:ring-0"
                                />
                                <span className={simulateFail ? 'font-bold text-red-600' : ''}>
                                    {simulateFail ? 'Lỗi thất bại' : 'Thành công'}
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* NÚT XÁC NHẬN TRẢ */}
                    <button
                        onClick={handlePayment}
                        disabled={loading}
                        className="w-full bg-amber-900 hover:bg-amber-800 active:scale-[0.98] disabled:opacity-50 text-white font-extrabold py-3.5 sm:py-4 px-4 sm:px-6 rounded-2xl shadow-xl shadow-amber-900/20 flex items-center justify-center gap-2 transition text-sm sm:text-base"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                                <span>Đang kết nối cổng thanh toán...</span>
                            </>
                        ) : (
                            <span>Xác nhận trả · {totalPrice.toLocaleString('vi-VN')}đ</span>
                        )}
                    </button>
                </div>
            </main>
        </div>
    );
}
