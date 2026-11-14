'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    Coffee,
    KeyRound,
    Loader2,
    LogIn,
    PackageCheck,
    RotateCcw,
    ShieldAlert,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import { apiService } from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';
import { CashierOrder } from '@/types';
import { apiErrorMessage, httpStatus } from '@/lib/errors';
import { isValidPickupCode, PICKUP_CODE_LENGTH, sanitizePickupInput } from '@/lib/pickup';
import { getWaitingTime } from '@/lib/time';

// Màn giao món của Cashier: khách đọc mã 6 số, Cashier nhập để chuyển đơn READY sang COMPLETED
export default function CashierPage() {
    const isClient = useSyncExternalStore(() => () => {}, () => true, () => false);
    const { token, user, openAuthModal } = useAuthStore();
    const canUse = isClient && !!token && user?.role === 'CASHIER';

    const [orders, setOrders] = useState<CashierOrder[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [forbidden, setForbidden] = useState<boolean>(false);
    const [currentTimestamp, setCurrentTimestamp] = useState<number | null>(null);

    // Mã đang nhập, thông báo lỗi và trạng thái đang gửi theo từng đơn
    const [codes, setCodes] = useState<Record<string, string>>({});
    const [notices, setNotices] = useState<Record<string, string>>({});
    const [busyId, setBusyId] = useState<string | null>(null);
    // Các đơn vừa giao xong trong phiên này, để Cashier thấy kết quả
    const [delivered, setDelivered] = useState<{ id: string; at: number }[]>([]);

    const fetchOrders = useCallback(async (isInitial = false) => {
        if (isInitial) setLoading(true);
        try {
            setOrders(await apiService.getCashierOrders('READY'));
            setError(null);
            setForbidden(false);
        } catch (err: unknown) {
            if (httpStatus(err) === 403) {
                setForbidden(true);
            } else {
                setError(apiErrorMessage(err, 'Không thể tải danh sách đơn chờ giao.'));
            }
        } finally {
            if (isInitial) setLoading(false);
        }
    }, []);

    // Polling mỗi 5 giây, chỉ khi đã đăng nhập bằng tài khoản Cashier
    useEffect(() => {
        if (!canUse) return;
        let ignore = false;
        async function initialLoad() {
            await fetchOrders(true);
            if (!ignore) setCurrentTimestamp(Date.now());
        }
        void initialLoad();
        const intervalId = setInterval(() => {
            void fetchOrders(false);
            setCurrentTimestamp(Date.now());
        }, 5000);
        return () => {
            ignore = true;
            clearInterval(intervalId);
        };
    }, [canUse, fetchOrders]);

    const handleComplete = async (order: CashierOrder) => {
        const code = codes[order.id] ?? '';
        if (!isValidPickupCode(code)) {
            setNotices((n) => ({ ...n, [order.id]: `Mã nhận hàng gồm đúng ${PICKUP_CODE_LENGTH} chữ số.` }));
            return;
        }
        setBusyId(order.id);
        setNotices((n) => ({ ...n, [order.id]: '' }));
        try {
            await apiService.completeOrder(order.id, code);
            setDelivered((list) => [{ id: order.id, at: Date.now() }, ...list].slice(0, 5));
            setCodes((c) => ({ ...c, [order.id]: '' }));
            await fetchOrders(false);
        } catch (err: unknown) {
            const status = httpStatus(err);
            if (status === 409) {
                setNotices((n) => ({ ...n, [order.id]: 'Đơn này vừa được cập nhật, không còn chờ giao. Đã làm mới danh sách.' }));
                await fetchOrders(false);
            } else if (status === 403) {
                setForbidden(true);
            } else {
                // 400: sai mã nhận hàng; không đổi trạng thái đơn
                setNotices((n) => ({ ...n, [order.id]: apiErrorMessage(err, 'Không thể giao món, vui lòng thử lại.') }));
            }
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#1F1612] text-[#F5EDE4] flex flex-col">
            <Navbar />
            <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#3E291F] gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#D4A373]/15 border border-[#D4A373]/30 flex items-center justify-center text-[#D4A373]">
                            <PackageCheck className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-white">Giao món tại quầy</h1>
                            <p className="text-xs text-[#A89284] mt-0.5">
                                Hỏi khách mã nhận hàng 6 số, nhập mã để hoàn tất đơn · Tự làm mới mỗi 5 giây
                            </p>
                        </div>
                    </div>
                    {canUse && (
                        <div className="flex items-center gap-3 self-end sm:self-auto">
                            <button
                                onClick={() => {
                                    void fetchOrders(false);
                                    setCurrentTimestamp(Date.now());
                                }}
                                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#2D1F17] hover:bg-[#3D2B20] text-xs font-semibold text-[#D4A373] border border-[#4D3628] transition active:scale-95"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Làm mới</span>
                            </button>
                            <div className="px-3 py-2 rounded-xl bg-[#2D1F17] border border-[#4D3628] text-xs text-[#A89284]">
                                Chờ giao: <span className="font-bold text-white text-sm ml-1">{orders.length}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Chưa đăng nhập */}
                {isClient && !token && (
                    <div className="bg-[#2D1F17] border border-[#5A3825] rounded-3xl p-8 sm:p-12 text-center max-w-md mx-auto my-12">
                        <LogIn className="w-12 h-12 text-[#D4A373] mx-auto mb-4" />
                        <h2 className="text-lg font-bold text-white mb-2">Cần đăng nhập</h2>
                        <p className="text-xs text-[#BFA89B] leading-relaxed mb-6">
                            Vui lòng đăng nhập bằng tài khoản <strong>CASHIER</strong> để giao món tại quầy.
                        </p>
                        <button
                            onClick={() => openAuthModal('login')}
                            className="px-6 py-2.5 bg-[#D4A373] hover:bg-[#C28E5C] text-[#1F1612] text-xs font-bold rounded-xl transition shadow active:scale-95"
                        >
                            Đăng nhập
                        </button>
                    </div>
                )}

                {/* Sai vai trò (kiểm tra ở client và cả khi server trả 403) */}
                {isClient && !!token && (forbidden || user?.role !== 'CASHIER') && (
                    <div className="bg-[#2D1F17] border border-[#5A3825] rounded-3xl p-8 sm:p-12 text-center max-w-md mx-auto my-12 shadow-2xl">
                        <ShieldAlert className="w-14 h-14 text-[#D4A373] mx-auto mb-4" />
                        <h2 className="text-lg font-bold text-white mb-2">Quyền truy cập bị từ chối</h2>
                        <p className="text-xs text-[#BFA89B] leading-relaxed mb-6">
                            Màn giao món chỉ dành cho tài khoản có vai trò <strong>CASHIER</strong>.
                        </p>
                        <button
                            onClick={() => openAuthModal('login')}
                            className="px-6 py-2.5 bg-[#D4A373] hover:bg-[#C28E5C] text-[#1F1612] text-xs font-bold rounded-xl transition shadow active:scale-95"
                        >
                            Đổi tài khoản Cashier
                        </button>
                    </div>
                )}

                {canUse && !forbidden && (
                    <>
                        {/* Các đơn vừa giao xong */}
                        {delivered.length > 0 && (
                            <div className="mb-6 space-y-2" data-testid="delivered-list">
                                {delivered.map((d) => (
                                    <div
                                        key={`${d.id}-${d.at}`}
                                        className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-sm flex items-center gap-3"
                                    >
                                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                                        <span>
                                            Đã giao đơn <span className="font-mono font-bold">#{d.id.slice(-6).toUpperCase()}</span> lúc{' '}
                                            {new Date(d.at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {[1, 2].map((n) => (
                                    <div key={n} className="bg-[#2A1D16] rounded-3xl p-5 border border-[#3E291F] animate-pulse">
                                        <div className="h-6 bg-[#3E291F] rounded-full w-1/3 mb-4" />
                                        <div className="h-4 bg-[#3E291F] rounded w-3/4 mb-2" />
                                        <div className="h-10 bg-[#3E291F] rounded-xl mt-6" />
                                    </div>
                                ))}
                            </div>
                        ) : error ? (
                            <div className="bg-[#2D1F17] border border-red-500/30 rounded-3xl p-8 text-center max-w-md mx-auto my-12">
                                <p className="text-red-400 font-bold mb-4">{error}</p>
                                <button
                                    onClick={() => void fetchOrders(true)}
                                    className="px-5 py-2.5 bg-[#4A2E1B] text-white text-xs font-bold rounded-xl hover:bg-[#5E3B23]"
                                >
                                    Thử lại kết nối
                                </button>
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="bg-[#2A1D16] border border-dashed border-[#3E291F] rounded-3xl p-12 text-center max-w-md mx-auto my-12">
                                <Coffee className="w-12 h-12 text-[#D4A373]/60 mx-auto mb-4" />
                                <h3 className="text-base font-bold text-white mb-1">Chưa có món nào chờ giao</h3>
                                <p className="text-xs text-[#A89284]">
                                    Khi Barista pha xong, đơn sẽ hiện ở đây để bạn nhập mã nhận hàng của khách.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {orders.map((order) => {
                                    const code = codes[order.id] ?? '';
                                    const busy = busyId === order.id;
                                    return (
                                        <div key={order.id} className="rounded-3xl p-5 border bg-[#261A13] border-[#3E291F] shadow-lg flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center justify-between pb-3 border-b border-[#3D291E] mb-3">
                                                    <span className="font-mono font-bold text-sm text-white">
                                                        #{order.id.slice(-6).toUpperCase()}
                                                    </span>
                                                    <div className="flex items-center gap-1.5 text-[11px] text-[#A89284]">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        <span>{getWaitingTime(order.createdAt, currentTimestamp)}</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-2 mb-4">
                                                    {order.items.map((item, i) => (
                                                        <div key={i} className="bg-[#1F150F] p-3 rounded-2xl border border-[#3A261C] text-sm">
                                                            <div className="flex items-start justify-between">
                                                                <span className="font-bold text-white leading-tight">{item.productName}</span>
                                                                <span className="px-2 py-0.5 rounded-lg bg-[#3D291E] text-xs font-black text-[#D4A373]">
                                                                    x{item.quantity}
                                                                </span>
                                                            </div>
                                                            <p className="mt-1 text-xs text-[#BFA89B]">
                                                                Size {item.size}
                                                                {item.toppings.length > 0 && ` · + ${item.toppings.join(', ')}`}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                                <p className="text-xs text-[#A89284] mb-4">
                                                    Khách đã trả:{' '}
                                                    <span className="font-bold text-white">{order.total.toLocaleString('vi-VN')}đ</span>
                                                </p>
                                            </div>

                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    void handleComplete(order);
                                                }}
                                                className="space-y-2"
                                            >
                                                <label className="flex items-center gap-1.5 text-xs font-bold text-[#D4A373]" htmlFor={`code-${order.id}`}>
                                                    <KeyRound className="w-3.5 h-3.5" /> Mã nhận hàng khách đọc
                                                </label>
                                                <input
                                                    id={`code-${order.id}`}
                                                    inputMode="numeric"
                                                    autoComplete="off"
                                                    value={code}
                                                    onChange={(e) => {
                                                        setCodes((c) => ({ ...c, [order.id]: sanitizePickupInput(e.target.value) }));
                                                        setNotices((n) => ({ ...n, [order.id]: '' }));
                                                    }}
                                                    placeholder="000000"
                                                    aria-label={`Mã nhận hàng đơn ${order.id.slice(-6).toUpperCase()}`}
                                                    className="w-full px-4 py-3 rounded-xl bg-[#1F150F] border border-[#4D3628] text-center text-2xl font-mono tracking-[0.4em] text-white placeholder:text-[#5A4638] focus:outline-none focus:ring-2 focus:ring-[#D4A373]"
                                                />
                                                {notices[order.id] && (
                                                    <p role="alert" className="flex items-start gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2">
                                                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                                        <span>{notices[order.id]}</span>
                                                    </p>
                                                )}
                                                <button
                                                    type="submit"
                                                    disabled={busy || !isValidPickupCode(code)}
                                                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-95"
                                                >
                                                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                                    <span>{busy ? 'Đang xác nhận...' : 'Xác nhận giao món'}</span>
                                                </button>
                                            </form>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
