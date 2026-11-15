import { test, expect, type APIRequestContext } from '@playwright/test';

// E2E Sprint 4: Quản lý bảng giá menu, Kho nguyên liệu tự trừ/hoàn, Báo cáo doanh thu (CN-11, CN-12, CN-13).
// Đối chiếu: FR-11, FR-14, FR-15, FR-16, FR-17, FR-18, FR-19 trong docs/traceability-matrix.md.

const API = process.env.E2E_API_URL ?? 'http://localhost:4003';
const MAT_KHAU = 'matkhau123';
const MANAGER_PHONE = '0900000003'; // Tài khoản Manager mặc định từ seed

const soDienThoaiMoi = () =>
  `09${String(Date.now()).slice(-6)}${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`;

type TaiKhoan = { phone: string; accessToken: string; headers: { Authorization: string } };

async function dangNhapApi(request: APIRequestContext, phone: string): Promise<TaiKhoan> {
  const res = await request.post(`${API}/auth/login`, { data: { phone, password: MAT_KHAU } });
  expect(res.status()).toBe(200);
  const { accessToken } = await res.json();
  return { phone, accessToken, headers: { Authorization: `Bearer ${accessToken}` } };
}

async function taoKhach(request: APIRequestContext): Promise<TaiKhoan> {
  const phone = soDienThoaiMoi();
  const dk = await request.post(`${API}/auth/register`, { data: { phone, password: MAT_KHAU } });
  expect(dk.status()).toBe(201);
  return dangNhapApi(request, phone);
}

// =================================================================
// 1. KỊCH BẢN MENU & BẢNG GIÁ (CN-11 / FR-18, UC-15)
// =================================================================
test.describe('Sprint 4 - Quản lý bảng giá Menu (FR-18)', () => {
  test('Manager đổi giá món: đơn mới áp giá mới, đơn cũ giữ nguyên giá gốc', async ({ request }) => {
    const manager = await dangNhapApi(request, MANAGER_PHONE);
    const khachA = await taoKhach(request);
    const khachB = await taoKhach(request);

    // 1. Khách A đặt món #1 (Cà phê sữa) khi giá gốc là 29.000đ + size M 5.000đ = 34.000đ
    const resDonA = await request.post(`${API}/orders`, {
      headers: khachA.headers,
      data: { items: [{ productId: 1, quantity: 1, size: 'M' }] },
    });
    expect(resDonA.status()).toBe(201);
    const donA = await resDonA.json();
    const tongCu = donA.total;

    // 2. Manager đổi giá món #1 từ 29.000đ lên 39.000đ (+10.000đ)
    const resDoiGia = await request.patch(`${API}/admin/products/1`, {
      headers: manager.headers,
      data: { price: 39000 },
    });
    expect(resDoiGia.status()).toBe(200);

    try {
      // 3. Khách B đặt cùng món #1 sau khi đổi giá -> Tổng tiền phải tăng thêm đúng 10.000đ
      const resDonB = await request.post(`${API}/orders`, {
        headers: khachB.headers,
        data: { items: [{ productId: 1, quantity: 1, size: 'M' }] },
      });
      expect(resDonB.status()).toBe(201);
      const donB = await resDonB.json();
      expect(donB.total).toBe(tongCu + 10000);

      // 4. Kiểm tra lại đơn của Khách A: Tổng tiền vẫn giữ nguyên giá cũ (không bị tính lại)
      const resDsA = await request.get(`${API}/orders/me`, { headers: khachA.headers });
      const donACheck = (await resDsA.json()).find((o: { id: string }) => o.id === donA.id);
      expect(donACheck.total).toBe(tongCu);
    } finally {
      // Dọn dẹp (Cleanup): Luôn luôn khôi phục lại giá gốc 29.000đ
      await request.patch(`${API}/admin/products/1`, {
        headers: manager.headers,
        data: { price: 29000 },
      });
    }
  });
});

// =================================================================
// 2. KỊCH BẢN KHO: NHẬP KHO, TRỪ KHO, HOÀN KHO (CN-12 / FR-15, FR-16, FR-17)
// =================================================================
test.describe('Sprint 4 - Quản lý Kho nguyên liệu & Công thức (FR-15, FR-16, FR-17)', () => {
  test('Quy trình kho: Nhập kho -> Đặt đơn trừ kho -> Hủy đơn hoàn kho', async ({ request }) => {
    const manager = await dangNhapApi(request, MANAGER_PHONE);
    const khach = await taoKhach(request);

    // 1. Tạo nguyên liệu test độc lập và thiết lập công thức (1 ly Cà phê đen size S cần 15g)
    const tenNguyenLieu = `CafeTest_${Date.now()}`;
    const resTaoNL = await request.post(`${API}/admin/ingredients`, {
      headers: manager.headers,
      data: { name: tenNguyenLieu, unit: 'G', minStock: 100 },
    });
    expect(resTaoNL.status()).toBe(201);
    const nguyenLieu = await resTaoNL.json();
    const nguyenLieuId = nguyenLieu.id;

    // Gán công thức cho món #2 (size S tiêu hao 15 đơn vị nguyên liệu này)
    const resRecipe = await request.put(`${API}/admin/products/2/recipe`, {
      headers: manager.headers,
      data: {
        items: [{ size: 'S', ingredientId: nguyenLieuId, quantity: 15 }],
      },
    });
    expect(resRecipe.status()).toBe(200);

    // 2. Nhập kho 1.000 đơn vị qua phiếu nhập kho
    const resNhapKho = await request.post(`${API}/admin/ingredients/${nguyenLieuId}/receipts`, {
      headers: manager.headers,
      data: { quantity: 1000, note: 'E2E test nhập kho ban đầu' },
    });
    expect(resNhapKho.status()).toBe(201);
    const kqNhap = await resNhapKho.json();
    expect(kqNhap.stock).toBe(1000);

    // 3. Khách đặt 1 ly Cà phê đen size S và thanh toán -> Tự động trừ 15 đơn vị kho
    const resDon = await request.post(`${API}/orders`, {
      headers: khach.headers,
      data: { items: [{ productId: 2, quantity: 1, size: 'S' }] },
    });
    expect(resDon.status()).toBe(201);
    const don = await resDon.json();

    // Thanh toán đơn để kích hoạt trừ kho
    const resPay = await request.post(`${API}/payments`, {
      headers: khach.headers,
      data: { orderId: don.id, method: 'WALLET' },
    });
    expect(resPay.status()).toBe(201);
    expect((await resPay.json()).status).toBe('PAID');

    // Kiểm tra tồn kho sau khi thanh toán: 1.000 - 15 = 985
    const resKhoSauBan = await request.get(`${API}/admin/ingredients`, { headers: manager.headers });
    const nguyenLieuSauBan = (await resKhoSauBan.json()).find((i: { id: number }) => i.id === nguyenLieuId);
    expect(nguyenLieuSauBan.stock).toBe(985);

    // 4. Khách hủy đơn đã thanh toán -> Hệ thống phải tự động hoàn lại 15 đơn vị kho
    const resHuy = await request.post(`${API}/orders/${don.id}/cancel`, {
      headers: khach.headers,
      data: { reason: 'E2E test hủy đơn hoàn kho' },
    });
    expect(resHuy.status()).toBe(201);

    // Kiểm tra tồn kho sau khi hủy: Phải được hoàn lại chính xác về 1.000
    const resKhoSauHuy = await request.get(`${API}/admin/ingredients`, { headers: manager.headers });
    const nguyenLieuSauHuy = (await resKhoSauHuy.json()).find((i: { id: number }) => i.id === nguyenLieuId);
    expect(nguyenLieuSauHuy.stock).toBe(1000);
  });
});

// =================================================================
// 3. KỊCH BẢN BÁO CÁO & PHÂN QUYỀN (CN-13 / FR-14, UC-19)
// =================================================================
test.describe('Sprint 4 - Báo cáo doanh thu & Phân quyền Manager (FR-14)', () => {
  test('Manager xem báo cáo theo ngày/tuần/tháng; Khách hàng bị chặn truy cập', async ({ request }) => {
    const manager = await dangNhapApi(request, MANAGER_PHONE);
    const khach = await taoKhach(request);

    // 1. Manager gọi API báo cáo thành công với đầy đủ các trường KPI
    const resBaoCao = await request.get(`${API}/admin/reports?groupBy=day`, {
      headers: manager.headers,
    });
    expect(resBaoCao.status()).toBe(200);
    const data = await resBaoCao.json();

    // Kiểm tra cấu trúc dữ liệu theo hợp đồng API
    expect(data).toHaveProperty('totals');
    expect(data.totals).toHaveProperty('revenue');
    expect(data.totals).toHaveProperty('completedOrders');
    expect(data.totals).toHaveProperty('cancelRate');
    expect(Array.isArray(data.series)).toBe(true);
    expect(Array.isArray(data.topProducts)).toBe(true);

    // 2. Khách hàng thông thường gọi báo cáo -> Phải bị từ chối 403 Forbidden
    const resKhachGoi = await request.get(`${API}/admin/reports?groupBy=day`, {
      headers: khach.headers,
    });
    expect(resKhachGoi.status()).toBe(403);

    // 3. Không có token -> Bị chặn 401 Unauthorized
    const resKhongToken = await request.get(`${API}/admin/reports`);
    expect(resKhongToken.status()).toBe(401);
  });
});