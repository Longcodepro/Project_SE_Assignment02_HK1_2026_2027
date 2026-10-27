'use client';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { CheckCircle2, Coffee, Clock } from 'lucide-react';
import { Suspense } from 'react';

function OrderSuccessContent(){
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId') || '#NaN'
    const total = Number(searchParams.get('total')) || 0;
    const method = searchParams.get('method') === 'CARD' ? 'Thẻ ngân hàng' : 'Ví điện tử';

    return(
        <div className="max-w-md mx-auto my-8 px-4 text-center">
            {/* KHUNG THÔNG BÁO THÀNH CÔNG */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-amber-100 flex flex-col items-center">

                {/* Biểu tượng tích xanh to rõ chuẩn Wireframe */}
                <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-4 ring-8 ring-green-50/50">
                    <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
                </div>

                <h1 className="text-2xl font-black text-gray-900 mb-1">
                    Đặt hàng thành công!
                </h1>
                <p className="text-xs text-gray-500 mb-6">Cảm ơn bạn đã lựa chọn cà phê nguyên chất BrewLite</p>

                {/* THÔNG TIN CHI TIẾT MÃ ĐƠN & TRẠNG THÁI */}
                <div className="w-full bg-amber-50/50 rounded-2xl p-4 border border-amber-100/80 mb-6 space-y-2.5 text-sm text-left">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-xs">Mã đơn hàng:</span>
                        <span className="font-extrabold text-amber-950 font-mono text-base">{orderId}</span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-xs">Trạng thái:</span>
                        <span className="bg-emerald-100 text-emerald-800 font-extrabold text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            PAID (ĐÃ THANH TOÁN)
                        </span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-xs">Phương thức:</span>
                        <span className="font-semibold text-gray-800 text-xs">{method}</span>
                    </div>

                    {total > 0 && (
                        <div className="flex justify-between items-center pt-2 border-t border-dashed border-amber-200">
                            <span className="text-gray-500 text-xs">Số tiền đã trả:</span>
                            <span className="font-black text-amber-900 text-base">
                                {total.toLocaleString('vi-VN')}đ
                            </span>
                        </div>
                    )}
                </div>

                {/* THÔNG ĐIỆP CHỜ NHẬN NƯỚC*/}
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 bg-amber-100/60 px-4 py-2 rounded-xl mb-6">
                    <Clock className="w-4 h-4 text-amber-700 animate-spin" style={{ animationDuration: '6s' }} />
                    <span>Barista đang pha chế, mời bạn tới quầy nhận nước sau 3-5 phút!</span>
                </div>
                
                {/* CỤM NÚT ĐIỀU HƯỚNG */}
                <div className="w-full space-y-2.5">
                    {/* Nút theo dõi tiến độ đơn hàng */}
                    <Link
                        href="/orders"
                        className="w-full bg-emerald-700 hover:bg-emerald-600 active:scale-[0.98] text-white font-bold py-3 px-6 rounded-2xl shadow-md transition flex items-center justify-center gap-2 text-sm"
                    >
                        <Clock className="w-4 h-4 text-emerald-200" />
                        <span>Theo dõi tiến độ đơn hàng</span>
                    </Link>

                    {/* NÚT VỀ TRANG CHỦ */}
                    <Link
                        href="/"
                        className="w-full bg-amber-900 hover:bg-amber-800 active:scale-[0.98] text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg transition flex items-center justify-center gap-2 text-sm"
                    >
                        <Coffee className="w-4 h-4 text-amber-300" />
                        <span>Về trang chủ chọn thêm món</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function OrderSuccessContentPage(){
    return(
        <div className="min-h-screen bg-[#FAF7F2] text-gray-900 font-sans flex flex-col">
            <Navbar />
            <main className="flex-1 flex items-center justify-center">
                <Suspense fallback={<div className="p-8 text-center text-gray-500">Đang tải hóa đơn...</div>}>
                    <OrderSuccessContent />
                </Suspense>
            </main>
        </div>
    );
}