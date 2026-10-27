import { Product } from "@/types";
import { Plus } from "lucide-react";

interface ProductCardProps {
    product: Product;
    onClick?: () => void;
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
    return (
        <div
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && onClick) {
                    e.preventDefault();
                    onClick();
                }
            }}
            className="bg-white rounded-3xl p-3.5 sm:p-5 shadow-sm hover:shadow-xl transition-all duration-300 border border-[#EFE7DE] hover:border-[#A06A3B] flex flex-row sm:flex-col gap-3.5 sm:gap-4 cursor-pointer group relative overflow-hidden"
        >
            {/* Ảnh món nước: Thích ứng dạng vuông trên điện thoại, dạng banner trên Desktop */}
            <div className="relative w-24 h-24 sm:w-full sm:h-48 rounded-2xl overflow-hidden bg-[#F5ECE1] flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                />
                {/* Huy hiệu món mới / bán chạy */}
                <span className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-[#2C1810]/85 backdrop-blur-md text-[#FAF7F2] text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-sm tracking-wide">
                    {product.category === 'tea' ? 'Thanh mát' : product.category === 'freeze' ? 'Đá xay' : 'Cà phê rang mộc'}
                </span>
            </div>

            {/* Thông tin món nước */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                    <h3 className="font-extrabold text-[#2C1810] text-sm sm:text-base lg:text-lg group-hover:text-[#8C5835] transition-colors line-clamp-1 sm:line-clamp-2">
                        {product.name}
                    </h3>
                    <p className="text-xs text-[#7C6A59] mt-1 sm:mt-1.5 line-clamp-2 leading-relaxed">
                        Hương vị cà phê nguyên bản, thơm nồng đượm vị truyền thống.
                    </p>
                </div>

                {/* Phần giá tiền và nút chọn món */}
                <div className="flex items-center justify-between mt-2.5 sm:mt-4 pt-2 sm:pt-3 border-t border-dashed border-[#EFE7DE]">
                    <div>
                        <span className="text-[10px] sm:text-[11px] font-semibold text-[#A08875] block">
                            Giá từ (Size S)
                        </span>
                        <p className="text-base sm:text-lg lg:text-xl font-black text-[#4A2E1B] tracking-tight">
                            {product.price.toLocaleString('vi-VN')}đ
                        </p>
                    </div>

                    {/* Nút cộng tương tác */}
                    <button
                        type="button"
                        aria-label={`Thêm ${product.name}`}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#F5ECE1] group-hover:bg-[#4A2E1B] text-[#4A2E1B] group-hover:text-white flex items-center justify-center transition-all duration-200 shadow-sm active:scale-95"
                    >
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                    </button>
                </div>
            </div>
        </div>
    );
}


