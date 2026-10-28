'use client';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { useCartStore } from '@/store/useCartStore';
import { ArrowLeft, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useSyncExternalStore } from 'react';

export default function CartPage(){
    const {items, updateQuantity, removeFromCart, getTotalPrice} = useCartStore();
    const isClient = useSyncExternalStore(() => () => {}, () => true, () => false);
    if (!isClient) return null;

    const totalPrice = getTotalPrice();

    return(
        <div className="min-h-screen bg-[#FAF7F2] text-gray-900 font-sans flex flex-col">
            <Navbar />

            <main className="max-w-3xl mx-auto px-3.5 sm:px-4 py-5 sm:py-8 flex-1 w-full">
                {/* Nút quay lại Menu */}
                <Link
                    href="/" className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-amber-900 hover:text-amber-700 mb-4 sm:mb-6 transition"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại menu chọn thêm món
                </Link>

                <h1 className="text-xl sm:text-3xl font-black text-amber-950 mb-4 sm:mb-6 flex items-center gap-2.5">
                    <ShoppingBag className="w-6 h-6 sm:w-7 sm:h-7 text-amber-800" />
                    Giỏ hàng của bạn
                </h1>

                {/* TRƯỜNG HỢP 1: GIỎ HÀNG TRỐNG */}
                {items.length === 0 ? (
                    <div className="bg-white rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center border border-amber-100 shadow-sm my-6">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 text-amber-700">
                            <ShoppingBag className="w-8 h-8 sm:w-10 sm:h-10" />
                        </div>
                        <h2 className="text-lg sm:text-xl font-bold text-gray-800">Giỏ hàng đang trống!</h2>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1.5 mb-5 sm:mb-6">
                            Bạn chưa chọn món nước nào. Hãy dạo quanh menu và chọn cho mình một ly thật ngon nhé.
                        </p>
                        <Link
                            href="/"
                            className="inline-block bg-amber-900 hover:bg-amber-800 text-white font-bold px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl shadow-lg transition text-xs sm:text-sm"
                        >
                            Xem thực đơn ngay
                        </Link>
                    </div>
                ) : (
                    /* TRƯỜNG HỢP 2: DANH SÁCH MÓN TRONG GIỎ HÀNG */
                    <div className="space-y-4 sm:space-y-6">
                        <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 shadow-sm border border-amber-100/80 divide-y divide-gray-100">
                            {items.map((item) => (
                                <div key={item.cartItemId} className="py-3 sm:py-4 first:pt-0 last:pb-0 flex gap-3 sm:gap-4 items-center">
                                    {/* Ảnh nhỏ */}
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={item.product.imageUrl}
                                        alt={item.product.name}
                                        className="w-16 h-16 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl object-cover bg-amber-50 shrink-0"
                                    />
                                    {/* Chi tiết ly nước đã chọn */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-sm sm:text-lg text-gray-900 truncate">
                                            {item.product.name}
                                        </h3>

                                        {/* Size & Topping */}
                                        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-gray-500">
                                            <span className="bg-amber-100/70 text-amber-900 font-bold px-1.5 sm:px-2 py-0.5 rounded">
                                                Size {item.size}
                                            </span>
                                            {item.toppings.length > 0 && (
                                                <span className="text-gray-400">· {item.toppings.join(', ')}</span>
                                            )}
                                        </div>

                                        <p className="text-amber-800 font-black text-sm sm:text-lg mt-1 sm:mt-2">
                                            {(item.unitPrice * item.quantity).toLocaleString('vi-VN')}đ
                                        </p>
                                    </div>

                                    {/* Cột tăng giảm số lượng & Nút Xóa */}
                                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 sm:gap-3 shrink-0">
                                        {/* Bộ đếm số lượng: [ - ] 1 [ + ] */}
                                        <div className="flex items-center border border-gray-200 rounded-lg sm:rounded-xl bg-gray-50 p-0.5 sm:p-1">
                                            <button
                                                disabled={item.quantity <= 1}
                                                onClick={() => updateQuantity(item.cartItemId, -1)}
                                                className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded transition ${
                                                    item.quantity <= 1
                                                    ? 'opacity-30 cursor-not-allowed text-gray-300'
                                                    : 'hover:bg-white text-gray-600'
                                                }`}
                                                title={item.quantity <= 1 ? 'Số lượng tối thiểu là 1 ly' : 'Giảm 1 ly'}
                                            >
                                                <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                            </button>
                                            <span className="w-6 sm:w-8 text-center text-xs sm:text-sm font-bold text-gray-800">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => updateQuantity(item.cartItemId, 1)}
                                                className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded hover:bg-white text-gray-600 transition"
                                            >
                                                <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                            </button>
                                        </div>

                                        {/* Nút xóa thùng rác */}
                                        <button
                                            onClick={() => removeFromCart(item.cartItemId)}
                                            className="p-1 sm:p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg sm:rounded-xl transition"
                                            title="Xóa món này"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}      
                        </div>

                        {/* BẢNG TỔNG TIỀN VÀ NÚT TIẾP TỤC THANH TOÁN */}
                        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-amber-100">
                            <div className="flex justify-between items-center text-xs sm:text-sm text-gray-500 mb-1.5 sm:mb-2">
                                <span>Tạm tính đồ uống:</span>
                                <span className="font-semibold text-gray-800">{totalPrice.toLocaleString('vi-VN')}đ</span>
                            </div>
                            <div className="flex justify-between items-center text-xs sm:text-sm text-gray-500 pb-3 sm:pb-4 border-b border-dashed border-gray-200">
                                <span>Phí dịch vụ:</span>
                                <span className="font-semibold text-green-600">Miễn phí (0đ)</span>
                            </div>

                            <div className="flex justify-between items-center pt-3 sm:pt-4 mb-4 sm:mb-6">
                                <span className="font-bold text-gray-900 text-sm sm:text-lg">Tổng thanh toán:</span>
                                <span className="font-black text-xl sm:text-2xl text-amber-900">
                                    {totalPrice.toLocaleString('vi-VN')}đ
                                </span>
                            </div>

                            <Link
                                href="/checkout"
                                className="w-full bg-amber-900 hover:bg-amber-800 active:scale-[0.98] text-white font-extrabold py-3.5 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl shadow-xl shadow-amber-900/20 flex items-center justify-center gap-2 transition text-sm sm:text-base"
                            >
                                <span>Tiến hành thanh toán</span>
                                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                            </Link>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
