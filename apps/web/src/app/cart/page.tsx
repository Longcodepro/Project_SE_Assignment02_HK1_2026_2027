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

    const totalPrice=getTotalPrice();

    return(
        <div className="min-h-screen bg-[#FAF7F2] text-gray-900 font-sans flex flex-col">
            <Navbar />

            <main className="max-w-3xl mx-auto px-4 py-8 flex-1 w-full">
                {/* Nút quay lại Menu */}
                <Link
                    href="/" className="inline-flex items-center gap-2 text-sm font-bold text-amber-900 hover:text-amber-700 mb-6 transition"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại menu chọn thêm món
                </Link>

                <h1 className="text-2xl sm:text-3xl font-black text-amber-950 mb-6 flex items-center gap-3">
                    <ShoppingBag className="w-7 h-7 text-amber-800" />
                    Giỏ hàng của bạn
                </h1>

                {/* TRƯỜNG HỢP 1: GIỎ HÀNG TRỐNG */}
                {items.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-amber-100 shadow-sm my-6">
                        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-700">
                            <ShoppingBag className="w-10 h-10" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Giỏ hàng đang trống!</h2>
                        <p className="text-sm text-gray-500 mt-2 mb-6">
                            Bạn chưa chọn món nước nào. Hãy dạo quanh menu và chọn cho mình một ly thật ngon nhé.
                        </p>
                        <Link
                            href="/"
                            className="inline-block bg-amber-900 hover:bg-amber-800 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg transition"
                        >
                            Xem thực đơn ngay
                        </Link>
                    </div>
                ) : (
                    /* TRƯỜNG HỢP 2: DANH SÁCH MÓN TRONG GIỎ HÀNG */
                    <div className="space-y-6">
                        <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-sm border border-amber-100/80 divide-y divide-gray-100">
                            {items.map((item) => (
                                <div key={item.cartItemId} className="py-4 first:pt-0 last:pb-0 flex gap-4 items-center">
                                    {/* Ảnh nhỏ */}
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={item.product.imageUrl}
                                        alt={item.product.name}
                                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover bg-amber-50 flex-shrink-0"
                                    />
                                    {/* Chi tiết ly nước đã chọn */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-base sm:text-lg text-gray-900 truncate">
                                            {item.product.name}
                                        </h3>

                                        {/* Size & Topping */}
                                        <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs text-gray-500">
                                            <span className="bg-amber-100/70 text-amber-900 font-bold px-2 py-0.5 rounded-md">
                                                Size {item.size}
                                            </span>
                                            {item.toppings.length > 0 && (
                                                <span className="text-gray-400">· {item.toppings.join(', ')}</span>
                                            )}
                                        </div>

                                        <p className="text-amber-800 font-black text-base sm:text-lg mt-2">
                                            {(item.unitPrice * item.quantity).toLocaleString('vi-VN')}đ
                                        </p>
                                    </div>

                                    {/* Cột tăng giảm số lượng & Nút Xóa */}
                                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                                        {/* Bộ đếm số lượng: [ - ] 1 [ + ] */}
                                        <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 p-1">
                                            <button
                                                disabled={item.quantity <= 1}
                                                onClick={() => updateQuantity(item.cartItemId, -1)}
                                                className={`w-7 h-7 flex items-center justify-center rounded-lg transition ${
                                                    item.quantity <= 1
                                                    ? 'opacity-30 cursor-not-allowed text-gray-300'
                                                    : 'hover:bg-white text-gray-600'
                                                }`}
                                                title={item.quantity <= 1 ? 'Số lượng tối thiểu là 1 ly' : 'Giảm 1 ly'}
                                            >
                                                <Minus className="w-3.5 h-3.5" />
                                            </button>
                                            <span className="w-8 text-center text-sm font-bold text-gray-800">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => updateQuantity(item.cartItemId, 1)}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white text-gray-600 transition"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                            </button>
                                        </div>

                                        {/* Nút xóa thùng rác */}
                                        <button
                                            onClick={() => removeFromCart(item.cartItemId)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                                            title="Xóa món này"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}      
                        </div>

                        {/* BẢNG TỔNG TIỀN VÀ NÚT TIẾP TỤC THANH TOÁN (CHUẨN WIREFRAME MÀN 3) */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-amber-100">
                            <div className="flex justify-between items-center text-sm text-gray-500 mb-2">
                                <span>Tạm tính đồ uống:</span>
                                <span className="font-semibold text-gray-800">{totalPrice.toLocaleString('vi-VN')}đ</span>
                            </div>
                            <div className="flex justify-between items-center text-sm text-gray-500 pb-4 border-b border-dashed border-gray-200">
                                <span>Phí dịch vụ:</span>
                                <span className="font-semibold text-green-600">Miễn phí (0đ)</span>
                            </div>

                            <div className="flex justify-between items-center pt-4 mb-6">
                                <span className="font-bold text-gray-900 text-lg">Tổng thanh toán:</span>
                                <span className="font-black text-2xl text-amber-900">
                                    {totalPrice.toLocaleString('vi-VN')}đ
                                </span>
                            </div>

                            <Link
                                href="/checkout"
                                className="w-full bg-amber-900 hover:bg-amber-800 active:scale-[0.98] text-white font-extrabold py-4 px-6 rounded-2xl shadow-xl shadow-amber-900/20 flex items-center justify-center gap-2 transition text-base"
                            >
                                <span>Tiến hành thanh toán</span>
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}


