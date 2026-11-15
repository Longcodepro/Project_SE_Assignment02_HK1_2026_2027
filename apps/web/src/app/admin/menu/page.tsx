'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import Navbar from '@/components/Navbar';
import { useAuthStore } from '@/store/useAuthStore';
import { apiService } from '@/services/api';
import { AdminProduct, AdminCategory, AdminTopping, SizeSurcharge } from '@/types';

import { 
  Coffee, 
  Layers, 
  Sliders, 
  ShieldAlert, 
  Check, 
  RefreshCw, 
  Save, 
  Tag, 
    AlertCircle 
} from 'lucide-react';

export default function AdminMenuPage(){
    const isClient = useSyncExternalStore(() => () => {}, () => true, () => false);
    const { token, user, openAuthModal } = useAuthStore();
    const isManager = isClient && !!token && user?.role === 'MANAGER';

    // Quản lý Tab hiện tại: 'products' | 'categories' | 'pricing'
    const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'pricing'>('products');

    // Dữ liệu quản trị
    const [products, setProducts] = useState<AdminProduct[]>([]);
    const [categories, setCategories] = useState<AdminCategory[]>([]);
    const [toppings, setToppings] = useState<AdminTopping[]>([]);
    const [sizes, setSizes] = useState<SizeSurcharge[]>([]);

    // Trạng thái giao diện
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [savingId, setSavingId] = useState<string | number | null>(null);
    const [toastMsg, setToastMsg] = useState<string | null>(null);

    // Ô nhập chỉnh sửa tạm thời trên từng dòng
    const [editedPrices, setEditedPrices] = useState<Record<number, number>>({});
    const [editedToppingPrices, setEditedToppingPrices] = useState<Record<string, number>>({});
    const [editedSizePrices, setEditedSizePrices] = useState<Record<string, number>>({});
    const [newCategoryName, setNewCategoryName] = useState<string>('');

    const showToast = (msg: string) => {
        setToastMsg(msg);
        setTimeout(() => setToastMsg(null), 3000);
    };

    // 1. Tải toàn bộ dữ liệu quản trị từ Backend
    useEffect(() => {
        let ignore = false;
        async function initData() {
        if (!isManager || !token) return;
        try {
            const [prods, cats, tops, szs] = await Promise.all([
            apiService.getAdminProducts(token),
            apiService.getAdminCategories(token),
            apiService.getAdminToppings(token),
            apiService.getAdminSizes(token),
            ]);
            if (!ignore) {
            setProducts(prods);
            setCategories(cats);
            setToppings(tops);
            setSizes(szs);
            setError(null);
            }
        } catch (err) {
            if (!ignore) {
            console.error(err);
            setError('Không thể tải dữ liệu quản trị. Vui lòng thử lại.');
            }
        } finally {
            if (!ignore) {
            setLoading(false);
            }
        }
        }
        initData();
        return () => { ignore = true; };
    }, [isManager, token]);

    const handleRefresh = async () => {
        if (!token) return;
        setLoading(true);
        setError(null);
        try {
        const [prods, cats, tops, szs] = await Promise.all([
            apiService.getAdminProducts(token),
            apiService.getAdminCategories(token),
            apiService.getAdminToppings(token),
            apiService.getAdminSizes(token),
        ]);
        setProducts(prods);
        setCategories(cats);
        setToppings(tops);
        setSizes(szs);
        } catch {
        setError('Lỗi làm mới dữ liệu.');
        } finally {
        setLoading(false);
        }
    };

    // 2. Thao tác Món: Bật/Tắt còn hàng & Sửa giá
    const handleToggleProduct = async (p: AdminProduct) => {
        if (!token) return;
        setSavingId(p.id);
        try {
            await apiService.updateProduct(p.id, { isAvailable: !p.isAvailable }, token);
            setProducts(prev => prev.map(item => item.id === p.id ? { ...item, isAvailable: !p.isAvailable } : item));
        showToast(`Đã ${!p.isAvailable ? 'bật bán' : 'tắt bán'} món: ${p.name}`);
        } catch {
            alert('Lỗi cập nhật trạng thái món!');
        } finally {
            setSavingId(null);
        }
    };

    const handleSaveProductPrice = async (p: AdminProduct) => {
        if (!token) return;
        const newPrice = editedPrices[p.id];
        if (newPrice === undefined || newPrice <= 0) return;
        setSavingId(p.id);
        try {
            await apiService.updateProduct(p.id, { price: newPrice }, token);
            setProducts(prev => prev.map(item => item.id === p.id ? { ...item, price: newPrice } : item));
            showToast(`Đã đổi giá ${p.name} thành ${newPrice.toLocaleString('vi-VN')}đ`);
        } catch {
            alert('Không thể lưu giá mới!');
        } finally {
            setSavingId(null);
        }
    };

    // 3. Thao tác Danh mục: Ẩn/Hiện & Thêm mới
    const handleToggleCategory = async (c: AdminCategory) => {
        if (!token) return;
        setSavingId(c.id);
        try {
            await apiService.updateCategory(c.id, { isActive: !c.isActive }, token);
            setCategories(prev => prev.map(item => item.id === c.id ? { ...item, isActive: !c.isActive } : item));
            showToast(`Đã ${!c.isActive ? 'hiện' : 'ẩn'} danh mục: ${c.name}`);
        } catch {
            alert('Lỗi cập nhật danh mục!');
        } finally {
            setSavingId(null);
        }
    };

    // 4. Thao tác Topping & Size
    const handleSaveToppingPrice = async (top: AdminTopping) => {
        if (!token) return;
        const newPrice = editedToppingPrices[top.code];
        if (newPrice === undefined || newPrice < 0) return;
        setSavingId(top.code);
        try {
            await apiService.updateTopping(top.code, { price: newPrice }, token);
            setToppings(prev => prev.map(t => t.code === top.code ? { ...t, price: newPrice } : t));
            showToast(`Đã cập nhật giá topping: ${top.name}`);
        } catch {
            alert('Lỗi lưu giá topping!');
        } finally {
            setSavingId(null);
        }
    };

    const handleSaveSize = async (sizeObj: SizeSurcharge) => {
        if (!token) return;
        const newSurcharge = editedSizePrices[sizeObj.size];
        if (newSurcharge === undefined || newSurcharge < 0) return;
        setSavingId(sizeObj.size);
        try {
        await apiService.updateSize(sizeObj.size, newSurcharge, token);
            setSizes(prev => prev.map(s => s.size === sizeObj.size ? { ...s, surcharge: newSurcharge } : s));
            showToast(`Đã đổi phụ thu Size ${sizeObj.size} thành ${newSurcharge.toLocaleString('vi-VN')}đ`);
        } catch {
            alert('Lỗi lưu phụ thu size!');
        } finally {
            setSavingId(null);
        }
    };

    if (!isClient) return null;
    if (!isManager) {
        return (
            <div className="min-h-screen bg-[#1F1612] text-[#F5EDE4] flex flex-col">
            <Navbar />
            <main className="flex-1 flex items-center justify-center p-4">
            <div className="bg-[#2D1F17] border border-amber-900/60 rounded-3xl p-8 max-w-md text-center shadow-2xl">
                <ShieldAlert className="w-16 h-16 text-amber-500 mx-auto mb-4 animate-bounce" />
                <h1 className="text-xl font-black text-white">Quyền Truy Cập Bị Giới Hạn</h1>
                <p className="text-xs text-[#BFA89B] mt-2 mb-6 leading-relaxed">
                Khu vực Quản trị Menu và Bảng giá chỉ dành riêng cho tài khoản có vai trò <strong>MANAGER</strong>.
                </p>
                <button
                onClick={() => openAuthModal('login')}
                className="px-6 py-2.5 bg-[#D4A373] hover:bg-[#C28E5C] text-[#1F1612] text-xs font-bold rounded-xl transition shadow active:scale-95"
                >
                Đăng nhập tài khoản Manager
                </button>
            </div>
            </main>
        </div>
        );
    }

    return (
    <div className="min-h-screen bg-[#1F1612] text-[#F5EDE4] flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* HEADER QUẢN TRỊ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#3E291F] gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#D4A373]/15 border border-[#D4A373]/30 flex items-center justify-center text-[#D4A373]">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white">Quản Trị Menu & Bảng Giá</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-900/80 text-purple-200 border border-purple-700/60">
                  Manager Portal
                </span>
              </div>
              <p className="text-xs text-[#A89284] mt-0.5">
                Chỉnh sửa giá bán, bật tắt món còn hàng và cấu hình danh mục trực tiếp
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2D1F17] hover:bg-[#3D2B20] text-xs font-semibold text-[#D4A373] border border-[#4D3628] transition active:scale-95 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Đồng bộ lại</span>
          </button>
        </div>
        {/* THÔNG BÁO TOAST THÀNH CÔNG */}
        {toastMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{toastMsg}</span>
          </div>
        )}
        {/* CỤM CHUYỂN TABS */}
        <div className="flex items-center gap-2 mb-6 border-b border-[#3E291F] pb-4">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition ${
              activeTab === 'products'
                ? 'bg-[#D4A373] text-[#1F1612] shadow-md'
                : 'bg-[#2D1F17] text-[#A89284] hover:text-white border border-[#3E291F]'
            }`}
          >
            <Coffee className="w-4 h-4" />
            <span>Món đồ uống ({products.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition ${
              activeTab === 'categories'
                ? 'bg-[#D4A373] text-[#1F1612] shadow-md'
                : 'bg-[#2D1F17] text-[#A89284] hover:text-white border border-[#3E291F]'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Danh mục ({categories.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition ${
              activeTab === 'pricing'
                ? 'bg-[#D4A373] text-[#1F1612] shadow-md'
                : 'bg-[#2D1F17] text-[#A89284] hover:text-white border border-[#3E291F]'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Topping & Phụ thu Size</span>
          </button>
        </div>
        {/* NỘI DUNG TỪNG TAB */}
        {loading ? (
          <div className="py-20 text-center text-xs text-[#A89284]">
            <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-[#D4A373]" />
            <p>Đang tải dữ liệu thực đơn từ máy chủ...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-950/40 border border-red-500/40 rounded-3xl text-center text-red-300 text-xs">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-400" />
            <p className="font-bold">{error}</p>
          </div>
        ) : (
          <>
            {/* TAB 1: DANH SÁCH MÓN ĐỒ UỐNG */}
            {activeTab === 'products' && (
              <div className="bg-[#261A13] border border-[#3E291F] rounded-3xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#1F150F] text-[#A89284] uppercase font-bold border-b border-[#3E291F]">
                      <tr>
                        <th className="p-4">Tên món đồ uống</th>
                        <th className="p-4">Danh mục</th>
                        <th className="p-4">Giá gốc (Size S)</th>
                        <th className="p-4 text-center">Trạng thái bán</th>
                        <th className="p-4 text-right">Lưu giá</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#3A261C]">
                      {products.map((p) => {
                        const currentPriceInput = editedPrices[p.id] ?? p.price;
                        const isSaving = savingId === p.id;
                        return (
                          <tr key={p.id} className="hover:bg-[#2F2018] transition">
                            <td className="p-4 font-bold text-white flex items-center gap-3">
                              <span className="w-8 h-8 rounded-xl bg-[#3E291F] flex items-center justify-center text-sm">
                                ☕
                              </span>
                              <span>{p.name}</span>
                            </td>
                            <td className="p-4 text-[#D8C7B8]">
                              <span className="px-2 py-1 bg-[#1F150F] rounded-lg border border-[#3E291F]">
                                {p.category?.name || `Mã ${p.categoryId}`}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  value={currentPriceInput}
                                  onChange={(e) => setEditedPrices({ ...editedPrices, [p.id]: Number(e.target.value) })}
                                  className="w-24 px-2.5 py-1.5 rounded-xl bg-[#1F150F] border border-[#4A3224] text-white font-mono font-bold focus:outline-none focus:border-[#D4A373]"
                                />
                                <span className="text-[#A89284]">đ</span>
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => handleToggleProduct(p)}
                                disabled={isSaving}
                                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition active:scale-95 ${
                                  p.isAvailable
                                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/60'
                                    : 'bg-red-950/80 text-red-300 border border-red-600/60'
                                }`}
                              >
                                {p.isAvailable ? '✓ Đang bán' : '✕ Hết hàng'}
                              </button>
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => handleSaveProductPrice(p)}
                                disabled={isSaving || currentPriceInput === p.price}
                                className="px-3 py-1.5 rounded-xl bg-[#D4A373] hover:bg-[#C28E5C] disabled:opacity-30 text-[#1F1612] font-black inline-flex items-center gap-1 transition active:scale-95 shadow"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>Lưu</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {/* TAB 2: DANH MỤC */}
            {activeTab === 'categories' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((c) => (
                  <div key={c.id} className="p-5 rounded-3xl bg-[#261A13] border border-[#3E291F] flex items-center justify-between shadow">
                    <div>
                      <h3 className="text-sm font-bold text-white">{c.name}</h3>
                      <p className="text-[11px] text-[#A89284] mt-0.5">Mã danh mục #{c.id}</p>
                    </div>
                    <button
                      onClick={() => handleToggleCategory(c)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 ${
                        c.isActive
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/60'
                          : 'bg-stone-800 text-stone-400 border border-stone-700'
                      }`}
                    >
                      {c.isActive ? 'Đang hiện' : 'Đang ẩn'}
                    </button>
                  </div>
                ))}
              </div>
            )}
            {/* TAB 3: TOPPING & SIZE */}
            {activeTab === 'pricing' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* PHỤ THU SIZE */}
                <div className="bg-[#261A13] border border-[#3E291F] rounded-3xl p-6 shadow-xl">
                  <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                    <Tag className="w-5 h-5 text-[#D4A373]" />
                    <span>Cấu hình Phụ thu Size</span>
                  </h3>
                  <div className="space-y-4">
                    {sizes.map((s) => {
                      const currentVal = editedSizePrices[s.size] ?? s.surcharge;
                      return (
                        <div key={s.size} className="flex items-center justify-between p-3.5 bg-[#1F150F] rounded-2xl border border-[#3E291F]">
                          <span className="font-bold text-sm text-white">Size {s.size}</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={currentVal}
                              onChange={(e) => setEditedSizePrices({ ...editedSizePrices, [s.size]: Number(e.target.value) })}
                              className="w-24 px-2.5 py-1.5 rounded-xl bg-[#261A13] border border-[#4A3224] text-white font-mono font-bold text-xs"
                            />
                            <span className="text-xs text-[#A89284]">đ</span>
                            <button
                              onClick={() => handleSaveSize(s)}
                              disabled={currentVal === s.surcharge}
                              className="px-3 py-1.5 bg-[#D4A373] disabled:opacity-30 text-[#1F1612] font-black text-xs rounded-xl transition active:scale-95"
                            >
                              Lưu
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* BẢNG GIÁ TOPPING */}
                <div className="bg-[#261A13] border border-[#3E291F] rounded-3xl p-6 shadow-xl">
                  <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-[#D4A373]" />
                    <span>Bảng giá Topping ({toppings.length})</span>
                  </h3>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {toppings.map((t) => {
                      const curPrice = editedToppingPrices[t.code] ?? t.price;
                      return (
                        <div key={t.code} className="flex items-center justify-between p-3.5 bg-[#1F150F] rounded-2xl border border-[#3E291F]">
                          <div>
                            <span className="font-bold text-xs text-white block">{t.name}</span>
                            <span className="text-[10px] text-[#A89284] font-mono">{t.code}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={curPrice}
                              onChange={(e) => setEditedToppingPrices({ ...editedToppingPrices, [t.code]: Number(e.target.value) })}
                              className="w-24 px-2.5 py-1.5 rounded-xl bg-[#261A13] border border-[#4A3224] text-white font-mono font-bold text-xs"
                            />
                            <span className="text-xs text-[#A89284]">đ</span>
                            <button
                              onClick={() => handleSaveToppingPrice(t)}
                              disabled={curPrice === t.price}
                              className="px-3 py-1.5 bg-[#D4A373] disabled:opacity-30 text-[#1F1612] font-black text-xs rounded-xl transition active:scale-95"
                            >
                              Lưu
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}