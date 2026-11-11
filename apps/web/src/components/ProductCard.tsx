import { Product } from "@/types";
import { Plus } from "lucide-react";

interface ProductCardProps {
    product: Product;
    onClick?: () => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
    const isAvailable = product.isAvailable !== false;
    const catName = typeof product.category === 'object' && product.category !== null 
        ? product.category.name 
        : (product.category || 'Cà phê');

    const handleClick = () => {
        if (!isAvailable) return;
        if (onClick) onClick();
    };

    return (
        <div
            onClick={handleClick}
            role="button"
            tabIndex={isAvailable ? 0 : -1}
            onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && isAvailable && onClick) {
                    e.preventDefault();
                    onClick();
                }
            }}
            className={`bg-white rounded-3xl p-3.5 sm:p-5 shadow-sm transition-all duration-300 border flex flex-row sm:flex-col gap-3.5 sm:gap-4 relative overflow-hidden ${
                isAvailable
                    ? 'hover:shadow-xl border-[#EFE7DE] hover:border-[#A06A3B] cursor-pointer group'
                    : 'opacity-65 border-gray-200 bg-gray-50/70 cursor-not-allowed'
            }`}
        >
            {/* Ảnh món nước: Thích ứng dạng vuông trên điện thoại, dạng banner trên Desktop */}
            <div className="relative w-24 h-24 sm:w-full sm:h-48 rounded-2xl overflow-hidden bg-[#F5ECE1] flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={product.imageUrl}
                    alt={product.name}
                    className={`w-full h-full object-cover transition-transform duration-500 ${
                        isAvailable ? 'group-hover:scale-105' : 'grayscale-[40%]'
                    }`}
                    loading="lazy"
                />
                {/* Huy hiệu món mới / bán chạy hoặc Hết hàng */}
                {isAvailable ? (
                    <span className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-[#2C1810]/85 backdrop-blur-md text-[#FAF7F2] text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-sm tracking-wide">
                        {catName}
                    </span>
                ) : (
                    <span className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-red-600/90 backdrop-blur-md text-white text-[10px] sm:text-xs font-black px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-md tracking-wide">
                        Tạm hết hàng
                    </span>
                )}
            </div>

            {/* Thông tin món nước */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                    <h3 className={`font-extrabold text-sm sm:text-base lg:text-lg transition-colors line-clamp-1 sm:line-clamp-2 ${
                        isAvailable ? 'text-[#2C1810] group-hover:text-[#8C5835]' : 'text-gray-500'
                    }`}>
                        {product.name}
                    </h3>
                    <p className="text-xs text-[#7C6A59] mt-1 sm:mt-1.5 line-clamp-2 leading-relaxed">
                        {isAvailable ? 'Hương vị cà phê nguyên bản, thơm nồng đượm vị truyền thống.' : 'Món hiện đang tạm hết nguyên liệu tại quầy.'}
                    </p>
                </div>

                {/* Phần giá tiền và nút chọn món */}
                <div className="flex items-center justify-between mt-2.5 sm:mt-4 pt-2 sm:pt-3 border-t border-dashed border-[#EFE7DE]">
                    <div>
                        <span className="text-[10px] sm:text-[11px] font-semibold text-[#A08875] block">
                            Giá từ (Size S)
                        </span>
                        <p className={`text-base sm:text-lg lg:text-xl font-black tracking-tight ${
                            isAvailable ? 'text-[#4A2E1B]' : 'text-gray-400 line-through'
                        }`}>
                            {product.price.toLocaleString('vi-VN')}đ
                        </p>
                    </div>

                    {/* Nút cộng tương tác */}
                    {isAvailable ? (
                        <button
                            type="button"
                            aria-label={`Thêm ${product.name}`}
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#F5ECE1] group-hover:bg-[#4A2E1B] text-[#4A2E1B] group-hover:text-white flex items-center justify-center transition-all duration-200 shadow-sm active:scale-95"
                        >
                            <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                        </button>
                    ) : (
                        <span className="text-[10px] sm:text-xs font-bold text-red-500 bg-red-50 border border-red-200 px-2 py-1 rounded-lg">
                            Hết
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}


