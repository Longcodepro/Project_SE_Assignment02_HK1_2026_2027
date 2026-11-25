'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import Navbar from '@/components/Navbar';
import { useAuthStore } from '@/store/useAuthStore';
import { apiService } from '@/services/api';
import { AdminProduct, AdminCategory, AdminTopping, SizeSurcharge, Ingredient } from '@/types';

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
    
    // State cho thêm Danh mục
    const [newCatName, setNewCatName] = useState('');

    // State cho thêm Món nước
    const [isAddingProd, setIsAddingProd] = useState(false);
    const [newProdName, setNewProdName] = useState('');
    const [newProdPrice, setNewProdPrice] = useState<number | ''>('');
    const [newProdCatId, setNewProdCatId] = useState<number | ''>('');
    const [newProdImg, setNewProdImg] = useState('');
    const [newProdDesc, setNewProdDesc] = useState('');

    // State thêm topping mới (Chỉ Manager)
    const [isAddingTopping, setIsAddingTopping] = useState<boolean>(false);
    const [newToppingCode, setNewToppingCode] = useState<string>('');
    const [newToppingName, setNewToppingName] = useState<string>('');
    const [newToppingPrice, setNewToppingPrice] = useState<number | ''>('');
    const [submittingTopping, setSubmittingTopping] = useState<boolean>(false);

    // State quản lý xem/sửa công thức của topping đang chọn
  const [selectedToppingForRecipe, setSelectedToppingForRecipe] = useState<AdminTopping | null>(null);
  const [toppingRecipeItems, setToppingRecipeItems] = useState<Array<{ ingredientId: number; quantity: number }>>([]);
  const [availableIngredients, setAvailableIngredients] = useState<Ingredient[]>([]);
  const [loadingToppingRecipe, setLoadingToppingRecipe] = useState<boolean>(false);
  const [savingToppingRecipe, setSavingToppingRecipe] = useState<boolean>(false);

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

     // Xử lý tạo danh mục
    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !newCatName.trim()) return;
        try {
            const created = await apiService.createCategory(newCatName.trim(), token);
            setCategories(prev => [...prev, created]);
            setNewCatName('');
            showToast(`Đã thêm danh mục: ${created.name}`);
        } catch {
            alert('Lỗi tạo danh mục!');
        }
    };

     // Xử lý tạo món nước
    const handleCreateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !newProdName || !newProdPrice || !newProdCatId || !newProdImg) {
            alert('Vui lòng điền đầy đủ tên, giá, danh mục và link ảnh món!');
            return;
        }
        try {
            const created = await apiService.createProduct({
                name: newProdName.trim(),
                price: Number(newProdPrice),
                categoryId: Number(newProdCatId),
                imageUrl: newProdImg.trim(),
                description: newProdDesc.trim() || undefined,
            }, token);
            setProducts(prev => [...prev, created]);
            setIsAddingProd(false);
            setNewProdName('');
            setNewProdPrice('');
            setNewProdDesc('');
            showToast(`Đã thêm món mới: ${created.name}`);
        } catch {
            alert('Lỗi thêm món mới!');
        }
    };

     // Tự động chuyển tên có dấu thành slug không dấu chuẩn cho mã code
    const handleToppingNameChange = (name: string) => {
        setNewToppingName(name);
        // Tự động gợi ý code nếu code đang rỗng hoặc chưa bị sửa thủ công
        const slug = name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 32);
        setNewToppingCode(slug);
    };

    // Xử lý gửi API tạo topping mới
    const handleCreateTopping = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token || !newToppingCode.trim() || !newToppingName.trim() || newToppingPrice === '') {
            showToast('Vui lòng điền đầy đủ mã, tên và giá topping!');
            return;
        }
        setSubmittingTopping(true);
        try {
            const created = await apiService.createTopping({
                code: newToppingCode.trim().toLowerCase(),
                name: newToppingName.trim(),
                price: Number(newToppingPrice),
            }, token);
            setToppings(prev => [...prev, created]);
            setIsAddingTopping(false);
            setNewToppingCode('');
            setNewToppingName('');
            setNewToppingPrice('');
            showToast(`Đã thêm topping mới: ${created.name}`);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Lỗi khi tạo topping';
            showToast(msg);
        } finally {
            setSubmittingTopping(false);
        }
    };

    // 1. Mở modal và nạp công thức của topping
const handleOpenToppingRecipe = async (topping: AdminTopping) => {
    setSelectedToppingForRecipe(topping);
    if (!token) return;
    setLoadingToppingRecipe(true);
    try {
        // Tải danh sách nguyên liệu kho và công thức topping cùng lúc
        const [ingList, recipe] = await Promise.all([
            availableIngredients.length === 0 ? apiService.getAdminIngredients(token) : Promise.resolve(availableIngredients),
            apiService.getToppingRecipe(topping.code, token)
        ]);
        if (availableIngredients.length === 0) setAvailableIngredients(ingList);
        setToppingRecipeItems(recipe.items.map(it => ({ ingredientId: it.ingredientId, quantity: it.quantity })));
    } catch {
        setToppingRecipeItems([]);
    } finally {
        setLoadingToppingRecipe(false);
    }
};

// 2. Thêm một dòng nguyên liệu cho topping
const handleAddToppingRow = () => {
    if (availableIngredients.length === 0) return;
    // Chọn nguyên liệu chưa có trong danh sách
    const existingIds = new Set(toppingRecipeItems.map(it => it.ingredientId));
    const available = availableIngredients.find(ing => !existingIds.has(ing.id)) || availableIngredients[0];
    setToppingRecipeItems(prev => [...prev, { ingredientId: available.id, quantity: 10 }]);
};
// 3. Xóa dòng nguyên liệu
const handleRemoveToppingRow = (index: number) => {
    setToppingRecipeItems(prev => prev.filter((_, idx) => idx !== index));
};
// 4. Lưu công thức topping lên Backend
const handleSaveToppingRecipe = async () => {
    if (!token || !selectedToppingForRecipe) return;
    // Client validate: Kiểm tra trùng lặp nguyên liệu
    const ids = toppingRecipeItems.map(i => i.ingredientId);
    if (new Set(ids).size !== ids.length) {
        showToast('Mỗi nguyên liệu chỉ được khai báo một lần trong công thức topping!');
        return;
    }
    setSavingToppingRecipe(true);
    try {
        await apiService.updateToppingRecipe(selectedToppingForRecipe.code, toppingRecipeItems, token);
        showToast(`Đã lưu công thức cho topping ${selectedToppingForRecipe.name}!`);
        setSelectedToppingForRecipe(null);
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Lỗi khi lưu công thức';
        showToast(msg);
    } finally {
        setSavingToppingRecipe(false);
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
              <div className="space-y-4">
                {/* NÚT BẬT FORM THÊM MÓN MỚI */}
                <div className="flex justify-end">
                  <button
                    onClick={() => setIsAddingProd(!isAddingProd)}
                    className="px-4 py-2 bg-[#D4A373] hover:bg-[#C28E5C] text-[#1F1612] font-black text-xs rounded-xl transition shadow active:scale-95"
                  >
                    {isAddingProd ? '✕ Đóng form' : '+ Thêm món mới'}
                  </button>
                </div>

                {/* FORM THÊM MÓN MỚI */}
                {isAddingProd && (
                  <form onSubmit={handleCreateProduct} className="p-5 bg-[#261A13] border border-[#D4A373]/40 rounded-3xl space-y-3 shadow-xl">
                    <h3 className="text-xs font-black text-[#D4A373] uppercase tracking-wider">Thông tin món nước mới</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <input
                        type="text"
                        placeholder="Tên món (VD: Cà phê dừa)..."
                        value={newProdName}
                        onChange={(e) => setNewProdName(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-[#1F150F] border border-[#4A3224] text-white text-xs"
                      />
                      <input
                        type="number"
                        placeholder="Giá gốc Size S (VD: 35000)..."
                        value={newProdPrice}
                        onChange={(e) => setNewProdPrice(e.target.value ? Number(e.target.value) : '')}
                        className="px-3 py-2 rounded-xl bg-[#1F150F] border border-[#4A3224] text-white text-xs font-mono"
                      />
                      <select
                        value={newProdCatId}
                        onChange={(e) => setNewProdCatId(e.target.value ? Number(e.target.value) : '')}
                        className="px-3 py-2 rounded-xl bg-[#1F150F] border border-[#4A3224] text-[#D8C7B8] text-xs"
                      >
                        <option value="">-- Chọn danh mục --</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="URL ảnh món nước..."
                        value={newProdImg}
                        onChange={(e) => setNewProdImg(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-[#1F150F] border border-[#4A3224] text-white text-xs"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="submit"
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition active:scale-95"
                      >
                        Lưu món vào Menu
                      </button>
                    </div>
                  </form>
                )}

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
              </div>
            )}
            {/* TAB 2: DANH MỤC */}
            {activeTab === 'categories' && (
              <div className="space-y-4">
                {/* FORM THÊM DANH MỤC MỚI */}
                <form onSubmit={handleCreateCategory} className="flex gap-2 p-4 bg-[#261A13] border border-[#3E291F] rounded-2xl">
                  <input
                    type="text"
                    placeholder="Nhập tên danh mục mới (VD: Trà trái cây, Bánh ngọt)..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-[#1F150F] border border-[#4A3224] text-white text-xs focus:outline-none focus:border-[#D4A373]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#D4A373] hover:bg-[#C28E5C] text-[#1F1612] font-black text-xs rounded-xl transition shadow active:scale-95"
                  >
                    + Thêm danh mục
                  </button>
                </form>
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
                <div className="bg-[#261A13] border border-[#3E291F] rounded-3xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Layers className="w-5 h-5 text-[#D4A373]" />
                      <span>Bảng giá Topping ({toppings.length})</span>
                    </h3>
                    {/* Nút bật/tắt form thêm topping */}
                    {isManager && (
                      <button
                        onClick={() => setIsAddingTopping(!isAddingTopping)}
                        className="px-3 py-1.5 bg-[#D4A373] hover:bg-[#C28E5C] text-[#1F1612] font-black text-xs rounded-xl transition shadow active:scale-95"
                      >
                        {isAddingTopping ? '✕ Đóng' : '+ Thêm Topping'}
                      </button>
                    )}
                  </div>

                  {/* FORM THÊM TOPPING MỚI (POST /admin/toppings) */}
                  {isAddingTopping && isManager && (
                    <form onSubmit={handleCreateTopping} className="p-4 bg-[#1F150F] border border-[#D4A373]/40 rounded-2xl space-y-3 shadow-inner">
                      <h4 className="text-xs font-black text-[#D4A373] uppercase tracking-wider">Thông tin Topping mới</h4>
                      <div className="space-y-2.5">
                        <div>
                          <label className="text-[10px] text-[#A89284] font-semibold block mb-1">Tên topping</label>
                          <input
                            type="text"
                            placeholder="VD: Pudding trứng, Thạch dừa..."
                            value={newToppingName}
                            onChange={(e) => handleToppingNameChange(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-[#261A13] border border-[#4A3224] text-white text-xs focus:outline-none focus:border-[#D4A373]"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-[#A89284] font-semibold block mb-1">Mã code (duy nhất)</label>
                            <input
                              type="text"
                              placeholder="VD: pudding-trung"
                              value={newToppingCode}
                              onChange={(e) => setNewToppingCode(e.target.value.toLowerCase())}
                              className="w-full px-3 py-2 rounded-xl bg-[#261A13] border border-[#4A3224] text-amber-400 font-mono text-xs focus:outline-none focus:border-[#D4A373]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-[#A89284] font-semibold block mb-1">Đơn giá bán (VNĐ)</label>
                            <input
                              type="number"
                              min="0"
                              placeholder="VD: 8000"
                              value={newToppingPrice}
                              onChange={(e) => setNewToppingPrice(e.target.value ? Number(e.target.value) : '')}
                              className="w-full px-3 py-2 rounded-xl bg-[#261A13] border border-[#4A3224] text-white font-mono text-xs focus:outline-none focus:border-[#D4A373]"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="submit"
                          disabled={submittingTopping}
                          className="px-4 py-2 bg-[#D4A373] hover:bg-[#C28E5C] text-[#1F1612] font-black text-xs rounded-xl shadow transition active:scale-95 disabled:opacity-50"
                        >
                          {submittingTopping ? 'Đang tạo...' : 'Lưu Topping'}
                        </button>
                      </div>
                    </form>
                  )}

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
                            <button
                              type="button"
                              onClick={() => handleOpenToppingRecipe(t)}
                              className="px-2.5 py-1.5 bg-[#3E291F] hover:bg-[#4E3528] text-amber-400 text-xs font-semibold rounded-xl transition active:scale-95 shadow"
                              title="Xem và sửa công thức định lượng"
                            >
                              Công thức
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

        {/* MODAL CÔNG THỨC TOPPING */}
        {selectedToppingForRecipe && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-[#1F150F] border border-[#D4A373]/40 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
              <div className="flex justify-between items-center border-b border-[#3E291F] pb-3">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#D4A373]" />
                    <span>Công thức: {selectedToppingForRecipe.name}</span>
                  </h3>
                  <p className="text-[11px] text-[#A89284] mt-0.5">
                    Định lượng nguyên liệu tiêu hao cho 1 phần topping (mã: <span className="font-mono text-amber-400">{selectedToppingForRecipe.code}</span>)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedToppingForRecipe(null)}
                  className="w-7 h-7 rounded-lg bg-[#261A13] hover:bg-[#3E291F] text-[#A89284] hover:text-white flex items-center justify-center text-xs transition"
                >
                  ✕
                </button>
              </div>

              {loadingToppingRecipe ? (
                <div className="py-12 text-center text-xs text-[#A89284] flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-[#D4A373]" />
                  <span>Đang tải công thức...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-[#A89284] border-b border-[#3E291F] font-bold">
                          <th className="py-2 px-1">Nguyên liệu</th>
                          <th className="py-2 px-1">Định lượng / phần</th>
                          <th className="py-2 px-1 text-right">Xóa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#3E291F]/50">
                        {toppingRecipeItems.map((item, idx) => {
                          const curIng = availableIngredients.find(ing => ing.id === item.ingredientId);
                          return (
                            <tr key={idx} className="hover:bg-[#261A13]/50">
                              <td className="py-2 px-1">
                                <select
                                  value={item.ingredientId}
                                  onChange={(e) => {
                                    const next = [...toppingRecipeItems];
                                    next[idx].ingredientId = Number(e.target.value);
                                    setToppingRecipeItems(next);
                                  }}
                                  className="px-2 py-1.5 bg-[#261A13] border border-[#4A3224] text-white rounded-xl text-xs w-full max-w-[200px] focus:outline-none focus:border-[#D4A373]"
                                >
                                  {availableIngredients.map(ing => (
                                    <option key={ing.id} value={ing.id}>
                                      {ing.name} ({ing.unit})
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-2 px-1">
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => {
                                      const next = [...toppingRecipeItems];
                                      next[idx].quantity = Math.max(1, Number(e.target.value) || 1);
                                      setToppingRecipeItems(next);
                                    }}
                                    className="w-20 px-2.5 py-1.5 bg-[#261A13] border border-[#4A3224] text-white rounded-xl text-xs font-mono focus:outline-none focus:border-[#D4A373]"
                                  />
                                  <span className="text-[#A89284] text-xs font-medium">{curIng?.unit || ''}</span>
                                </div>
                              </td>
                              <td className="py-2 px-1 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveToppingRow(idx)}
                                  className="p-1 rounded-lg hover:bg-red-950/60 text-[#A89284] hover:text-red-400 transition"
                                  title="Xóa nguyên liệu này"
                                >
                                  ✕
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {toppingRecipeItems.length === 0 && (
                          <tr>
                            <td colSpan={3} className="py-6 text-center text-[#A89284]">
                              Topping này chưa có nguyên liệu định lượng.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddToppingRow}
                    className="text-xs text-[#D4A373] hover:text-[#C28E5C] font-bold transition inline-flex items-center gap-1"
                  >
                    + Thêm nguyên liệu cho topping
                  </button>
                </div>
              )}

              <div className="flex justify-end gap-2.5 pt-4 border-t border-[#3E291F]">
                <button
                  type="button"
                  onClick={() => setSelectedToppingForRecipe(null)}
                  className="px-4 py-2 bg-[#261A13] hover:bg-[#3E291F] text-[#A89284] hover:text-white text-xs font-bold rounded-xl transition"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  disabled={savingToppingRecipe}
                  onClick={handleSaveToppingRecipe}
                  className="px-5 py-2 bg-[#D4A373] hover:bg-[#C28E5C] text-[#1F1612] text-xs font-black rounded-xl shadow transition active:scale-95 disabled:opacity-50"
                >
                  {savingToppingRecipe ? 'Đang lưu...' : 'Lưu công thức'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}