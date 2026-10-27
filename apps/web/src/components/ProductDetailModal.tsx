'use client';

import { useState } from "react";
import { Product } from "@/types";
import { X, Check } from "lucide-react";

// Cấu hình giá
const SIZE_OPTIONS = [
    { id: 'S', name: 'Size S (Nhỏ)', extraPrice: 0 },
    { id: 'M', name: 'Size M (Vừa)', extraPrice: 5000 },
    { id: 'L', name: 'Size L (Lớn)', extraPrice: 10000 },
] as const;

const TOPPING_OPTIONS = [
    { id: 'tran-chau', name: 'Trân châu đen', price: 8000 },
    { id: 'kem-cheese', name: 'Kem cheese béo ngậy', price: 10000 },
    { id: 'thach-cafe', name: 'Thạch cà phê giòn', price: 6000 },
];

interface ProductDetailModalProps {
    product: Product | null;
    onClose: () => void;
    onAddToCart?: (selectedOptions: {
        product: Product;
        size: 'S' | 'M' | 'L';
        toppings: string[];
        unitPrice: number;
    }) => void;
}

export default function ProductDetailModel({
    product,
    onClose,
    onAddToCart,
}: ProductDetailModalProps) {
    const [selectedSize, setSelectedSize] = useState<'S' | 'M' | 'L'>('S');
    const [selectedToppings, setSelectedToppings] = useState<string[]>([]);

    // Nếu không có món nào được chọn thì không hiển thị popup
    if (!product) return null;

    // Thuật toán tự tính tổng giá tiền
    const sizeExtra = SIZE_OPTIONS.find((s) => s.id === selectedSize)?.extraPrice || 0;

    const toppingsExtra = selectedToppings.reduce((total, toppingId) => {
        const topping = TOPPING_OPTIONS.find((t) => t.id === toppingId);
        return total + (topping ? topping.price : 0);
    }, 0);
    const finalPrice = product.price + sizeExtra + toppingsExtra;

    // Hàm bật/tắt chọn toppings
    const toggleTopping = (toppingId: string) => {
        if (selectedToppings.includes(toppingId)) {
            setSelectedToppings(selectedToppings.filter((id) => id !== toppingId));
        } else {
            setSelectedToppings([...selectedToppings, toppingId]);
        }
    };

    // Xử lý khi khách bấm thêm vào giỏ hàng
    const handleConfirm = () => {
        if (onAddToCart) {
            onAddToCart({
                product,
                size: selectedSize,
                toppings: selectedToppings,
                unitPrice: finalPrice,
            });
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 bg-[#2C1810]/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
            {/* Khung Modal chính: Thích ứng trên Desktop và Mobile */}
            <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-[#EFE7DE] flex flex-col max-h-[92vh] sm:max-h-[88vh] my-auto">
                
                {/* Header Modal: Ảnh món & Nút đóng */}
                <div className="relative h-40 sm:h-56 bg-[#F5ECE1] shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
                    
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Đóng cửa sổ"
                        className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-white/90 hover:bg-white text-[#2C1810] p-2 sm:p-2.5 rounded-full shadow-md transition-all active:scale-95"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="absolute bottom-2.5 left-3.5 sm:bottom-3 sm:left-5 text-white">
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-[#2C1810]/85 px-2.5 py-0.5 sm:py-1 rounded-full border border-white/20">
                            BrewLite Signature
                        </span>
                    </div>
                </div>

                {/* Nội dung tùy chọn (Cuộn mượt mà nếu nội dung dài) */}
                <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 no-scrollbar">
                    <div className="border-b border-[#EFE7DE] pb-3 sm:pb-4">
                        <h2 className="text-lg sm:text-2xl font-black text-[#2C1810]">
                            {product.name}
                        </h2>
                        <div className="flex items-baseline gap-2 mt-0.5 sm:mt-1">
                            <span className="text-xs font-medium text-[#A08875]">Giá cơ bản:</span>
                            <span className="text-base sm:text-xl font-black text-[#8C5835]">
                                {product.price.toLocaleString('vi-VN')}đ
                            </span>
                        </div>
                    </div>

                    {/* KHỐI 1: CHỌN SIZE */}
                    <div>
                        <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#A08875]">
                                1. Chọn Size <span className="text-red-500">*</span>
                            </h3>
                            <span className="text-[11px] sm:text-xs text-[#8C5835] font-medium">Bắt buộc</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 sm:gap-3">
                            {SIZE_OPTIONS.map((size) => {
                                const isSelected = selectedSize === size.id;
                                return (
                                    <button
                                        type="button"
                                        key={size.id}
                                        onClick={() => setSelectedSize(size.id)}
                                        className={`py-2.5 sm:py-3 px-1.5 sm:px-2 rounded-xl sm:rounded-2xl border-2 font-medium text-center transition-all flex flex-col items-center justify-center ${
                                            isSelected
                                                ? 'border-[#4A2E1B] bg-[#F5ECE1] text-[#2C1810] shadow-sm'
                                                : 'border-[#EFE7DE] bg-white hover:border-[#D4A373] text-[#7C6A59]'
                                        }`}
                                    >
                                        <span className="font-bold text-xs sm:text-base">{size.name}</span>
                                        <span className="text-[11px] sm:text-xs font-semibold text-[#8C5835] mt-0.5 sm:mt-1">
                                            {size.extraPrice > 0 ? `+${size.extraPrice.toLocaleString('vi-VN')}đ` : 'Mặc định'}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* KHỐI 2: CHỌN TOPPING */}
                    <div>
                        <div className="flex items-center justify-between mb-2.5 sm:mb-3">
                            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#A08875]">
                                2. Thêm Topping
                            </h3>
                            <span className="text-[11px] sm:text-xs text-[#A08875]">Tùy chọn</span>
                        </div>
                        <div className="space-y-2 sm:space-y-2.5">
                            {TOPPING_OPTIONS.map((topping) => {
                                const isSelected = selectedToppings.includes(topping.id);
                                return (
                                    <div
                                        key={topping.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => toggleTopping(topping.id)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                toggleTopping(topping.id);
                                            }
                                        }}
                                        className={`flex items-center justify-between p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all ${
                                            isSelected
                                                ? 'border-[#4A2E1B] bg-[#FAF7F2] text-[#2C1810] shadow-sm'
                                                : 'border-[#EFE7DE] bg-white hover:border-[#D4A373] text-[#7C6A59]'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5 sm:gap-3">
                                            <div
                                                className={`w-4 h-4 sm:w-5 sm:h-5 rounded sm:rounded-lg border-2 flex items-center justify-center transition-all shrink-0 ${
                                                    isSelected ? 'bg-[#4A2E1B] border-[#4A2E1B] text-white' : 'border-[#D8C7B8] bg-white'
                                                }`}
                                            >
                                                {isSelected && <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />}
                                            </div>
                                            <span className="font-semibold text-xs sm:text-sm">{topping.name}</span>
                                        </div>
                                        <span className="text-xs sm:text-sm font-bold text-[#8C5835] shrink-0">
                                            +{topping.price.toLocaleString('vi-VN')}đ
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer Modal: Tổng tiền tự nhảy & Nút xác nhận */}
                <div className="p-3.5 sm:p-5 border-t border-[#EFE7DE] bg-[#FAF7F2] flex items-center justify-between gap-3 shrink-0">
                    <div>
                        <p className="text-[10px] sm:text-[11px] font-semibold text-[#A08875] uppercase tracking-wide">Tổng tạm tính</p>
                        <p className="text-xl sm:text-3xl font-black text-[#4A2E1B] tracking-tight">
                            {finalPrice.toLocaleString('vi-VN')}đ
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        className="flex-1 bg-gradient-to-r from-[#4A2E1B] to-[#6F4324] hover:from-[#382213] hover:to-[#57341B] active:scale-95 text-white font-bold py-3 sm:py-3.5 px-4 sm:px-6 rounded-xl sm:rounded-2xl shadow-lg shadow-[#4A2E1B]/20 transition-all flex items-center justify-center text-xs sm:text-base"
                    >
                        Thêm vào giỏ hàng
                    </button>
                </div>
            </div>
        </div>
    );
}
