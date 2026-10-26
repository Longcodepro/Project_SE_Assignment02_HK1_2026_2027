'use client';

import {useState} from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useCartStore } from '@/store/useCartStore';
import { apiService } from '@/services/api';
import { ArrowLeft, CreditCard, Wallet, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { useSyncExternalStore } from 'react';

export default function CheckoutPage(){
    const router = useRouter();
    const isClient = useSyncExternalStore(()=>()=>{}, ()=>true, ()=>false);

    const {items, getTotalPrice, clearCart} = useCartStore();

    //trạng thái chọn phương thức:WALLET HOẶC CARD
    const [paymentMethod, setPaymentMethod] = useState<'WALLET' | 'CARD'> ('WALLET') //WALLET LÀ VÍ ĐIỆN TỬ NHƯ MOMO HOẶC VNPAY

    //nút giả lập để test lỗi
    const [simulateFail, setSimulateFail] = useState<boolean>(false);

    const [loading, setLoading] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string |null>(null);

    if(!isClient) return null;
    
    const totalPrice = getTotalPrice();

    //nếu giỏ hàng trống, chuyển khách về lại menu
    if(items.length === 0 ) {
        return(
            <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
                <Navbar />
                <div className="max-w-md mx-auto text-center py-20 px-4">
                    <p className="text-gray-600 mb-4">Bạn chưa có sản phẩm nào để thanh toán.</p>
                    <Link href="/" className="bg-amber-900 text-white font-bold px-6 py-3 rounded-2xl inline-block">
                        Về trang chủ chọn món
                    </Link>
                </div>
            </div>
        );
    }

    //hàm xử lý khi bấm xác nhận thanh toán
    const handlePayment = async ()=>{
        try{
            setLoading(true);
            setErrorMsg(null);

            //demo bị lỗi
            if(simulateFail){
                throw new Error ('Mô phỏng thanh toán thất bại: số dư tài khoản không đủ hoặc thẻ bị khóa');
            }

            const payload = {
                items: items.map((item)=>({
                    productId: item.product.id,
                    size: item.size,
                    quantity: item.quantity,
                    toppings:item.toppings,
                })),
                paymentMethod,
            };
            let resultOrder;

            try{
                //thử gọi backend
                resultOrder = await apiService.createOrderAndPay(payload);
            }catch (beErr){
                //dự phòng Mock khi back end chưa bật
                console.warn('Backend chưa bật, sử dụng thanh toán giả lập:', beErr );
                resultOrder={
                    orderId: `ord_${Math.floor(1000+Math.random()*9000)}`,
                    status:'PAID',
                    total:totalPrice,
                };
            }
            if(resultOrder.status !== 'PAID'){
                throw new Error('Thanh toán thất bại (PAYMENT_FAILED).')
            }
            //Nếu thanh toán thành công, clean và chuyển sang màn hình xác nhận
            clearCart();
            router.push(`/order-success?orderId=${resultOrder.orderId}&total=${resultOrder.total}&method=${paymentMethod}`)
        }catch(err: unknown){
            //thất bại thì giữ nguyên giỏ hàng
            const msg = err instanceof Error ? err.message:'Thanh toán không thành công';
            setErrorMsg(msg);
        }finally{
            setLoading(false);
        }
    };
    
    return(
        <div className="min-h-screen bg-[#FAF7F2] text-gray-900 font-sans flex flex-col">
            <Navbar />

            <main className="max-w-2xl mx-auto px-4 py-8 flex-1 w-full">
                {/* Nút quay lại giỏ hàng */}
                <Link
                    href="/cart"
                    className="inline-flex items-center gap-2 text-sm font-bold text-amber-900 hover:text-amber-700 mb-6 transition"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại kiểm tra giỏ hàng
                </Link>

                <h1 className="text-2xl sm:text-3xl font-black text-amber-950 mb-6">
                    Thanh toán đơn hàng
                </h1>

                {/* THÔNG BÁO LỖI NẾU THANH TOÁN THẤT BẠI */}
                {errorMsg && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-6 flex items-start gap-3 text-red-700 animate-in fade-in">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
                        <div>
                            <p className="font-bold text-sm">Thanh toán không thành công (PAYMENT_FAILED)</p>
                            <p className="text-xs text-red-600 mt-0.5">{errorMsg}</p>
                        </div>
                    </div>
                )}

                <div className="space-y-6">
                    {/* KHỐI 1: TÓM TẮT ĐƠN HÀNG */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-amber-100/80">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">
                            Tóm tắt đơn hàng ({items.length} món)
                        </h2>
                        <div className="divide-y divide-gray-100 text-sm">
                            {items.map((item) => (
                                <div key={item.cartItemId} className="py-2.5 flex justify-between items-center">
                                    <div>
                                        <span className="font-bold text-gray-800">{item.product.name}</span>
                                        <span className="text-xs text-gray-500 ml-2">
                                            (Size {item.size} × {item.quantity})
                                        </span>
                                    </div>
                                    <span className="font-semibold text-gray-900">
                                        {(item.unitPrice * item.quantity).toLocaleString('vi-VN')}đ
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-dashed border-gray-200 mt-4 pt-4 flex justify-between items-center">
                            <span className="font-bold text-base text-gray-800">Tổng tiền cần trả:</span>
                            <span className="font-black text-2xl text-amber-900">
                                {totalPrice.toLocaleString('vi-VN')}đ
                            </span>
                        </div>
                    </div>
                    {/* KHỐI 2: CHỌN PHƯƠNG THỨC KHÔNG TIỀN MẶT*/}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-amber-100/80">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">
                                    Phương thức thanh toán
                                </h2>
                                <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5" /> Không dùng tiền mặt
                                </span>
                            </div>

                            <div className="space-y-3">
                                {/* Lựa chọn 1: Ví điện tử */}
                                <div
                                    onClick={() => setPaymentMethod('WALLET')}
                                    className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition ${
                                        paymentMethod === 'WALLET'
                                        ? 'border-amber-800 bg-amber-50/70 text-amber-950'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center">
                                            <Wallet className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">Ví điện tử</p>
                                            <p className="text-xs text-gray-500">MoMo / ZaloPay / VNPay</p>
                                        </div>
                                    </div>
                                    <div 
                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                            paymentMethod === 'WALLET' ? 'border-amber-800' : 'border-gray-300'
                                        }`}
                                    >
                                        {paymentMethod === 'WALLET' && <div className="w-2.5 h-2.5 rounded-full bg-amber-800" />}
                                    </div>
                                </div>

                                {/* Lựa chọn 2: Thẻ ngân hàng */}
                                <div
                                    onClick={() => setPaymentMethod('CARD')}
                                    className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition ${
                                        paymentMethod === 'CARD'
                                        ? 'border-amber-800 bg-amber-50/70 text-amber-950'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                                            <CreditCard className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">Thẻ ATM / Thẻ Quốc tế</p>
                                            <p className="text-xs text-gray-500">Napas / Visa / MasterCard</p>
                                        </div>
                                    </div>
                                    <div
                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                            paymentMethod === 'CARD' ? 'border-amber-800' : 'border-gray-300'
                                        }`}
                                    >
                                        {paymentMethod === 'CARD' && <div className="w-2.5 h-2.5 rounded-full bg-amber-800" />}
                                    </div>
                                </div>
                            </div>

                            {/* CÔNG TẮC MÔ PHỎNG LỖI (Để demo trước mặt giảng viên) */}
                            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                                <span>Chế độ kiểm thử của sinh viên:</span>
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={simulateFail}
                                        onChange={(e) => setSimulateFail(e.target.checked)}
                                        className="rounded text-amber-800 focus:ring-0"
                                    />
                                    <span className={simulateFail ? 'font-bold text-red-600' : ''}>
                                        {simulateFail ? 'Đang bật: Mô phỏng lỗi thất bại' : 'Mô phỏng thành công'}
                                    </span>
                                </label>
                            </div>
                    </div>

                    {/* NÚT XÁC NHẬN TRẢ*/}
                    <button
                        onClick={handlePayment}
                        disabled={loading}
                        className="w-full bg-amber-900 hover:bg-amber-800 active:scale-[0.98] disabled:opacity-50 text-white font-extrabold py-4 px-6 rounded-2xl shadow-xl shadow-amber-900/20 flex items-center justify-center gap-2 transition text-base"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Đang kết nối cổng thanh toán...</span>
                            </>
                        ) : (
                            <span>Xác nhận trả · {totalPrice.toLocaleString('vi-VN')}đ</span>
                        )}
                    </button>
                </div>
            </main>
        </div>
    )
}