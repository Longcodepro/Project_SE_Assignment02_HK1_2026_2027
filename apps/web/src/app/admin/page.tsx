'use client';
import { useState, useEffect, useSyncExternalStore } from 'react';
import Navbar from '@/components/Navbar';
import { useAuthStore } from '@/store/useAuthStore';
import { apiService } from '@/services/api';
import { StaffUser, AdminPromotion, ReportData } from '@/types';
import Link from 'next/link';
import { 
  TrendingUp, 
  Users, 
  Ticket, 
  ShieldAlert, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  Lock, 
  Unlock, 
  PlusCircle, 
  UserPlus, 
  Award, 
  DollarSign, 
  ShoppingBag, 
  XCircle,
  Coffee,
  Package,
  LayoutDashboard
} from 'lucide-react';

export default function AdminDashboardPage() {
    const isClient = useSyncExternalStore(() => () => {}, () => true, () => false);
    const { token, user, openAuthModal } = useAuthStore();
    const isManager = isClient && !!token && user?.role === 'MANAGER';

    // Quản lý Tab: 'reports' | 'staff' | 'promotions'
    const [activeTab, setActiveTab] = useState<'reports' | 'staff' | 'promotions'>('reports');
    
    // Dữ liệu
    const [report, setReport] = useState<ReportData | null>(null);
    const [reportGroupBy, setReportGroupBy] = useState<'day' | 'week' | 'month'>('day');
    const [staffList, setStaffList] = useState<StaffUser[]>([]);
    const [promotions, setPromotions] = useState<AdminPromotion[]>([]);
    
    // Form nhân sự
    const [newStaffPhone, setNewStaffPhone] = useState('');
    const [newStaffPass, setNewStaffPass] = useState('');
    const [newStaffName, setNewStaffName] = useState('');
    const [newStaffRole, setNewStaffRole] = useState<'BARISTA' | 'CASHIER'>('BARISTA');
    const [showAddStaffModal, setShowAddStaffModal] = useState(false);
    
    // Form voucher
    const [newPromoCode, setNewPromoCode] = useState('');
    const [newPromoType, setNewPromoType] = useState<'FIXED' | 'PERCENT'>('PERCENT');
    const [newPromoVal, setNewPromoVal] = useState<number | ''>('');
    const [newPromoMinOrder, setNewPromoMinOrder] = useState<number | ''>('');
    const [newPromoMaxUses, setNewPromoMaxUses] = useState<number | ''>('');
    const [showAddPromoModal, setShowAddPromoModal] = useState(false);
    // Trạng thái chung
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [toastMsg, setToastMsg] = useState<string | null>(null);
    
    const showToast = (msg: string) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(null), 3000);
    };

      // 1. Tải toàn bộ dữ liệu
    const loadData = async () => {
        if (!token || !isManager) return;
        try {
            const [repData, staffData, promoData] = await Promise.all([
                apiService.getAdminReports(reportGroupBy, token),
                apiService.getAdminStaff(token),
                apiService.getAdminPromotions(token),
            ]);
            setReport(repData);
            setStaffList(staffData);
            setPromotions(promoData);
            setError(null);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Lỗi khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let ignore = false;
        async function init() {
            if (!isManager || !token) {
                setLoading(false);
                return;
            }
            try {
                const [repData, staffData, promoData] = await Promise.all([
                apiService.getAdminReports(reportGroupBy, token),
                apiService.getAdminStaff(token),
                apiService.getAdminPromotions(token),
                ]);
                if (!ignore) {
                setReport(repData);
                setStaffList(staffData);
                setPromotions(promoData);
                setError(null);
                setLoading(false);
                }
            } catch (err: unknown) {
                if (!ignore) {
                setError(err instanceof Error ? err.message : 'Lỗi khi tải dữ liệu');
                setLoading(false);
                }
            }
        }
        init();
        return () => { ignore = true; };
    }, [isManager, token, reportGroupBy]);

    // 2. Thao tác Nhân sự
    const handleToggleLockStaff = async (staff: StaffUser) => {
        if (!token) return;
        try {
            await apiService.updateStaff(staff.phone, { isLocked: !staff.isLocked }, token);
            showToast(`${staff.isLocked ? 'Mở khóa' : 'Đã khóa'} nhân viên ${staff.phone}`);
            await loadData();
        } catch (err: unknown) {
            showToast(err instanceof Error ? err.message : 'Lỗi khi cập nhật tài khoản');
        }
    };

    const handleChangeStaffRole = async (staff: StaffUser) => {
        if (!token) return;
        const newRole = staff.role === 'BARISTA' ? 'CASHIER' : 'BARISTA';
        try {
            await apiService.updateStaff(staff.phone, { role: newRole }, token);
            showToast(`Đã chuyển vai trò sang ${newRole}`);
            await loadData();
        } catch (err: unknown) {
            showToast(err instanceof Error ? err.message : 'Lỗi khi đổi vai trò');
        }
    };

    const handleCreateStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        try {
            await apiService.createStaff({
                    phone: newStaffPhone,
                    password: newStaffPass,
                    name: newStaffName.trim() || undefined,
                    role: newStaffRole,
                },
                token
            );
            showToast('Tạo tài khoản nhân viên thành công!');
            setShowAddStaffModal(false);
            setNewStaffPhone('');
            setNewStaffPass('');
            setNewStaffName('');
            await loadData();
        } catch (err: unknown) {
            showToast(err instanceof Error ? err.message : 'Lỗi khi tạo nhân viên');
        }
    };
    // 3. Thao tác Voucher
    const handleTogglePromotion = async (promo: AdminPromotion) => {
        if (!token) return;
        try {
            await apiService.updatePromotion(promo.id, { isActive: !promo.isActive }, token);
            showToast(`${promo.isActive ? 'Đã vô hiệu hóa' : 'Đã kích hoạt'} mã ${promo.code}`);
            await loadData();
        } catch (err: unknown) {
            showToast(err instanceof Error ? err.message : 'Lỗi khi đổi trạng thái mã');
        }
    };

    const handleCreatePromotion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !newPromoCode || !newPromoVal) return;
        try {
            await apiService.createPromotion(
                {
                    code: newPromoCode.trim().toUpperCase(),
                    discountType: newPromoType,
                    discountValue: Number(newPromoVal),
                    minOrderAmount: newPromoMinOrder ? Number(newPromoMinOrder) : undefined,
                    maxUses: newPromoMaxUses ? Number(newPromoMaxUses) : undefined,
                },
                token
            );
            showToast('Tạo mã giảm giá thành công!');
            setShowAddPromoModal(false);
            setNewPromoCode('');
            setNewPromoVal('');
            setNewPromoMinOrder('');
            setNewPromoMaxUses('');
            await loadData();
        } catch (err: unknown) {
            showToast(err instanceof Error ? err.message : 'Lỗi khi tạo mã giảm giá');
        }
    };

    if (isClient && !isManager) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-red-950/50 border border-red-500/40 rounded-2xl flex items-center justify-center mb-6">
            <ShieldAlert className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-stone-100 mb-2">Quyền truy cập bị từ chối</h1>
          <p className="text-stone-400 max-w-md mb-8">
            Trang Dashboard Quản trị chỉ dành riêng cho tài khoản <strong>Manager</strong> (Quản lý).
          </p>
          <button
            onClick={() => openAuthModal()}
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold rounded-xl transition-colors shadow-lg shadow-amber-600/20"
          >
            Đăng nhập lại
          </button>
        </main>
      </div>
    );
  }
    return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans">
      <Navbar />
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl bg-amber-500 text-stone-950 font-semibold shadow-2xl border border-amber-300">
          <Check className="w-5 h-5 text-stone-950" />
          <span>{toastMsg}</span>
        </div>
      )}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-800">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                MANAGER PORTAL
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-100 tracking-tight">
                Quản Trị Hệ Thống
              </h1>
            </div>
            <p className="text-sm text-stone-400 mt-1">
              Báo cáo doanh thu, sản lượng, quản lý tài khoản nhân viên và chương trình voucher
            </p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 border border-stone-700 hover:bg-stone-800 text-stone-200 text-sm font-medium transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-amber-400 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
        
        {/* THANH ĐIỀU HƯỚNG LIÊN KẾT 3 PHÂN HỆ QUẢN TRỊ */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-stone-800/80">
            <span className="text-xs text-stone-400 font-semibold uppercase tracking-wider mr-2">
                Phân hệ quản trị:
            </span>
            <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold"
            >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Báo cáo & Nhân sự
            </Link>
            <Link
                href="/admin/menu"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 text-xs font-medium transition-colors"
            >
                <Coffee className="w-3.5 h-3.5 text-amber-400" />
                Quản lý Menu & Giá
            </Link>
            <Link
                href="/admin/inventory"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-700 text-xs font-medium transition-colors"
            >
                <Package className="w-3.5 h-3.5 text-amber-400" />
                Kho & Công thức
            </Link>
        </div>

        {error && (
          <div className="mt-6 p-4 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center gap-3 text-red-300 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}
        {/* Thanh Tab */}
        <div className="flex border-b border-stone-800 mt-8 gap-2">
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2.5 px-5 py-3 font-semibold text-sm rounded-t-xl transition-all border-b-2 ${
              activeTab === 'reports'
                ? 'border-amber-500 text-amber-400 bg-stone-900/60'
                : 'border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-900/30'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Dashboard Báo cáo</span>
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`flex items-center gap-2.5 px-5 py-3 font-semibold text-sm rounded-t-xl transition-all border-b-2 ${
              activeTab === 'staff'
                ? 'border-amber-500 text-amber-400 bg-stone-900/60'
                : 'border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-900/30'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Quản lý Nhân sự</span>
          </button>
          <button
            onClick={() => setActiveTab('promotions')}
            className={`flex items-center gap-2.5 px-5 py-3 font-semibold text-sm rounded-t-xl transition-all border-b-2 ${
              activeTab === 'promotions'
                ? 'border-amber-500 text-amber-400 bg-stone-900/60'
                : 'border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-900/30'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>Mã giảm giá (Voucher)</span>
          </button>
        </div>
        {/* TAB 1: BÁO CÁO & DASHBOARD */}
        {activeTab === 'reports' && report && (
          <div className="mt-6 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs text-stone-400 font-medium">
                Khoảng thời gian: {report.from} đến {report.to}
              </span>
              <div className="flex rounded-lg bg-stone-900 p-1 border border-stone-800">
                {(['day', 'week', 'month'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setReportGroupBy(period)}
                    className={`px-3 py-1 rounded text-xs font-semibold capitalize transition-colors ${
                      reportGroupBy === period
                        ? 'bg-amber-500 text-stone-950'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {period === 'day' ? 'Ngày' : period === 'week' ? 'Tuần' : 'Tháng'}
                  </button>
                ))}
              </div>
            </div>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800 shadow-lg">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase mb-2">
                  <DollarSign className="w-4 h-4" />
                  Doanh thu thực thu
                </div>
                <div className="text-2xl font-black font-mono text-stone-100">
                  {report.totals.revenue.toLocaleString('vi-VN')}đ
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800 shadow-lg">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase mb-2">
                  <ShoppingBag className="w-4 h-4" />
                  Đơn hoàn tất
                </div>
                <div className="text-2xl font-black font-mono text-stone-100">
                  {report.totals.completedOrders}
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800 shadow-lg">
                <div className="flex items-center gap-2 text-stone-400 text-xs font-bold uppercase mb-2">
                  <ShoppingBag className="w-4 h-4" />
                  Tổng đơn tạo
                </div>
                <div className="text-2xl font-black font-mono text-stone-100">
                  {report.totals.totalOrders}
                </div>
              </div>
              <div className="p-5 rounded-2xl bg-stone-900/60 border border-stone-800 shadow-lg">
                <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase mb-2">
                  <XCircle className="w-4 h-4" />
                  Tỷ lệ hủy
                </div>
                <div className="text-2xl font-black font-mono text-stone-100">
                  {(report.totals.cancelRate * 100).toFixed(1)}%
                </div>
              </div>
            </div>
            {/* Top 5 món */}
            <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-base font-bold text-stone-100 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                Top 5 món bán chạy nhất
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {report.topProducts.map((p, idx) => (
                  <div key={p.productId} className="p-4 rounded-xl bg-stone-950 border border-stone-800 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-black text-amber-400 font-mono">#0{idx + 1}</span>
                      <p className="font-semibold text-stone-200 text-sm mt-1 truncate">{p.productName}</p>
                    </div>
                    <p className="text-xs text-stone-400 mt-3 font-mono font-bold text-right">
                      {p.quantity} ly
                    </p>
                  </div>
                ))}
              </div>
            </div>
            {/* Bảng chuỗi số liệu theo kỳ */}
            <div className="bg-stone-900/60 border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-stone-900 border-b border-stone-800 text-xs font-bold text-stone-400 uppercase">
                      <th className="py-3 px-5">Kỳ ({report.groupBy})</th>
                      <th className="py-3 px-5 text-right">Doanh thu</th>
                      <th className="py-3 px-5 text-right">Đơn hoàn tất</th>
                      <th className="py-3 px-5 text-right">Tổng đơn</th>
                      <th className="py-3 px-5 text-right">Tỷ lệ hủy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60">
                    {report.series.map((s) => (
                      <tr key={s.period} className="hover:bg-stone-800/30">
                        <td className="py-3.5 px-5 font-mono text-stone-300 font-medium">{s.period}</td>
                        <td className="py-3.5 px-5 font-mono text-stone-100 font-bold text-right">
                          {s.revenue.toLocaleString('vi-VN')}đ
                        </td>
                        <td className="py-3.5 px-5 font-mono text-stone-300 text-right">{s.completedOrders}</td>
                        <td className="py-3.5 px-5 font-mono text-stone-400 text-right">{s.totalOrders}</td>
                        <td className="py-3.5 px-5 font-mono text-right text-stone-400">
                          {(s.cancelRate * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {/* TAB 2: QUẢN LÝ NHÂN SỰ */}
        {activeTab === 'staff' && (
          <div className="mt-6 space-y-6">
            <div className="flex justify-end">
              <button
                onClick={() => setShowAddStaffModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-sm transition-colors shadow-lg shadow-amber-600/20"
              >
                <UserPlus className="w-4 h-4" />
                Thêm nhân viên
              </button>
            </div>
            <div className="bg-stone-900/60 border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-stone-900 border-b border-stone-800 text-xs font-bold text-stone-400 uppercase">
                      <th className="py-3.5 px-6">Số điện thoại</th>
                      <th className="py-3.5 px-6">Tên nhân viên</th>
                      <th className="py-3.5 px-6">Vai trò</th>
                      <th className="py-3.5 px-6 text-center">Trạng thái</th>
                      <th className="py-3.5 px-6 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60">
                    {staffList.map((st) => (
                      <tr key={st.phone} className="hover:bg-stone-800/30">
                        <td className="py-4 px-6 font-mono font-medium text-stone-200">{st.phone}</td>
                        <td className="py-4 px-6 text-stone-300">{st.name || '—'}</td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            st.role === 'MANAGER' 
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                              : st.role === 'BARISTA'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {st.role}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          {st.isLocked ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-950 text-red-300 border border-red-500/40">
                              Đã khóa
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                              Hoạt động
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          {st.role !== 'MANAGER' && (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleChangeStaffRole(st)}
                                className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-xs text-stone-300 transition-colors"
                              >
                                Đổi thành {st.role === 'BARISTA' ? 'CASHIER' : 'BARISTA'}
                              </button>
                              <button
                                onClick={() => handleToggleLockStaff(st)}
                                className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                                  st.isLocked 
                                    ? 'bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200' 
                                    : 'bg-red-950 hover:bg-red-900 text-red-300'
                                }`}
                                title={st.isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                              >
                                {st.isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {/* TAB 3: MÃ GIẢM GIÁ */}
        {activeTab === 'promotions' && (
          <div className="mt-6 space-y-6">
            <div className="flex justify-end">
              <button
                onClick={() => setShowAddPromoModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-sm transition-colors shadow-lg shadow-amber-600/20"
              >
                <PlusCircle className="w-4 h-4" />
                Tạo mã giảm giá
              </button>
            </div>
            <div className="bg-stone-900/60 border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-stone-900 border-b border-stone-800 text-xs font-bold text-stone-400 uppercase">
                      <th className="py-3.5 px-6">Mã Code</th>
                      <th className="py-3.5 px-6">Loại giảm</th>
                      <th className="py-3.5 px-6">Giá trị giảm</th>
                      <th className="py-3.5 px-6">Đơn tối thiểu</th>
                      <th className="py-3.5 px-6">Lượt dùng</th>
                      <th className="py-3.5 px-6 text-center">Trạng thái</th>
                      <th className="py-3.5 px-6 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60">
                    {promotions.map((p) => (
                      <tr key={p.id} className="hover:bg-stone-800/30">
                        <td className="py-4 px-6 font-mono font-bold text-amber-400">{p.code}</td>
                        <td className="py-4 px-6 text-stone-300">
                          {p.discountType === 'PERCENT' ? 'Theo %' : 'Số tiền cố định'}
                        </td>
                        <td className="py-4 px-6 font-mono font-bold text-stone-100">
                          {p.discountType === 'PERCENT'
                            ? `${p.discountValue}%`
                            : `${p.discountValue.toLocaleString('vi-VN')}đ`}
                        </td>
                        <td className="py-4 px-6 font-mono text-stone-400">
                          {p.minOrderAmount ? `${p.minOrderAmount.toLocaleString('vi-VN')}đ` : 'Không'}
                        </td>
                        <td className="py-4 px-6 font-mono text-stone-300">
                          {p.usedCount} / {p.maxUses ?? '∞'}
                        </td>
                        <td className="py-4 px-6 text-center">
                          {p.isActive ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                              Đang áp dụng
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-800 text-stone-400">
                              Vô hiệu
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleTogglePromotion(p)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                              p.isActive
                                ? 'bg-red-950 hover:bg-red-900 text-red-300'
                                : 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300'
                            }`}
                          >
                            {p.isActive ? 'Vô hiệu hóa' : 'Kích hoạt lại'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {/* Modal Thêm Nhân Viên */}
        {showAddStaffModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <h3 className="text-lg font-bold text-stone-100 mb-4">Tạo Tài Khoản Nhân Viên Mới</h3>
              <form onSubmit={handleCreateStaff} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 uppercase mb-1">Số điện thoại *</label>
                  <input
                    type="text"
                    required
                    placeholder="0911222333"
                    value={newStaffPhone}
                    onChange={(e) => setNewStaffPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-300 uppercase mb-1">Mật khẩu * (≥ 6 ký tự)</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••"
                    value={newStaffPass}
                    onChange={(e) => setNewStaffPass(e.target.value)}
                    className="w-full px-4 py-2.5 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-300 uppercase mb-1">Họ tên (Tùy chọn)</label>
                  <input
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-300 uppercase mb-1">Vai trò ban đầu</label>
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value as 'BARISTA' | 'CASHIER')}
                    className="w-full px-4 py-2.5 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 text-sm"
                  >
                    <option value="BARISTA">Pha chế (BARISTA)</option>
                    <option value="CASHIER">Thu ngân (CASHIER)</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-stone-800">
                  <button
                    type="button"
                    onClick={() => setShowAddStaffModal(false)}
                    className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 text-sm"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-sm"
                  >
                    Tạo tài khoản
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Modal Thêm Voucher */}
        {showAddPromoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <h3 className="text-lg font-bold text-stone-100 mb-4">Tạo Mã Giảm Giá Mới</h3>
              <form onSubmit={handleCreatePromotion} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 uppercase mb-1">Mã Voucher (Chữ hoa) *</label>
                  <input
                    type="text"
                    required
                    placeholder="TET2027"
                    value={newPromoCode}
                    onChange={(e) => setNewPromoCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2.5 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 text-sm font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 uppercase mb-1">Loại giảm</label>
                    <select
                      value={newPromoType}
                      onChange={(e) => setNewPromoType(e.target.value as 'FIXED' | 'PERCENT')}
                      className="w-full px-4 py-2.5 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 text-sm"
                    >
                      <option value="PERCENT">Phần trăm (%)</option>
                      <option value="FIXED">Số tiền (đ)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 uppercase mb-1">Giá trị giảm *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder={newPromoType === 'PERCENT' ? '15' : '20000'}
                      value={newPromoVal}
                      onChange={(e) => setNewPromoVal(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 text-sm font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-300 uppercase mb-1">Đơn tối thiểu (VNĐ)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ví dụ: 60000"
                    value={newPromoMinOrder}
                    onChange={(e) => setNewPromoMinOrder(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-300 uppercase mb-1">Giới hạn số lượt dùng</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Bỏ trống nếu không giới hạn"
                    value={newPromoMaxUses}
                    onChange={(e) => setNewPromoMaxUses(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 text-sm font-mono"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-stone-800">
                  <button
                    type="button"
                    onClick={() => setShowAddPromoModal(false)}
                    className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 text-sm"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-sm"
                  >
                    Tạo voucher
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}