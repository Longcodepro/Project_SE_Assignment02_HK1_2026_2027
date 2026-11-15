'use client';
import { useState, useEffect, useSyncExternalStore } from 'react';
import Navbar from '@/components/Navbar';
import { useAuthStore } from '@/store/useAuthStore';
import { apiService } from '@/services/api';
import { Ingredient, ProductRecipe, Product } from '@/types';
import { 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  ArrowDownToLine, 
  BookOpen, 
  ShieldAlert, 
  AlertCircle,
  Coffee,
  Check
} from 'lucide-react';

export default function AdminInventoryPage() {
    const isClient = useSyncExternalStore(() => () => {}, () => true, () => false);
    const { token, user, openAuthModal } = useAuthStore();

      
    // Quyền truy cập: Cả MANAGER và BARISTA đều được vào kho
    const isAuthorized = isClient && !!token && (user?.role === 'MANAGER' || user?.role === 'BARISTA');

    // Quản lý Tab: 'stock' (Tồn kho & Cảnh báo) | 'receipt' (Nhập kho) | 'recipes' (Công thức)
    const [activeTab, setActiveTab] = useState<'stock' | 'receipt' | 'recipes'>('stock');

    // Dữ liệu từ API
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [alerts, setAlerts] = useState<Ingredient[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    // Dữ liệu công thức cho món đang chọn
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    const [recipe, setRecipe] = useState<ProductRecipe | null>(null);
    const [loadingRecipe, setLoadingRecipe] = useState<boolean>(false);

    // Form nhập kho
    const [receiptIngredientId, setReceiptIngredientId] = useState<number | ''>('');
    const [receiptQuantity, setReceiptQuantity] = useState<number | ''>('');
    const [receiptNote, setReceiptNote] = useState<string>('');
    const [submittingReceipt, setSubmittingReceipt] = useState<boolean>(false);

    // Trạng thái chung
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [toastMsg, setToastMsg] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(null), 3000);
    };

      // 1. Tải dữ liệu ban đầu
    const loadData = async () => {
        if (!token || !isAuthorized) return;
        try {
            const [ingList, alertList, prodList] = await Promise.all([
                apiService.getAdminIngredients(token),
                apiService.getAdminInventoryAlerts(token),
                apiService.getProducts(),
            ]);
            setIngredients(ingList);
            setAlerts(alertList);
            setProducts(prodList);
            setError(null);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Không thể tải dữ liệu kho';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let ignore = false;
        async function init() {
            if (!isAuthorized || !token) {
                setLoading(false);
                return;
            }
            try {
                const [ingList, alertList, prodList] = await Promise.all([
                apiService.getAdminIngredients(token),
                apiService.getAdminInventoryAlerts(token),
                apiService.getProducts(),
                ]);
                if (!ignore) {
                    setIngredients(ingList);
                    setAlerts(alertList);
                    setProducts(prodList);
                    setError(null);
                    setLoading(false);
                }
            } catch (err: unknown) {
                if (!ignore) {
                    const message = err instanceof Error ? err.message : 'Không thể tải dữ liệu kho';
                    setError(message);
                    setLoading(false);
                }
            }
        }
        init();
        return () => { ignore = true; };
    }, [isAuthorized, token]);

    // 2. Tải công thức khi người dùng chọn món nước
    const handleSelectProduct = async (prodId: number) => {
        setSelectedProductId(prodId);
        if (!token) return;
        setLoadingRecipe(true);
        try {
        const data = await apiService.getProductRecipe(prodId, token);
        setRecipe(data);
        } catch {
        setRecipe({ productId: prodId, items: [] });
        } finally {
        setLoadingRecipe(false);
        }
    };

    // 3. Gửi phiếu nhập kho
    const handleCreateReceipt = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !receiptIngredientId || !receiptQuantity || Number(receiptQuantity) <= 0) {
        showToast('Vui lòng chọn nguyên liệu và số lượng hợp lệ');
        return;
        }
        setSubmittingReceipt(true);
        try {
            await apiService.createIngredientReceipt(
                Number(receiptIngredientId),
                {
                quantity: Number(receiptQuantity),
                note: receiptNote.trim() || undefined,
                },
                token
            );
            showToast('Nhập kho thành công! Đã cập nhật tồn kho.');
            setReceiptQuantity('');
            setReceiptNote('');
            // Tải lại dữ liệu tồn kho mới nhất
            await loadData();
        }   catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Lỗi khi nhập kho';
                showToast(message);
        }   finally {
            setSubmittingReceipt(false);
        }
    };

    // Chuyển nhanh sang tab Nhập kho khi bấm nút trên dòng nguyên liệu
    const handleQuickReceipt = (ingId: number) => {
        setReceiptIngredientId(ingId);
        setActiveTab('receipt');
    };

    // Màn hình khi chưa đăng nhập hoặc không đủ quyền
    if (isClient && !isAuthorized) {
        return (
        <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col">
            <Navbar />
            <main className="flex-1 max-w-4xl mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-red-950/50 border border-red-500/40 rounded-2xl flex items-center justify-center mb-6">
                <ShieldAlert className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-stone-100 mb-2">Quyền truy cập bị từ chối</h1>
            <p className="text-stone-400 max-w-md mb-8">
                Trang Quản lý Kho & Công thức chỉ dành cho tài khoản <strong>Manager</strong> (Quản lý) hoặc <strong>Barista</strong> (Pha chế).
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
      {/* Toast thông báo */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl bg-amber-500 text-stone-950 font-semibold shadow-2xl animate-fade-in border border-amber-300">
          <Check className="w-5 h-5 text-stone-950" />
          <span>{toastMsg}</span>
        </div>
      )}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Header trang */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-800">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {user?.role || 'QUẢN TRỊ VIÊN'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-100 tracking-tight">
                Quản Lý Kho & Công Thức
              </h1>
            </div>
            <p className="text-sm text-stone-400 mt-1">
              Theo dõi định lượng nguyên liệu, cảnh báo hết hàng và phiếu nhập kho
            </p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 border border-stone-700 hover:bg-stone-800 text-stone-200 text-sm font-medium transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-amber-400 ${loading ? 'animate-spin' : ''}`} />
            Làm mới dữ liệu
          </button>
        </div>
        {/* Thông báo lỗi nếu có */}
        {error && (
          <div className="mt-6 p-4 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center gap-3 text-red-300 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}
        {/* Thanh chuyển đổi Tab */}
        <div className="flex border-b border-stone-800 mt-8 gap-2">
          <button
            onClick={() => setActiveTab('stock')}
            className={`flex items-center gap-2.5 px-5 py-3 font-semibold text-sm rounded-t-xl transition-all border-b-2 ${
              activeTab === 'stock'
                ? 'border-amber-500 text-amber-400 bg-stone-900/60'
                : 'border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-900/30'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Tồn kho & Cảnh báo</span>
            {alerts.length > 0 && (
              <span className="ml-1.5 px-2 py-0.5 text-xs font-bold rounded-full bg-red-500 text-white animate-pulse">
                {alerts.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('receipt')}
            className={`flex items-center gap-2.5 px-5 py-3 font-semibold text-sm rounded-t-xl transition-all border-b-2 ${
              activeTab === 'receipt'
                ? 'border-amber-500 text-amber-400 bg-stone-900/60'
                : 'border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-900/30'
            }`}
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>Nhập kho</span>
          </button>
          <button
            onClick={() => setActiveTab('recipes')}
            className={`flex items-center gap-2.5 px-5 py-3 font-semibold text-sm rounded-t-xl transition-all border-b-2 ${
              activeTab === 'recipes'
                ? 'border-amber-500 text-amber-400 bg-stone-900/60'
                : 'border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-900/30'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Công thức pha chế</span>
          </button>
        </div>
        {/* ======================================================== */}
        {/* TAB 1: TỒN KHO & CẢNH BÁO ĐỎ                             */}
        {/* ======================================================== */}
        {activeTab === 'stock' && (
          <div className="mt-6 space-y-6">
            {/* Banner Cảnh Báo Đỏ khi có nguyên liệu chạm ngưỡng */}
            {alerts.length > 0 && (
              <div className="p-4 sm:p-5 rounded-2xl bg-red-950/40 border-2 border-red-500/60 shadow-lg shadow-red-950/30">
                <div className="flex items-center gap-3 text-red-400 font-bold text-base mb-2">
                  <AlertTriangle className="w-5 h-5 shrink-0 animate-bounce" />
                  <span>CẢNH BÁO NGUYÊN LIỆU CHẠM NGƯỠNG TỐI THIỂU ({alerts.length} món)</span>
                </div>
                <p className="text-xs sm:text-sm text-red-200/80 mb-3">
                  Các nguyên liệu sau có số lượng tồn thấp hơn hoặc bằng mức dự trữ an toàn. Hãy tạo phiếu nhập kho ngay để không làm gián đoạn pha chế:
                </p>
                <div className="flex flex-wrap gap-2">
                  {alerts.map((alt) => (
                    <div
                      key={alt.id}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-900/50 border border-red-500/40 text-red-200 text-xs font-semibold"
                    >
                      <span>{alt.name}:</span>
                      <span className="font-mono text-white underline">{alt.stock} {alt.unit}</span>
                      <span className="text-red-400">(Tối thiểu: {alt.minStock})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Bảng Danh Sách Nguyên Liệu */}
            <div className="bg-stone-900/60 border border-stone-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-900 border-b border-stone-800 text-xs font-bold text-stone-400 uppercase tracking-wider">
                      <th className="py-4 px-6">ID</th>
                      <th className="py-4 px-6">Tên nguyên liệu</th>
                      <th className="py-4 px-6">Đơn vị</th>
                      <th className="py-4 px-6">Tồn kho hiện tại</th>
                      <th className="py-4 px-6">Ngưỡng tối thiểu</th>
                      <th className="py-4 px-6 text-center">Trạng thái</th>
                      <th className="py-4 px-6 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60 text-sm">
                    {ingredients.map((ing) => {
                      const isWarning = ing.isLow || ing.stock <= ing.minStock;
                      return (
                        <tr
                          key={ing.id}
                          className={`transition-colors ${
                            isWarning 
                              ? 'bg-red-950/20 hover:bg-red-950/30' 
                              : 'hover:bg-stone-800/30'
                          }`}
                        >
                          <td className="py-4 px-6 font-mono text-xs text-stone-500">#{ing.id}</td>
                          <td className="py-4 px-6 font-semibold text-stone-200">
                            {ing.name}
                          </td>
                          <td className="py-4 px-6">
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-stone-800 text-stone-300">
                              {ing.unit}
                            </span>
                          </td>
                          <td className="py-4 px-6 font-mono font-bold">
                            <span className={isWarning ? 'text-red-400 text-base' : 'text-stone-100'}>
                              {ing.stock.toLocaleString('vi-VN')}
                            </span>
                          </td>
                          <td className="py-4 px-6 font-mono text-stone-400">
                            {ing.minStock.toLocaleString('vi-VN')}
                          </td>
                          <td className="py-4 px-6 text-center">
                            {isWarning ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-950 border border-red-500 text-red-300">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Sắp hết
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Đủ hàng
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => handleQuickReceipt(ing.id)}
                              className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-amber-600 hover:text-stone-950 text-stone-300 text-xs font-medium transition-colors"
                            >
                              Nhập kho
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {ingredients.length === 0 && !loading && (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-stone-500">
                          Chưa có nguyên liệu nào trong hệ thống
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {/* ======================================================== */}
        {/* TAB 2: NHẬP KHO NGUYÊN LIỆU (RECEIPT)                    */}
        {/* ======================================================== */}
        {activeTab === 'receipt' && (
          <div className="mt-6 max-w-2xl mx-auto">
            <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-6 sm:p-8 shadow-xl">
              <h2 className="text-xl font-bold text-stone-100 mb-2 flex items-center gap-2">
                <ArrowDownToLine className="w-5 h-5 text-amber-400" />
                Phiếu Nhập Kho Nguyên Liệu
              </h2>
              <p className="text-xs sm:text-sm text-stone-400 mb-6">
                Ghi nhận số lượng nguyên liệu mới nhập về quầy. Hệ thống sẽ lưu vết người nhập và tự động cộng dồn tồn kho.
              </p>
              <form onSubmit={handleCreateReceipt} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-2">
                    Chọn nguyên liệu nhập <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={receiptIngredientId}
                    onChange={(e) => setReceiptIngredientId(Number(e.target.value) || '')}
                    required
                    className="w-full px-4 py-3 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                  >
                    <option value="">-- Chọn nguyên liệu từ danh sách --</option>
                    {ingredients.map((ing) => (
                      <option key={ing.id} value={ing.id}>
                        {ing.name} (Hiện có: {ing.stock} {ing.unit})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-2">
                    Số lượng nhập thêm <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="Ví dụ: 1000"
                      value={receiptQuantity}
                      onChange={(e) => setReceiptQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                      required
                      className="w-full px-4 py-3 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 text-sm focus:outline-none focus:border-amber-500 transition-colors font-mono"
                    />
                    {receiptIngredientId && (
                      <span className="absolute right-4 top-3 text-xs font-bold text-stone-400">
                        {ingredients.find((i) => i.id === Number(receiptIngredientId))?.unit}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-300 uppercase tracking-wider mb-2">
                    Ghi chú phiếu nhập (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    maxLength={200}
                    placeholder="Ví dụ: Nhập hàng NCC Vinamilk, Bổ sung đầu ca..."
                    value={receiptNote}
                    onChange={(e) => setReceiptNote(e.target.value)}
                    className="w-full px-4 py-3 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
                <div className="pt-4 border-t border-stone-800 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('stock')}
                    className="px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-sm font-medium transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReceipt}
                    className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-sm transition-colors shadow-lg shadow-amber-600/20 disabled:opacity-50"
                  >
                    {submittingReceipt ? 'Đang ghi phiếu...' : 'Xác nhận nhập kho'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* ======================================================== */}
        {/* TAB 3: XEM CÔNG THỨC PHA CHẾ (RECIPE VIEWER)             */}
        {/* ======================================================== */}
        {activeTab === 'recipes' && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Cột trái: Danh sách các món nước */}
            <div className="bg-stone-900/60 border border-stone-800 rounded-2xl p-4 sm:p-5 shadow-xl">
              <h3 className="text-sm font-bold text-stone-200 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Coffee className="w-4 h-4 text-amber-400" />
                Danh mục món nước ({products.length})
              </h3>
              <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
                {products.map((prod) => {
                  const isSelected = selectedProductId === Number(prod.id);
                  return (
                    <button
                      key={prod.id}
                      onClick={() => handleSelectProduct(Number(prod.id))}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-amber-500 text-stone-950 font-bold shadow-md'
                          : 'text-stone-300 hover:bg-stone-800/60 hover:text-stone-100'
                      }`}
                    >
                      <span className="truncate">{prod.name}</span>
                      <span className="text-xs opacity-75 font-mono">{Number(prod.price).toLocaleString('vi-VN')}đ</span>
                    </button>
                  );
                })}
              </div>
            </div>
            {/* Cột phải: Bảng công thức định lượng chi tiết */}
            <div className="md:col-span-2 bg-stone-900/60 border border-stone-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-base font-bold text-stone-100 mb-1 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                {selectedProductId
                  ? `Công thức: ${products.find((p) => Number(p.id) === selectedProductId)?.name || ''}`
                  : 'Chọn một món nước để xem công thức định lượng'}
              </h3>
              <p className="text-xs text-stone-400 mb-6">
                Định lượng nguyên liệu tiêu hao cho một ly theo từng kích cỡ (Size S, M, L).
              </p>
              {loadingRecipe ? (
                <div className="py-16 text-center text-stone-400 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                  <span>Đang tải công thức...</span>
                </div>
              ) : selectedProductId ? (
                recipe && recipe.items.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-stone-900 border-b border-stone-800 text-xs font-bold text-stone-400 uppercase">
                          <th className="py-3 px-4">Size</th>
                          <th className="py-3 px-4">Nguyên liệu</th>
                          <th className="py-3 px-4 text-right">Định lượng / ly</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-800/60">
                        {recipe.items.map((it, idx) => (
                          <tr key={idx} className="hover:bg-stone-800/30">
                            <td className="py-3.5 px-4">
                              <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                Size {it.size}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-medium text-stone-200">
                              {it.ingredientName}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-stone-100">
                              {it.quantity} <span className="text-xs font-normal text-stone-400">{it.unit}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-16 text-center text-stone-500 bg-stone-950/40 rounded-xl border border-stone-800">
                    Món này chưa được thiết lập công thức định lượng trong CSDL
                  </div>
                )
              ) : (
                <div className="py-20 text-center text-stone-500 bg-stone-950/40 rounded-xl border border-stone-800">
                  Vui lòng chọn một món nước ở danh sách bên trái
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}