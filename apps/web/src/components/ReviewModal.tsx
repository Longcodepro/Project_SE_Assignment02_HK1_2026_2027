'use client';

import { useState } from 'react';
import { AlertCircle, Loader2, Star, X } from 'lucide-react';
import { REVIEW_COMMENT_MAX, validateReview } from '@/lib/review';

interface ReviewModalProps {
    orderLabel: string;
    // Lỗi từ server do trang cha truyền xuống
    error: string | null;
    busy: boolean;
    onSubmit: (stars: number, comment: string) => void;
    // Khách bấm "Để sau" hoặc đóng hộp thoại
    onClose: () => void;
}

// Popup chấm 1-5 sao kèm nhận xét sau khi khách nhận món (đơn COMPLETED)
export default function ReviewModal({ orderLabel, error, busy, onSubmit, onClose }: ReviewModalProps) {
    const [stars, setStars] = useState<number>(0);
    const [hover, setHover] = useState<number>(0);
    const [comment, setComment] = useState<string>('');
    const [validation, setValidation] = useState<string | null>(null);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const problem = validateReview(stars, comment);
        setValidation(problem);
        if (!problem) onSubmit(stars, comment.trim());
    };

    const shownError = validation ?? error;
    const lit = hover || stars;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Đánh giá đơn hàng">
            <div className="fixed inset-0" onClick={() => !busy && onClose()} />
            <form onSubmit={submit} className="relative z-10 w-full max-w-md bg-white text-gray-900 rounded-3xl shadow-2xl p-5 sm:p-6">
                <div className="flex items-start justify-between pb-3 border-b border-gray-100 mb-4">
                    <div>
                        <h3 className="font-black text-lg">Bạn thấy món thế nào?</h3>
                        <p className="text-xs text-gray-500">
                            Đơn <span className="font-mono font-bold text-amber-900">{orderLabel}</span> đã hoàn tất, cảm ơn bạn đã ghé BrewLite.
                        </p>
                    </div>
                    <button type="button" onClick={() => !busy && onClose()} aria-label="Đóng" className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div role="radiogroup" aria-label="Số sao" className="flex items-center justify-center gap-1.5 mb-1" onMouseLeave={() => setHover(0)}>
                    {[1, 2, 3, 4, 5].map((n) => (
                        <button
                            key={n}
                            type="button"
                            role="radio"
                            aria-checked={stars === n}
                            aria-label={`${n} sao`}
                            onMouseEnter={() => setHover(n)}
                            onClick={() => {
                                setStars(n);
                                setValidation(null);
                            }}
                            className="p-1 transition active:scale-90"
                        >
                            <Star className={`w-9 h-9 ${n <= lit ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                        </button>
                    ))}
                </div>
                <p className="text-center text-xs text-gray-500 mb-4 h-4">
                    {stars ? ['Rất tệ', 'Chưa tốt', 'Bình thường', 'Tốt', 'Tuyệt vời'][stars - 1] : 'Chạm vào sao để chấm điểm'}
                </p>

                <label htmlFor="review-comment" className="block text-xs font-bold text-gray-700 mb-1">
                    Nhận xét <span className="text-gray-400">(tùy chọn)</span>
                </label>
                <textarea
                    id="review-comment"
                    value={comment}
                    onChange={(e) => {
                        setComment(e.target.value);
                        setValidation(null);
                    }}
                    rows={3}
                    maxLength={REVIEW_COMMENT_MAX + 50}
                    placeholder="Cà phê, thời gian chờ, nhân viên..."
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-800 focus:bg-white"
                />
                <p className="text-[11px] text-gray-400 mt-1 text-right">
                    {comment.trim().length}/{REVIEW_COMMENT_MAX}
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
                        Để sau
                    </button>
                    <button
                        type="submit"
                        disabled={busy}
                        className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-amber-900 hover:bg-amber-800 disabled:opacity-60 text-white transition flex items-center gap-2"
                    >
                        {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                        <span>{busy ? 'Đang gửi...' : 'Gửi đánh giá'}</span>
                    </button>
                </div>
            </form>
        </div>
    );
}
