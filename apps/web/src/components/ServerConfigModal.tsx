'use client';

import { useState } from 'react';
import { Server, CheckCircle2, AlertCircle, RefreshCw, X, Radio, ArrowRight } from 'lucide-react';
import { getApiUrl, setCustomApiUrl, resetCustomApiUrl, isCustomApiUrlSet, apiService } from '@/services/api';

interface ServerConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ServerConfigModal({ isOpen, onClose }: ServerConfigModalProps) {
    const [inputUrl, setInputUrl] = useState<string>(() => {
        return typeof window !== 'undefined' ? getApiUrl() : '';
    });
    const [testing, setTesting] = useState<boolean>(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

    if (!isOpen) return null;

    const currentUrl = typeof window !== 'undefined' ? getApiUrl() : '';
    const isCustom = typeof window !== 'undefined' ? isCustomApiUrlSet() : false;

    const handleTest = async () => {
        if (!inputUrl.trim()) return;
        setTesting(true);
        setTestResult(null);
        try {
            const res = await apiService.testConnection(inputUrl.trim());
            setTestResult(res);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Lỗi kết nối';
            setTestResult({ success: false, message: msg });
        } finally {
            setTesting(false);
        }
    };

    const handleSave = () => {
        if (!inputUrl.trim()) return;
        setCustomApiUrl(inputUrl.trim());
        onClose();
        window.location.reload();
    };

    const handleReset = () => {
        resetCustomApiUrl();
        onClose();
        window.location.reload();
    };

    const handleFillSampleTunnel = () => {
        setInputUrl('https://tend-filter-municipal-ago.trycloudflare.com');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Backdrop click outside */}
            <div className="fixed inset-0" onClick={onClose} />

            <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-amber-900/10 overflow-hidden z-10 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col my-auto">
                {/* Header */}
                <div className="bg-gradient-to-br from-[#2C1810] via-[#4A2E1B] to-[#6F4324] text-white p-4 sm:p-5 relative shrink-0">
                    <button
                        onClick={onClose}
                        className="absolute top-3.5 right-3.5 text-amber-200/70 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition"
                        title="Đóng"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center">
                            <Radio className="w-4 h-4 text-amber-300 animate-pulse" />
                        </div>
                        <span className="text-[10px] uppercase font-extrabold tracking-widest text-amber-300">
                            Cấu hình máy chủ API Backend
                        </span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-black text-amber-50">
                        Kết nối Server từ xa (Cloudflare Tunnel)
                    </h2>
                    <p className="text-xs text-amber-200/80 mt-1 leading-relaxed">
                        Dành cho lúc chạy demo trên điện thoại hoặc máy khác mà không cần cấu hình lại Vercel.
                    </p>
                </div>

                {/* Body */}
                <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
                    {/* Thông tin URL hiện tại */}
                    <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-amber-950">
                        <Server className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                            <span className="font-bold">Đang kết nối tới:</span>
                            <div className="font-mono text-[11px] sm:text-xs text-amber-900 truncate mt-0.5">
                                {currentUrl || 'http://localhost:4000'}
                            </div>
                            {isCustom && (
                                <span className="inline-block mt-1 text-[10px] font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full">
                                    Đang dùng cấu hình tùy chỉnh trên trình duyệt
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Ô nhập URL mới */}
                    <div>
                        <label className="block text-xs font-bold text-gray-800 mb-1.5">
                            Nhập đường link Cloudflare Tunnel (HTTPS):
                        </label>
                        <input
                            type="url"
                            value={inputUrl}
                            onChange={(e) => setInputUrl(e.target.value)}
                            placeholder="https://...trycloudflare.com"
                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-base sm:text-sm font-mono text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-800 focus:bg-white transition"
                        />
                        <div className="flex items-center justify-between gap-2 mt-2">
                            <p className="text-[11px] text-gray-500">
                                💡 Nhập link in ra từ terminal script: <code className="text-amber-800 font-bold">start-tunnel.sh</code>
                            </p>
                            <button
                                type="button"
                                onClick={handleFillSampleTunnel}
                                className="text-[11px] font-bold text-amber-800 hover:text-amber-950 hover:underline shrink-0"
                            >
                                ⚡ Điền link hiện tại
                            </button>
                        </div>
                    </div>

                    {/* Kết quả kiểm tra kết nối nếu có */}
                    {testResult && (
                        <div
                            className={`p-3 rounded-xl border text-xs flex items-start gap-2 animate-in fade-in ${
                                testResult.success
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                    : 'bg-red-50 border-red-200 text-red-800'
                            }`}
                        >
                            {testResult.success ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            ) : (
                                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                            )}
                            <div>
                                <span className="font-bold">{testResult.success ? 'Thành công: ' : 'Lỗi: '}</span>
                                <span>{testResult.message}</span>
                            </div>
                        </div>
                    )}

                    {/* Cụm nút thao tác */}
                    <div className="space-y-2 pt-2 border-t border-gray-100">
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={handleTest}
                                disabled={testing || !inputUrl.trim()}
                                className="w-full py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                                <span>{testing ? 'Đang thử...' : 'Kiểm tra Ping'}</span>
                            </button>

                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={!inputUrl.trim()}
                                className="w-full py-2.5 px-3 bg-[#3E2314] hover:bg-[#2C1810] text-white font-extrabold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                                <span>Lưu & Kết nối</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {isCustom && (
                            <button
                                type="button"
                                onClick={handleReset}
                                className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-red-600 hover:underline transition text-center"
                            >
                                🔄 Đặt lại về mặc định (Localhost)
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
