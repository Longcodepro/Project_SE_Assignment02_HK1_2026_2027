'use client';

import { useEffect, useState } from 'react';
import { Product } from '@/types';
import { apiService } from '@/services/api';
import { Loader2, AlertCircle, Coffee, Sparkles, ShieldCheck, Zap, Radio } from 'lucide-react';
import Navbar from '@/components/Navbar';
import ProductCard from '@/components/ProductCard';
import ProductDetailModel from '@/components/ProductDetailModal';
import ServerConfigModal from '@/components/ServerConfigModal';
import { useCartStore } from '@/store/useCartStore';

const MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Cà phê sữa đá Sài Gòn',
    price: 29000,
    imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600',
    category: 'cafe',
    stock: 50,
  },
  {
    id: 2,
    name: 'Bạc xỉu 3 tầng béo ngậy',
    price: 32000,
    imageUrl: 'https://images.unsplash.com/photo-1551030173-122aabc4489c?w=600',
    category: 'cafe',
    stock: 40,
  },
  {
    id: 3,
    name: 'Cà phê đen đá đậm vị',
    price: 25000,
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600',
    category: 'cafe',
    stock: 30,
  },
  {
    id: 4,
    name: 'Americano đá thanh mát',
    price: 35000,
    imageUrl: 'https://images.unsplash.com/photo-1551030173-122aabc4489c?w=600',
    category: 'cafe',
    stock: 20,
  },
  {
    id: 5,
    name: 'Trà đào cam sả thanh nhiệt',
    price: 39000,
    imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600',
    category: 'tea',
    stock: 35,
  },
  {
    id: 6,
    name: 'Trà vải hoa hồng Macchiato',
    price: 42000,
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600',
    category: 'tea',
    stock: 25,
  },
  {
    id: 7,
    name: 'Matcha đá xay kem tuyết',
    price: 45000,
    imageUrl: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600',
    category: 'freeze',
    stock: 20,
  },
  {
    id: 8,
    name: 'Cà phê muối xứ Huế',
    price: 35000,
    imageUrl: 'https://images.unsplash.com/photo-1534778101976-62847782c213?w=600',
    category: 'cafe',
    stock: 30,
  },
];

// Danh sách các tab phân loại
const CATEGORIES = [
  { id: 'all', name: 'Tất cả món ☕' },
  { id: 'cafe', name: 'Cà phê rang mộc' },
  { id: 'tea', name: 'Trà & Macchiato' },
  { id: 'freeze', name: 'Đá xay mát lạnh' },
];

export default function MenuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [isServerModalOpen, setIsServerModalOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const addToCart = useCartStore((state)=>state.addToCart);

  useEffect(() => {
    async function fetchMenu() {
      try {
        setLoading(true);
        setError(null);
        setIsOfflineMode(false);

        // Gọi API backend thật
        const data = await apiService.getProducts();
        setProducts(data);
      } catch (err) {
        console.warn('Backend chưa bật hoặc gặp lỗi, sử dụng dữ liệu mẫu', err);
        setProducts(MOCK_PRODUCTS);
        setIsOfflineMode(true);
      } finally {
        setLoading(false);
      }
    }
    fetchMenu();
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2C1810] flex flex-col">
      {/* Thanh điều hướng Navbar */}
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">

        {/* HERO BANNER: Thích ứng phong cách sang trọng trên Desktop, gọn gàng trên Điện thoại */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2C1810] via-[#3E2314] to-[#4A2E1B] text-white p-6 sm:p-10 lg:p-12 shadow-xl border border-[#57341B] mb-8 sm:mb-10">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[#EAD8C7] text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5 text-[#D4A373]" />
              <span>Cà phê nguyên chất rang mộc mỗi ngày</span>
            </div>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight sm:leading-tight text-[#FAF7F2]">
              Thực Đơn Cà Phê <br className="hidden sm:inline" />
              <span className="text-[#D4A373]">BrewLite Coffee</span>
            </h1>
            <p className="mt-2.5 sm:mt-4 text-xs sm:text-base text-[#D8C7B8] leading-relaxed max-w-xl">
              Hương vị đậm đà nguyên bản từ nông trại Tây Nguyên. Đặt món tiện lợi, tùy chỉnh size & topping, không tiền mặt.
            </p>

            {/* Các tiện ích cam kết (Hiện nổi bật trên màn hình Desktop) */}
            <div className="mt-6 sm:mt-8 flex flex-wrap items-center gap-3 sm:gap-6 text-xs text-[#FAF7F2]">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                <Coffee className="w-4 h-4 text-[#D4A373]" />
                <span className="font-medium">100% Robusta & Arabica mộc</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                <Zap className="w-4 h-4 text-[#D4A373]" />
                <span className="font-medium">Pha chế nhanh trong 5 phút</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                <ShieldCheck className="w-4 h-4 text-[#D4A373]" />
                <span className="font-medium">Thanh toán an toàn</span>
              </div>
            </div>
          </div>

          {/* Vệt trang trí hình khối cà phê nghệ thuật mờ phía sau */}
          <div className="absolute -right-12 -bottom-12 w-64 h-64 sm:w-96 sm:h-96 rounded-full bg-[#8C5835]/20 blur-3xl pointer-events-none" />
          <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:block opacity-15 pointer-events-none">
            <Coffee className="w-80 h-80 text-white stroke-[0.8]" />
          </div>
        </section>

        {/* BANNER THÔNG BÁO OFFLINE & KẾT NỐI SERVER (Dành cho demo từ xa / mobile) */}
        {isOfflineMode && (
          <div className="mb-6 p-3.5 sm:p-4 bg-amber-50 border border-amber-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-950 shadow-sm animate-in fade-in">
            <div className="flex items-start sm:items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping shrink-0 mt-1 sm:mt-0" />
              <div>
                <span className="font-extrabold text-amber-900">Chưa kết nối được Backend API thật:</span>{' '}
                <span className="text-amber-800">
                  Đang dùng dữ liệu demo offline. Nếu bạn đang test trên điện thoại hoặc từ xa, vui lòng nhập link Cloudflare Tunnel để kết nối.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsServerModalOpen(true)}
              className="shrink-0 w-full sm:w-auto px-4 py-2 bg-[#3E2314] hover:bg-[#2C1810] text-white font-bold rounded-xl transition shadow text-xs flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Radio className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>Kết nối Server Tunnel</span>
            </button>
          </div>
        )}

        {/* Modal cấu hình Server API */}
        <ServerConfigModal
          isOpen={isServerModalOpen}
          onClose={() => setIsServerModalOpen(false)}
        />

        {/* BỘ LỌC DANH MỤC: Cuộn ngang trên điện thoại, dàn trải trên Desktop */}
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-3 mb-6 sm:mb-8 no-scrollbar">
          {CATEGORIES.map((cat, idx) => (
            <button
              key={cat.id}
              type="button"
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 shadow-sm active:scale-95 ${
                idx === 0
                  ? 'bg-[#4A2E1B] text-[#FAF7F2] shadow-[#4A2E1B]/20'
                  : 'bg-white text-[#7C6A59] border border-[#EFE7DE] hover:border-[#A06A3B] hover:text-[#4A2E1B]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* TIÊU ĐỀ KHỐI THỰC ĐƠN */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg sm:text-2xl font-black text-[#2C1810]">
              Danh Sách Món
            </h2>
            {!loading && products.length > 0 && (
              <span className="text-xs sm:text-sm font-bold bg-[#F5ECE1] text-[#4A2E1B] px-2.5 py-0.5 rounded-full">
                {products.length} món
              </span>
            )}
          </div>
          <span className="text-xs text-[#A08875] hidden sm:block">
            Bấm vào từng món để chọn size và thêm topping
          </span>
        </div>

        {/* TIÊU CHÍ 1: TRẠNG THÁI ĐANG TẢI (LOADING STATE) */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 sm:py-28 text-[#4A2E1B]">
            <div className="relative mb-4">
              <Loader2 className="w-12 h-12 animate-spin text-[#8C5835]" />
              <Coffee className="w-5 h-5 text-[#4A2E1B] absolute inset-0 m-auto" />
            </div>
            <p className="font-bold text-base text-[#2C1810]">Đang chuẩn bị thực đơn BrewLite...</p>
            <p className="text-xs text-[#A08875] mt-1">Đang kết nối hương vị cà phê tươi ngon nhất cho bạn</p>
          </div>
        )}

        {/* TIÊU CHÍ 2: TRẠNG THÁI EMPTY */}
        {!loading && !error && products.length === 0 && (
          <div className="bg-white border border-dashed border-[#EFE7DE] rounded-3xl p-12 text-center max-w-md mx-auto my-12 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-[#F5ECE1] flex items-center justify-center mx-auto mb-4 text-[#8C5835]">
              <Coffee className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-[#2C1810]">Quán tạm hết món!</h3>
            <p className="text-sm text-[#7C6A59] mt-1">Hiện chưa có sản phẩm nào trong thực đơn hôm nay.</p>
          </div>
        )}

        {/* TRẠNG THÁI LỖI KHI BACKEND CHƯA BẬT HOẶC RỚT MẠNG */}
        {!loading && error && (
          <div className="bg-[#FFF8F7] border border-red-200 rounded-3xl p-6 sm:p-8 text-center max-w-md mx-auto my-12 shadow-sm">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <p className="text-red-800 font-bold text-base">{error}</p>
            <p className="text-xs text-red-600/80 mt-1.5">
              Gợi ý: Kiểm tra xem Backend cổng 4000 đã hoạt động chưa nhé.
            </p>
          </div>
        )}

        {/* 3. LƯỚI SẢN PHẨM (GRID VIEW):
            - Điện thoại (< 640px): 1 cột thẻ ngang gọn gàng dễ bấm ngón tay cái
            - Tablet (640px - 1024px): 2 cột
            - Laptop / Desktop (1024px - 1280px): 3 cột
            - Màn hình rộng (>= 1280px): 4 cột chuẩn e-commerce
        */}
        {!loading && products.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-6">
            {products.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                onClick={() => setSelectedProduct(item)}
              />
            ))}
          </div>
        )}

        {/* POPUP CHI TIẾT SẢN PHẨM & TÙY CHỌN */}
        <ProductDetailModel
          key={selectedProduct?.id}
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={(options) => {
            addToCart(
              options.product,
              options.size,
              options.toppings,
              options.unitPrice
            );
          }}
        />
      </main>

      {/* FOOTER: Mang đậm chất thương hiệu quán cà phê mộc */}
      <footer className="mt-16 sm:mt-24 border-t border-[#EFE7DE] bg-white text-[#7C6A59] py-8 px-4 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Coffee className="w-5 h-5 text-[#8C5835]" />
            <span className="font-extrabold text-[#2C1810] text-sm">BrewLite Coffee Roasters</span>
          </div>
          <p className="text-xs text-[#A08875]">
            © 2026 BrewLite Coffee. Thưởng thức trọn vẹn hương vị cà phê mộc nguyên bản.
          </p>
          <div className="flex items-center gap-4 text-xs font-semibold text-[#8C5835]">
            <span>Chất lượng Tây Nguyên</span>
            <span>·</span>
            <span>Đặt nhanh không tiền mặt</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
