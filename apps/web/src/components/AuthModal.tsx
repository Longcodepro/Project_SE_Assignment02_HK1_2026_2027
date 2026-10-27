'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { apiService } from '@/services/api';
import { X, Mail, Lock, User as UserIcon, Loader2, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';

export default function AuthModal() {
    const { isAuthModalOpen, authModalTab, closeAuthModal, openAuthModal, setAuth } = useAuthStore();

    // Trạng thái form
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    if (!isAuthModalOpen) return null;

    const resetMessages = () => {
        setError(null);
        setSuccessMsg(null);
    };

    const handleSwitchTab = (tab: 'login' | 'register') => {
        resetMessages();
        openAuthModal(tab);
    };

    // Điền nhanh tài khoản mẫu để demo chấm điểm
    const fillSampleAccount = () => {
        setEmail('long@test.com');
        setPassword('matkhau123');
        resetMessages();
    };

    // Xử lý Đăng nhập
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        resetMessages();

        if (!email.trim() || !password) {
            setError('Vui lòng nhập đầy đủ email và mật khẩu');
            return;
        }

        try {
            setLoading(true);
            const res = await apiService.login({ email: email.trim(), password });
            setAuth(res.accessToken, res.user);
            setSuccessMsg('Đăng nhập thành công!');
            setTimeout(() => {
                closeAuthModal();
                resetMessages();
            }, 600);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Đăng nhập không thành công';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // Xử lý Đăng ký
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        resetMessages();

        if (!email.trim() || !password) {
            setError('Vui lòng nhập đầy đủ email và mật khẩu');
            return;
        }

        if (password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        try {
            setLoading(true);
            await apiService.register({
                email: email.trim(),
                password,
                name: name.trim() || undefined,
            });

            // Tự động chuyển sang đăng nhập luôn sau khi đăng ký
            const loginRes = await apiService.login({ email: email.trim(), password });
            setAuth(loginRes.accessToken);
            setSuccessMsg('Đăng ký tài khoản thành công! Đang tự động đăng nhập...');
            setTimeout(() => {
                closeAuthModal();
                resetMessages();
            }, 800);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Đăng ký không thành công';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Lớp phủ bấm ra ngoài đóng modal */}
            <div className="fixed inset-0" onClick={closeAuthModal} />

            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-amber-900/10 overflow-hidden z-10 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col my-auto">
                {/* Header Modal */}
                <div className="bg-gradient-to-br from-[#2C1810] via-[#4A2E1B] to-[#6F4324] text-white p-4 sm:p-6 pb-4 sm:pb-5 relative shrink-0">
                    <button
                        onClick={closeAuthModal}
                        className="absolute top-3 right-3 sm:top-4 sm:right-4 text-amber-200/70 hover:text-white p-2 rounded-full hover:bg-white/10 transition"
                        title="Đóng"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center">
                            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
                        </div>
                        <span className="text-[10px] sm:text-xs uppercase font-extrabold tracking-widest text-amber-300">
                            BrewLite Coffee ID
                        </span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-black text-amber-50">
                        {authModalTab === 'login' ? 'Đăng nhập tài khoản' : 'Tạo tài khoản mới'}
                    </h2>
                    <p className="text-[11px] sm:text-xs text-amber-200/80 mt-0.5 sm:mt-1">
                        {authModalTab === 'login'
                            ? 'Đăng nhập để đặt hàng và nhận điểm tích lũy thành viên'
                            : 'Đăng ký ngay để nhận ưu đãi tích điểm 1 điểm / 1.000đ khi mua cà phê'}
                    </p>

                    {/* Tab Switcher */}
                    <div className="flex bg-[#1E0F0A]/60 p-1 rounded-xl mt-3 sm:mt-4 border border-amber-900/40">
                        <button
                            type="button"
                            onClick={() => handleSwitchTab('login')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                                authModalTab === 'login'
                                    ? 'bg-amber-600 text-white shadow-sm'
                                    : 'text-amber-200/70 hover:text-white'
                            }`}
                        >
                            Đăng nhập
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSwitchTab('register')}
                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                                authModalTab === 'register'
                                    ? 'bg-amber-600 text-white shadow-sm'
                                    : 'text-amber-200/70 hover:text-white'
                            }`}
                        >
                            Đăng ký
                        </button>
                    </div>
                </div>

                {/* Body Form (Cuộn được khi bàn phím ảo bật lên) */}
                <div className="p-4 sm:p-6 overflow-y-auto">
                    {/* Báo lỗi nếu có */}
                    {error && (
                        <div className="mb-3.5 p-3 sm:p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2 animate-in fade-in">
                            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Báo thành công nếu có */}
                    {successMsg && (
                        <div className="mb-3.5 p-3 sm:p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-start gap-2 animate-in fade-in">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{successMsg}</span>
                        </div>
                    )}

                    {authModalTab === 'login' ? (
                        /* FORM ĐĂNG NHẬP */
                        <form onSubmit={handleLogin} className="space-y-3.5 sm:space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    Địa chỉ Email
                                </label>
                                <div className="relative">
                                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="tenban@email.com"
                                        className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-base sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-800 focus:bg-white transition"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    Mật khẩu
                                </label>
                                <div className="relative">
                                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-base sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-800 focus:bg-white transition"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#3E2314] hover:bg-[#2C1810] active:scale-[0.99] text-white font-extrabold py-3 px-4 rounded-xl text-sm transition shadow-lg shadow-amber-950/20 flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Đang xác thực...</span>
                                    </>
                                ) : (
                                    <span>Đăng nhập ngay</span>
                                )}
                            </button>

                            {/* Nút hỗ trợ Demo nhanh */}
                            <div className="pt-1">
                                <button
                                    type="button"
                                    onClick={fillSampleAccount}
                                    className="w-full py-2 px-3 text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition flex items-center justify-center gap-1.5"
                                >
                                    <span>⚡ Dùng tài khoản mẫu kiểm thử</span>
                                    <span className="text-gray-500 font-normal hidden xs:inline sm:inline">(long@test.com)</span>
                                </button>
                            </div>
                        </form>
                    ) : (
                        /* FORM ĐĂNG KÝ */
                        <form onSubmit={handleRegister} className="space-y-3.5 sm:space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    Họ và tên khách hàng
                                </label>
                                <div className="relative">
                                    <UserIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Nguyễn Văn A"
                                        className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-base sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-800 focus:bg-white transition"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    Địa chỉ Email <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="tenban@email.com"
                                        className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-base sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-800 focus:bg-white transition"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    Mật khẩu (tối thiểu 6 ký tự) <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-10 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-base sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-800 focus:bg-white transition"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#3E2314] hover:bg-[#2C1810] active:scale-[0.99] text-white font-extrabold py-3 px-4 rounded-xl text-sm transition shadow-lg shadow-amber-950/20 flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Đang đăng ký...</span>
                                    </>
                                ) : (
                                    <span>Tạo tài khoản & Đăng nhập</span>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
