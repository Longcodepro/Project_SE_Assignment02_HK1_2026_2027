'use client';

import { useEffect, useState, useCallback, useRef } from "react";
import { apiService } from "@/services/api";
import { KdsOrder } from "@/types";
import { useAuthStore } from "@/store/useAuthStore";
import { Coffee, Clock, RotateCcw, CheckCircle2, ChefHat, AlertTriangle, ShieldAlert, Sparkles, Layers, } from "lucide-react";
import Navbar from "@/components/Navbar";
import axios from "axios";

// Tính khoảng cách thời gian từ lúc khách đặt món (Hàm thuần túy / Pure function để pass React 19 & Next.js prerender rules)
export function getWaitingTime(dateStr: string, currentTimestamp: number | null): string {
  if (!currentTimestamp) return 'Đang tải...';
  const diffMs = Math.max(0, currentTimestamp - new Date(dateStr).getTime());
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return 'Vừa đặt';
  if (diffMins >= 60) return `${Math.floor(diffMins / 60)}h ${diffMins % 60}p`;
  return `${diffMins} phút trước`;
}

export default function KdsPage(){
    const [orders, setOrders] = useState<KdsOrder[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
    const [conflictMessage, setConflictMessage] = useState<string | null>(null);
    const [currentTimestamp, setCurrentTimestamp] = useState<number | null>(null);

    const user = useAuthStore((state) => state.user);
    const openAuthModal = useAuthStore((state) => state.openAuthModal);
    const conflictTimerRef = useRef<NodeJS.Timeout | null>(null);

    const showConflictToast = (msg: string) => {
    setConflictMessage(msg);
    if (conflictTimerRef.current) clearTimeout(conflictTimerRef.current);
    conflictTimerRef.current = setTimeout(() => setConflictMessage(null), 4000);
  };

    //lấy danh sách đơn hàng cần làm
  const fetchOrders = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const data = await apiService.getKdsOrders();
      setOrders(data);
      setError(null);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 403) {
          setError('FORBIDDEN');
        } else {
          setError(err.response?.data?.message || 'Không thể kết nối đến máy chủ KDS.');
        }
      } else {
        setError('Đã xảy ra lỗi không xác định.');
      }
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  // Polling tự động làm mới mỗi 5 giây
  useEffect(() => {
    let ignore = false;
    async function initialLoad() {
      await fetchOrders(true);
      if (!ignore) {
        setCurrentTimestamp(Date.now());
      }
    }
    initialLoad();
    const intervalId = setInterval(() => {
      fetchOrders(false);
      setCurrentTimestamp(Date.now());
    }, 5000);
    return () => {
      ignore = true;
      clearInterval(intervalId);
      if (conflictTimerRef.current) clearTimeout(conflictTimerRef.current);
    };
  }, [fetchOrders]);

  // Xử lý chuyển trạng thái đơn (PREPARING hoặc READY)
  const handleStatusChange = async (order: KdsOrder, newStatus: 'PREPARING' | 'READY') => {
    setActionLoadingId(order.id);
    try {
      await apiService.updateKdsStatus(order.id, newStatus, order.version);
      // Tải lại danh sách ngay lập tức sau khi bấm thành công
      await fetchOrders(false);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        showConflictToast(`Đơn #${order.id.slice(-6)} vừa được Barista khác cập nhật!`);
        // Làm mới lại danh sách để đồng bộ version mới nhất
        await fetchOrders(false);
      } else {
        alert('Không thể cập nhật trạng thái đơn hàng. Vui lòng thử lại.');
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#1F1612] text-[#F5EDE4] flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* BANNER HEADER KDS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#3E291F] gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#D4A373]/15 border border-[#D4A373]/30 flex items-center justify-center text-[#D4A373]">
              <ChefHat className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white">Màn hình Pha chế KDS</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D4A373] text-[#1F1612]">
                  Live
                </span>
              </div>
              <p className="text-xs text-[#A89284] mt-0.5">
                Tự động làm mới mỗi 5 giây · Đơn cũ nhất xếp lên đầu (FIFO)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <button
              onClick={() => {
                fetchOrders(false);
                setCurrentTimestamp(Date.now());
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#2D1F17] hover:bg-[#3D2B20] text-xs font-semibold text-[#D4A373] border border-[#4D3628] transition active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Làm mới</span>
            </button>
            <div className="px-3 py-2 rounded-xl bg-[#2D1F17] border border-[#4D3628] text-xs text-[#A89284]">
              Đang chờ làm: <span className="font-bold text-white text-sm ml-1">{orders.length}</span>
            </div>
          </div>
        </div>
        {/* THÔNG BÁO XUNG ĐỘT KHÓA LẠC QUAN (409 CONFLICT) */}
        {conflictMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <span>{conflictMessage}</span>
          </div>
        )}
        {/* TRƯỜNG HỢP 1: BỊ CHẶN QUYỀN TRUY CẬP (403 FORBIDDEN HOẶC CHƯA PHẢI BARISTA) */}
        {error === 'FORBIDDEN' || (user && user.role !== 'BARISTA') ? (
          <div className="bg-[#2D1F17] border border-[#5A3825] rounded-3xl p-8 sm:p-12 text-center max-w-md mx-auto my-12 shadow-2xl">
            <ShieldAlert className="w-14 h-14 text-[#D4A373] mx-auto mb-4" />
            <h2 className="text-lg font-bold text-white mb-2">Quyền truy cập bị từ chối</h2>
            <p className="text-xs text-[#BFA89B] leading-relaxed mb-6">
              Màn hình KDS chỉ dành riêng cho tài khoản có vai trò <strong>BARISTA</strong>. Vui lòng đăng nhập bằng tài khoản nhân viên quầy bar.
            </p>
            <button
              onClick={() => openAuthModal('login')}
              className="px-6 py-2.5 bg-[#D4A373] hover:bg-[#C28E5C] text-[#1F1612] text-xs font-bold rounded-xl transition shadow active:scale-95"
            >
              Đổi tài khoản Barista
            </button>
          </div>
        ) : loading ? (
          /* TRƯỜNG HỢP 2: ĐANG TẢI DỮ LIỆU (SKELETON LOADING) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-[#2A1D16] rounded-3xl p-5 border border-[#3E291F] animate-pulse">
                <div className="h-6 bg-[#3E291F] rounded-full w-1/3 mb-4" />
                <div className="space-y-3">
                  <div className="h-4 bg-[#3E291F] rounded w-3/4" />
                  <div className="h-4 bg-[#3E291F] rounded w-1/2" />
                </div>
                <div className="h-10 bg-[#3E291F] rounded-xl mt-6" />
              </div>
            ))}
          </div>
        ) : error ? (
          /* TRƯỜNG HỢP 3: MẤT MẠNG HOẶC LỖI HỆ THỐNG */
          <div className="bg-[#2D1F17] border border-red-500/30 rounded-3xl p-8 text-center max-w-md mx-auto my-12">
            <p className="text-red-400 font-bold mb-4">{error}</p>
            <button
              onClick={() => fetchOrders(true)}
              className="px-5 py-2.5 bg-[#4A2E1B] text-white text-xs font-bold rounded-xl hover:bg-[#5E3B23]"
            >
              Thử lại kết nối
            </button>
          </div>
        ) : orders.length === 0 ? (
          /* TRƯỜNG HỢP 4: QUÁN ĐANG HẾT ĐƠN (EMPTY STATE) */
          <div className="bg-[#2A1D16] border border-dashed border-[#3E291F] rounded-3xl p-12 text-center max-w-md mx-auto my-12">
            <Coffee className="w-12 h-12 text-[#D4A373]/60 mx-auto mb-4" />
            <h3 className="text-base font-bold text-white mb-1">Quầy bar thảnh thơi!</h3>
            <p className="text-xs text-[#A89284]">
              Hiện tại không có đơn nào đang chờ pha chế. Đơn mới sẽ tự động hiển thị ở đây.
            </p>
          </div>
        ) : (
          /* TRƯỜNG HỢP 5: HIỂN THỊ DANH SÁCH THẺ ĐƠN HÀNG (KDS ORDER CARDS) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {orders.map((order, index) => {
              const isPreparing = order.status === 'PREPARING';
              const isActionLoading = actionLoadingId === order.id;
              return (
                <div
                  key={order.id}
                  className={`rounded-3xl p-5 border transition flex flex-col justify-between shadow-lg ${
                    isPreparing
                      ? 'bg-[#2A2318] border-amber-500/50 ring-1 ring-amber-500/30'
                      : 'bg-[#261A13] border-[#3E291F]'
                  }`}
                >
                  <div>
                    {/* HÀNG TRÊN: MÃ ĐƠN & THỨ TỰ */}
                    <div className="flex items-center justify-between pb-3 border-b border-[#3D291E] mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-[#3D291E] flex items-center justify-center text-xs font-bold text-[#D4A373]">
                          #{index + 1}
                        </span>
                        <span className="font-mono font-bold text-sm text-white">
                          #{order.id.slice(-6).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#A89284]">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{getWaitingTime(order.createdAt, currentTimestamp)}</span>
                      </div>
                    </div>
                    {/* HUY HIỆU TRẠNG THÁI */}
                    <div className="mb-4">
                      {isPreparing ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          <Sparkles className="w-3.5 h-3.5 animate-spin" />
                          Đang pha chế...
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          <Layers className="w-3.5 h-3.5" />
                          Đang chờ nhận pha
                        </span>
                      )}
                    </div>
                    {/* DANH SÁCH MÓN CẦN LÀM */}
                    <div className="space-y-3 mb-5">
                      {order.items.map((item, i) => (
                        <div key={i} className="bg-[#1F150F] p-3 rounded-2xl border border-[#3A261C]">
                          <div className="flex items-start justify-between">
                            <span className="font-bold text-sm text-white leading-tight">
                              {item.productName}
                            </span>
                            <span className="px-2 py-0.5 rounded-lg bg-[#3D291E] text-xs font-black text-[#D4A373]">
                              x{item.quantity}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                            <span className="px-2 py-0.5 rounded-md bg-[#2C1D15] text-[#D8C7B8] font-semibold">
                              Size {item.size}
                            </span>
                            {item.toppings && item.toppings.length > 0 ? (
                              item.toppings.map((top, tIdx) => (
                                <span key={tIdx} className="px-2 py-0.5 rounded-md bg-[#3D291E] text-amber-300/90 text-[11px]">
                                  + {top}
                                </span>
                              ))
                            ) : (
                              <span className="text-[11px] text-[#7A6658]">Không topping</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* NÚT THAO TÁC BARISTA BẤM */}
                  <div className="pt-2">
                    {isPreparing ? (
                      <button
                        onClick={() => handleStatusChange(order, 'READY')}
                        disabled={isActionLoading}
                        className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{isActionLoading ? 'Đang cập nhật...' : 'Đã pha xong (READY)'}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusChange(order, 'PREPARING')}
                        disabled={isActionLoading}
                        className="w-full py-3 rounded-2xl bg-[#D4A373] hover:bg-[#C28E5C] disabled:opacity-50 text-[#1F1612] font-black text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer"
                      >
                        <ChefHat className="w-4 h-4" />
                        <span>{isActionLoading ? 'Đang cập nhật...' : 'Nhận pha chế (PREPARING)'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  )
}