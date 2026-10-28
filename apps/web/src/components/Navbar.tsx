'use client';

import Link from "next/link";
import { Coffee, ShoppingBag, Clock, ReceiptText, User as UserIcon, LogIn, LogOut, Radio } from 'lucide-react';
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import AuthModal from "@/components/AuthModal";
import ServerConfigModal from "@/components/ServerConfigModal";
import { useSyncExternalStore, useState } from "react";

export default function Navbar() {
    const totalItems = useCartStore((state) => state.getTotalItems());
    const { token, user, openAuthModal, logout } = useAuthStore();
    const [isServerModalOpen, setIsServerModalOpen] = useState(false);

    // Tránh lỗi hydration mismatch giữa SSR và Client
    const isClient = useSyncExternalStore(() => () => {}, () => true, () => false);

    return (
        <header className="sticky top-0 z-40 bg-[#2C1810]/95 backdrop-blur-md text-white border-b border-[#4A2E1B] shadow-md transition-all">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-20 flex items-center justify-between">

                {/* Logo & Thương hiệu */}
                <Link href="/" className="flex items-center gap-2 sm:gap-3.5 group shrink-0">
                    <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#8C5835] via-[#6F4324] to-[#4A2E1B] border border-[#A06A3B]/40 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300">
                        <Coffee className="w-4 h-4 sm:w-6 sm:h-6 text-[#FAF7F2]" />
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="font-black text-lg sm:text-2xl tracking-tight text-[#FAF7F2] group-hover:text-[#D4A373] transition-colors">
                                BrewLite
                            </span>
                            <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest bg-[#4A2E1B] text-[#D4A373] border border-[#6B4023] px-1 sm:px-1.5 py-0.5 rounded">
                                Coffee
                            </span>
                        </div>
                        <p className="text-[11px] text-[#D8C7B8] font-medium hidden md:block -mt-0.5">
                            Cà phê mộc Tây Nguyên · Đặt nhanh không tiền mặt
                        </p>
                    </div>
                </Link>

                {/* Trạng thái hoạt động hiển thị trên Desktop */}
                <div className="hidden lg:flex items-center gap-6 text-xs text-[#D8C7B8] bg-[#3E2314]/80 border border-[#57341B] px-4 py-1.5 rounded-full">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="font-semibold text-[#FAF7F2]">Đang mở cửa</span>
                        <span className="text-[#A08875]">(07:00 - 22:00)</span>
                    </div>
                    <span className="text-[#6B4023]">|</span>
                    <div className="flex items-center gap-1.5 text-[#D8C7B8]">
                        <Clock className="w-3.5 h-3.5 text-[#D4A373]" />
                        <span>Phục vụ tại quầy & mang đi</span>
                    </div>
                </div>

                {/* Cụm nút Đăng nhập, Đơn hàng, Server config & Giỏ hàng góc phải */}
                <div className="flex items-center gap-1.5 sm:gap-2.5">
                    {/* Nút Cấu hình Server API Backend (Hỗ trợ demo từ xa / điện thoại) */}
                    <button
                        onClick={() => setIsServerModalOpen(true)}
                        className="flex items-center gap-1 bg-[#3E2314]/80 hover:bg-[#57341B] border border-[#57341B] hover:border-[#8C5835] text-[#FAF7F2] p-1.5 sm:px-2.5 sm:py-2 rounded-full transition active:scale-95 shadow-sm text-xs font-semibold"
                        title="Cấu hình kết nối Backend API (Cloudflare Tunnel)"
                    >
                        <Radio className="w-3.5 h-3.5 text-[#D4A373] animate-pulse" />
                        <span className="hidden md:inline text-[11px] text-[#EED8C9]">Server</span>
                    </button>

                    {/* NÚT TÀI KHOẢN / ĐĂNG NHẬP (TASK 7 FE) */}
                    {isClient && token ? (
                        <div className="flex items-center bg-[#3E2314]/90 border border-[#57341B] rounded-full p-1 sm:pl-3 shadow-sm">
                            <div className="flex items-center gap-1 text-xs text-[#FAF7F2] max-w-[80px] sm:max-w-[140px] truncate pl-1 sm:pl-0">
                                <UserIcon className="w-3.5 h-3.5 text-[#D4A373] shrink-0" />
                                <span className="font-semibold truncate hidden xs:inline sm:inline">
                                    {user?.name || user?.email?.split('@')[0] || 'Tôi'}
                                </span>
                            </div>
                            <button
                                onClick={logout}
                                title="Đăng xuất tài khoản"
                                className="p-1 sm:p-1.5 hover:bg-[#57341B] text-amber-200/80 hover:text-white rounded-full transition"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => openAuthModal('login')}
                            className="flex items-center gap-1 bg-[#3E2314]/80 hover:bg-[#57341B] border border-[#57341B] hover:border-[#8C5835] text-[#FAF7F2] px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full transition active:scale-95 shadow-sm text-xs font-bold"
                            title="Đăng ký hoặc Đăng nhập tài khoản"
                        >
                            <LogIn className="w-3.5 h-3.5 text-[#D4A373]" />
                            <span className="hidden sm:inline">Đăng nhập</span>
                        </button>
                    )}

                    {/* NÚT LỊCH SỬ ĐƠN HÀNG (TASK 9) */}
                    <Link
                        href="/orders"
                        className="flex items-center gap-1 bg-[#3E2314]/80 hover:bg-[#57341B] border border-[#57341B] hover:border-[#8C5835] text-[#FAF7F2] p-1.5 sm:px-3.5 sm:py-2 rounded-full transition active:scale-95 shadow-sm text-sm font-semibold"
                        title="Xem lịch sử và tiến độ đơn hàng"
                    >
                        <ReceiptText className="w-4 h-4 text-[#D4A373]" />
                        <span className="hidden sm:inline text-xs font-bold text-[#EED8C9]">
                            Đơn hàng
                        </span>
                    </Link>
                    
                    {/* Nút Giỏ Hàng góc phải */}
                    <Link
                        href="/cart"
                        className="relative flex items-center gap-1.5 sm:gap-2.5 bg-amber-900/80 hover:bg-amber-800 border border-amber-700/60 p-1.5 sm:px-4 sm:py-2 rounded-full transition active:scale-95 shadow-sm"
                    >
                        <div className="relative">
                            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
                            {isClient && totalItems > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 bg-red-500 text-white text-[10px] sm:text-[11px] font-black w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center border-2 border-amber-950 animate-bounce">
                                    {totalItems}
                                </span>
                            )}
                        </div>
                        <span className="text-xs sm:text-sm font-semibold text-amber-100 hidden sm:inline">
                            Giỏ hàng
                        </span>
                    </Link>
                </div>
            </div>

            {/* Modal Đăng nhập / Đăng ký */}
            <AuthModal />

            {/* Modal Cấu hình Backend Server API */}
            <ServerConfigModal
                isOpen={isServerModalOpen}
                onClose={() => setIsServerModalOpen(false)}
            />
        </header>
    );
}
