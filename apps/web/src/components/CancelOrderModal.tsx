'use client';

import { useState } from 'react';
import { AlertCircle, Loader2, X } from 'lucide-react';
import { CANCEL_REASON_MAX, cancelNeedsReason, validateCancelReason } from '@/lib/cancel';
import type { OrderStatus } from '@/types';

interface CancelOrderModalProps {
    // Nhãn đơn hiển thị cho người dùng, ví dụ "#ord_a1b2c3"
    orderLabel: string;
    status: OrderStatus;
    // Lỗi từ server (409, mạng...) do trang cha truyền xuống
    error: string | null;
    busy: boolean;
    onConfirm: (reason: string) => void;
    onClose: () => void;
}

// Hộp thoại hủy đơn dùng chung cho khách (lịch sử đơn) và Cashier (màn quầy)
export default function CancelOrderModal({ orderLabel, status, error, busy, onConfirm, onClose }: CancelOrderModalProps) {
    const [reason, setReason] = useState<string>('');
    const [validation, setValidation] = useState<string | null>(null);
    const required = cancelNeedsReason(status);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const problem = validateCancelReason(status, reason);
        setValidation(problem);
        if (!problem) onConfirm(reason.trim());
    };

    const shownError = validation ?? error;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Hủy đơn hàng">
            <div className="fixed inset-0" onClick={() => !busy && onClose()} />
            <form onSubmit={submit} className="relative z-10 w-full max-w-md bg-white text-gray-900 rounded-3xl shadow-2xl p-5 sm:p-6">
                <div className="flex items-start justify-between pb-3 border-b border-gray-100 mb-4">
                    <div>
                        <h3 className="font-black text-lg">Hủy đơn hàng</h3>
                        <p className="text-xs text-gray-500">
                            Mã đơn: <span className="font-mono font-bold text-amber-900">{orderLabel}</span>
                        </p>
                    </div>
                    <button type="button" onClick={() => !busy && onClose()} aria-label="Đóng" className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {status === 'PAID' ? (
                    <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                        Đơn đã thanh toán: tiền sẽ được hoàn lại (mô phỏng) và điểm thưởng đã tích của đơn này bị trừ.
                    </p>
                ) : (
                    <p className="text-xs text-gray-600 mb-3 leading-relaxed">Đơn chưa thanh toán nên không phát sinh hoàn tiền.</p>
                )}

                <label htmlFor="cancel-reason" className="block text-xs font-bold text-gray-700 mb-1">
                    Lý do hủy {required ? <span className="text-red-600">(bắt buộc)</span> : <span className="text-gray-400">(tùy chọn)</span>}
                </label>
                <textarea
                    id="cancel-reason"
                    value={reason}
                    onChange={(e) => {
                        setReason(e.target.value);
                        setValidation(null);
                    }}
                    rows={3}
                    maxLength={CANCEL_REASON_MAX + 50}
                    placeholder="Ví dụ: Đổi ý, đặt nhầm món..."
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-800 focus:bg-white"
                />
                <p className="text-[11px] text-gray-400 mt-1 text-right">
                    {reason.trim().length}/{CANCEL_REASON_MAX}
                </p>

                {shownError && (
                    <div role="alert" className="mt-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        <span>{shownError}</span>
                    </div>
                )}

                <div className="mt-5 flex items-center justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={() => !busy && onClose()}
                        className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-gray-600 hover:bg-gray-100 transition"
                    >
                        Giữ đơn
                    </button>
                    <button
                        type="submit"
                        disabled={busy}
                        className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white transition flex items-center gap-2"
                    >
                        {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                        <span>{busy ? 'Đang hủy...' : 'Xác nhận hủy đơn'}</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
