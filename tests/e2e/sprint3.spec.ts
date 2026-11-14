import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// E2E Sprint 3: pha chế, mã nhận hàng, hủy đơn, voucher, đánh giá (CN-08, CN-09, CN-10).
// Chạy trên hệ thống thật (web + API + PostgreSQL đã seed tài khoản nhân viên).
// Đối chiếu: FR-11, FR-12, FR-13, FR-20, FR-21 trong docs/traceability-matrix.md.

const API = process.env.E2E_API_URL ?? 'http://localhost:4003';
const MAT_KHAU = 'matkhau123';
// Tài khoản nhân viên do bước seed tạo (mật khẩu mặc định khi chạy ngoài production)
const BARISTA = '0900000001';
const CASHIER = '0900000002';

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

// Cà phê sữa (29.000) size M + trân châu (8.000) = 42.000đ mỗi ly, tính theo bảng giá seed của server
const LY_42K = { productId: 1, quantity: 1, size: 'M', toppings: ['tran-chau'] };

async function datDon(
  request: APIRequestContext,
  khach: TaiKhoan,
  opts: { items?: object[]; promoCode?: string } = {},
) {
  const res = await request.post(`${API}/orders`, {
    headers: khach.headers,
    data: { items: opts.items ?? [LY_42K], ...(opts.promoCode ? { promoCode: opts.promoCode } : {}) },
  });
  expect(res.status()).toBe(201);
  return (await res.json()) as { id: string; total: number; discountAmount: number; promoCode: string | null };
}

async function thanhToan(request: APIRequestContext, khach: TaiKhoan, orderId: string) {
  const res = await request.post(`${API}/payments`, {
    headers: khach.headers,
    data: { orderId, method: 'WALLET' },
  });
  expect(res.status()).toBe(201);
  expect((await res.json()).status).toBe('PAID');
}

async function donCuaToi(request: APIRequestContext, khach: TaiKhoan, orderId: string) {
  const ds = await (await request.get(`${API}/orders/me`, { headers: khach.headers })).json();
  return ds.find((o: { id: string }) => o.id === orderId);
}

// Barista chuyển đơn qua API (đúng version lấy từ màn KDS)
async function baristaChuyen(request: APIRequestContext, orderId: string, status: 'PREPARING' | 'READY') {
  const barista = await dangNhapApi(request, BARISTA);
  const ds = await (await request.get(`${API}/kds/orders`, { headers: barista.headers })).json();
  const hien = ds.find((o: { id: string }) => o.id === orderId);
  const res = await request.patch(`${API}/kds/orders/${orderId}/status`, {
    headers: barista.headers,
    data: { status, version: hien.version },
  });
  expect(res.status()).toBe(200);
}

// Đưa phiên đăng nhập vào trình duyệt như sau khi đăng nhập qua giao diện
async function vaoVoiTaiKhoan(page: Page, tk: TaiKhoan, role: string) {
  await page.addInitScript(
    ([token, r, phone]) => {
      localStorage.setItem('brewlite_token', token);
      localStorage.setItem(
        'brewlite_auth',
        JSON.stringify({ state: { token, user: { phone, role: r, name: phone } }, version: 0 }),
      );
    },
    [tk.accessToken, role, tk.phone],
  );
}

async function dangNhapQuaGiaoDien(page: Page, phone: string) {
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).first().click();
  await page.getByPlaceholder('0912345678').fill(phone);
  await page.getByPlaceholder('••••••••').fill(MAT_KHAU);
  await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
  await expect(page.getByTitle('Đăng xuất tài khoản')).toBeVisible();
}

const maNgan = (orderId: string) => orderId.slice(-6).toUpperCase();

// ---- Hủy đơn (FR-12, UC-08, UC-13) ----

test.describe('Hủy đơn hàng', () => {
  test('Khách hủy đơn chưa thanh toán, không cần lý do, không hoàn tiền', async ({ page, request }) => {
    const khach = await taoKhach(request);
    const don = await datDon(request, khach);

    await vaoVoiTaiKhoan(page, khach, 'CUSTOMER');
    await page.goto('/orders');
    await page.getByRole('button', { name: 'Hủy đơn' }).click();
    await expect(page.getByText('Đơn chưa thanh toán nên không phát sinh hoàn tiền.')).toBeVisible();
    await page.getByRole('button', { name: 'Xác nhận hủy đơn' }).click();

    await expect(page.getByRole('status').getByText(`Đã hủy đơn #${don.id}.`)).toBeVisible();
    await expect(page.getByText('Đã hủy', { exact: true })).toBeVisible();
    const sau = await donCuaToi(request, khach, don.id);
    expect(sau).toMatchObject({ status: 'CANCELLED', refundedAt: null });
  });

  test('Khách hủy đơn đã thanh toán: bắt buộc lý do, hoàn tiền mô phỏng và trừ lại điểm', async ({ page, request }) => {
    const khach = await taoKhach(request);
    const don = await datDon(request, khach);
    await thanhToan(request, khach, don.id);
    expect((await (await request.get(`${API}/loyalty/me`, { headers: khach.headers })).json()).balance).toBe(42);

    await vaoVoiTaiKhoan(page, khach, 'CUSTOMER');
    await page.goto('/orders');
    await page.getByRole('button', { name: 'Hủy đơn' }).click();

    // Thiếu lý do thì không gửi
    await page.getByRole('button', { name: 'Xác nhận hủy đơn' }).click();
    await expect(page.getByRole('alert').getByText('Vui lòng ghi lý do hủy đơn đã thanh toán.')).toBeVisible();
    expect((await donCuaToi(request, khach, don.id)).status).toBe('PAID');

    await page.getByLabel(/Lý do hủy/).fill('Đổi ý, không muốn uống nữa');
    await page.getByRole('button', { name: 'Xác nhận hủy đơn' }).click();
    await expect(page.getByRole('status').getByText(/Tiền được hoàn lại/)).toBeVisible();

    await expect(page.getByText('Lý do hủy: Đổi ý, không muốn uống nữa')).toBeVisible();
    await expect(page.getByText(/Đã hoàn tiền lúc/)).toBeVisible();
    const sau = await donCuaToi(request, khach, don.id);
    expect(sau).toMatchObject({ status: 'CANCELLED', cancelReason: 'Đổi ý, không muốn uống nữa' });
    expect(sau.refundedAt).not.toBeNull();
    expect((await (await request.get(`${API}/loyalty/me`, { headers: khach.headers })).json()).balance).toBe(0);
  });

  test('Barista nhận pha trước khi khách bấm hủy: báo 409, làm mới và không hủy được nữa', async ({ page, request }) => {
    const khach = await taoKhach(request);
    const don = await datDon(request, khach);
    await thanhToan(request, khach, don.id);

    await vaoVoiTaiKhoan(page, khach, 'CUSTOMER');
    await page.goto('/orders');
    await page.getByRole('button', { name: 'Hủy đơn' }).click();
    await page.getByLabel(/Lý do hủy/).fill('Đổi ý');

    // Trong lúc khách đang mở hộp thoại, Barista bấm PREPARING
    await baristaChuyen(request, don.id, 'PREPARING');
    await page.getByRole('button', { name: 'Xác nhận hủy đơn' }).click();

    await expect(page.getByRole('status').getByText(/vừa được cập nhật nên không thể hủy/)).toBeVisible();
    expect((await donCuaToi(request, khach, don.id)).status).toBe('PREPARING');
    // Sau khi làm mới, đơn đang pha không còn nút hủy
    await expect(page.getByText('Đang pha chế').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Hủy đơn' })).toHaveCount(0);
  });

  test('Cashier hủy đơn đã thanh toán tại quầy: bắt buộc lý do, hoàn tiền và trừ điểm', async ({ page, request }) => {
    const khach = await taoKhach(request);
    const don = await datDon(request, khach);
    await thanhToan(request, khach, don.id);

    await page.goto('/cashier');
    await dangNhapQuaGiaoDien(page, CASHIER);
    await page.getByTestId(`cashier-paid-${don.id}`).getByRole('button', { name: 'Hủy đơn' }).click();

    await page.getByRole('button', { name: 'Xác nhận hủy đơn' }).click();
    await expect(page.getByRole('alert').getByText('Vui lòng ghi lý do hủy đơn đã thanh toán.')).toBeVisible();
    await page.getByLabel(/Lý do hủy/).fill('Hết nguyên liệu');
    await page.getByRole('button', { name: 'Xác nhận hủy đơn' }).click();

    await expect(page.getByRole('status').getByText(new RegExp(`Đã hủy đơn #${maNgan(don.id)}`))).toBeVisible();
    const sau = await donCuaToi(request, khach, don.id);
    expect(sau).toMatchObject({ status: 'CANCELLED', cancelReason: 'Hết nguyên liệu' });
    expect(sau.refundedAt).not.toBeNull();
    expect((await (await request.get(`${API}/loyalty/me`, { headers: khach.headers })).json()).balance).toBe(0);
  });
});

// ---- Đánh giá sau khi nhận món (FR-13, UC-09) ----

// Đưa một đơn đi hết vòng đời qua API: thanh toán, pha chế, sẵn sàng, Cashier nhập mã giao món
async function donDaHoanTat(request: APIRequestContext, khach: TaiKhoan) {
  const don = await datDon(request, khach);
  await thanhToan(request, khach, don.id);
  await baristaChuyen(request, don.id, 'PREPARING');
  await baristaChuyen(request, don.id, 'READY');
  const { pickupCode } = await donCuaToi(request, khach, don.id);
  const cashier = await dangNhapApi(request, CASHIER);
  const res = await request.post(`${API}/cashier/orders/${don.id}/complete`, {
    headers: cashier.headers,
    data: { pickupCode },
  });
  expect(res.status()).toBe(200);
  return don;
}

test.describe('Đánh giá đơn hàng', () => {
  test('Popup tự bật cho đơn đã nhận món; chấm sao, gửi và không đánh giá được lần hai', async ({ page, request }) => {
    const khach = await taoKhach(request);
    const don = await donDaHoanTat(request, khach);

    await vaoVoiTaiKhoan(page, khach, 'CUSTOMER');
    await page.goto('/orders');
    const popup = page.getByRole('dialog', { name: 'Đánh giá đơn hàng' });
    await expect(popup).toBeVisible();

    // Chưa chọn sao thì không gửi
    await popup.getByRole('button', { name: 'Gửi đánh giá' }).click();
    await expect(popup.getByRole('alert').getByText('Vui lòng chọn từ 1 đến 5 sao.')).toBeVisible();
    expect((await donCuaToi(request, khach, don.id)).review).toBeNull();

    await popup.getByRole('radio', { name: '4 sao' }).click();
    await popup.getByLabel(/Nhận xét/).fill('Cà phê ngon, ra món nhanh');
    await popup.getByRole('button', { name: 'Gửi đánh giá' }).click();

    await expect(page.getByRole('status').getByText(/Cảm ơn bạn đã đánh giá/)).toBeVisible();
    await expect(page.getByTestId('review-done')).toContainText('Bạn đã đánh giá');
    await expect(page.getByTestId('review-done')).toContainText('Cà phê ngon, ra món nhanh');
    await expect(popup).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Đánh giá đơn này' })).toHaveCount(0);
    expect((await donCuaToi(request, khach, don.id)).review).toEqual({ stars: 4, comment: 'Cà phê ngon, ra món nhanh' });

    // Tải lại không hiện popup nữa; gọi API lần hai bị từ chối
    await page.reload();
    await expect(page.getByTestId('review-done')).toBeVisible();
    await expect(page.getByRole('dialog', { name: 'Đánh giá đơn hàng' })).toHaveCount(0);
    const lanHai = await request.post(`${API}/orders/${don.id}/review`, { headers: khach.headers, data: { stars: 5 } });
    expect(lanHai.status()).toBe(409);
  });

  test('Bấm Để sau: popup không hiện lại, vẫn đánh giá được bằng nút trên đơn', async ({ page, request }) => {
    const khach = await taoKhach(request);
    const don = await donDaHoanTat(request, khach);

    await vaoVoiTaiKhoan(page, khach, 'CUSTOMER');
    await page.goto('/orders');
    const popup = page.getByRole('dialog', { name: 'Đánh giá đơn hàng' });
    await popup.getByRole('button', { name: 'Để sau' }).click();
    await expect(popup).toHaveCount(0);

    await page.reload();
    await expect(page.getByRole('button', { name: 'Đánh giá đơn này' })).toBeVisible();
    await expect(popup).toHaveCount(0);

    await page.getByRole('button', { name: 'Đánh giá đơn này' }).click();
    await popup.getByRole('radio', { name: '5 sao' }).click();
    await popup.getByRole('button', { name: 'Gửi đánh giá' }).click();
    await expect(page.getByTestId('review-done')).toBeVisible();
    expect((await donCuaToi(request, khach, don.id)).review).toEqual({ stars: 5, comment: null });
  });

  test('Đơn chưa hoàn tất không bật popup và không có nút đánh giá', async ({ page, request }) => {
    const khach = await taoKhach(request);
    const don = await datDon(request, khach);
    await thanhToan(request, khach, don.id);

    await vaoVoiTaiKhoan(page, khach, 'CUSTOMER');
    await page.goto('/orders');
    await expect(page.getByText('Đã thanh toán').first()).toBeVisible();
    await expect(page.getByRole('dialog', { name: 'Đánh giá đơn hàng' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Đánh giá đơn này' })).toHaveCount(0);
  });
});

// ---- Vòng đời đơn: pha chế, mã nhận hàng, giao món (FR-20, FR-21, UC-07, UC-11, UC-12) ----

test.describe('Pha chế và giao món', () => {
  test('Khách đặt và thanh toán, Barista nhận pha rồi pha xong, khách thấy mã, Cashier nhập mã, đơn COMPLETED', async ({
    browser,
    request,
  }) => {
    const khach = await taoKhach(request);
    const don = await datDon(request, khach);
    await thanhToan(request, khach, don.id);
    const ma = maNgan(don.id);

    // Barista đăng nhập qua giao diện và xử lý đơn trên màn KDS
    const baristaPage = await (await browser.newContext()).newPage();
    await baristaPage.goto('/kds');
    await dangNhapQuaGiaoDien(baristaPage, BARISTA);
    const theKds = baristaPage.getByTestId(`kds-card-${don.id}`);
    await theKds.getByRole('button', { name: /Nhận pha chế/ }).click();
    await expect(theKds.getByText('Đang pha chế...')).toBeVisible();
    expect((await donCuaToi(request, khach, don.id)).status).toBe('PREPARING');
    await theKds.getByRole('button', { name: /Đã pha xong/ }).click();
    await expect(baristaPage.getByText(`#${ma}`)).toHaveCount(0);

    // Khách thấy mã nhận hàng tự hiện ở lịch sử đơn (polling)
    const sauPha = await donCuaToi(request, khach, don.id);
    expect(sauPha.status).toBe('READY');
    expect(sauPha.pickupCode).toMatch(/^\d{6}$/);
    const khachPage = await (await browser.newContext()).newPage();
    await vaoVoiTaiKhoan(khachPage, khach, 'CUSTOMER');
    await khachPage.goto('/orders');
    await expect(khachPage.getByTestId('pickup-code')).toBeVisible();
    expect((await khachPage.getByTestId('pickup-code').innerText()).replace(/\s/g, '')).toBe(sauPha.pickupCode);

    // Cashier nhập sai mã thì báo lỗi và đơn vẫn READY; nhập đúng thì đã giao
    const cashierPage = await (await browser.newContext()).newPage();
    await cashierPage.goto('/cashier');
    await dangNhapQuaGiaoDien(cashierPage, CASHIER);
    const o = cashierPage.getByLabel(`Mã nhận hàng đơn ${ma}`);
    await o.fill(sauPha.pickupCode === '000000' ? '111111' : '000000');
    await o.press('Enter');
    await expect(cashierPage.getByRole('alert').getByText('Mã nhận hàng không đúng')).toBeVisible();
    expect((await donCuaToi(request, khach, don.id)).status).toBe('READY');

    await o.fill(sauPha.pickupCode);
    await o.press('Enter');
    await expect(cashierPage.getByTestId('delivered-list').getByText(ma)).toBeVisible();
    const xong = await donCuaToi(request, khach, don.id);
    expect(xong.status).toBe('COMPLETED');
    expect(xong.pickupCode).toBeNull();

    // Khách thấy đơn hoàn thành sau lần làm mới kế tiếp
    await expect(khachPage.getByText('Hoàn thành').first()).toBeVisible({ timeout: 15_000 });
  });

  test('Chỉ đúng vai trò mới vào được màn nhân viên', async ({ page, request }) => {
    const khach = await taoKhach(request);
    await vaoVoiTaiKhoan(page, khach, 'CUSTOMER');
    await page.goto('/cashier');
    await expect(page.getByText('Quyền truy cập bị từ chối')).toBeVisible();
    await page.goto('/kds');
    await expect(page.getByText('Quyền truy cập bị từ chối')).toBeVisible();
    // API cũng từ chối: khách không gọi được route của Cashier và Barista
    expect((await request.get(`${API}/cashier/orders`, { headers: khach.headers })).status()).toBe(403);
    expect((await request.get(`${API}/kds/orders`, { headers: khach.headers })).status()).toBe(403);
  });

  test('Không giao được đơn chưa READY: API trả 409', async ({ request }) => {
    const khach = await taoKhach(request);
    const don = await datDon(request, khach);
    await thanhToan(request, khach, don.id);
    const cashier = await dangNhapApi(request, CASHIER);
    const res = await request.post(`${API}/cashier/orders/${don.id}/complete`, {
      headers: cashier.headers,
      data: { pickupCode: '123456' },
    });
    expect(res.status()).toBe(409);
  });
});

// ---- Voucher (FR-11, UC-10) ----

async function themCaPheSuaVaoGio(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Thêm Cà phê sữa', exact: true }).click();
  await page.getByRole('button', { name: /Size M \(Vừa\)/ }).click();
  await page.getByRole('button', { name: /Trân châu đen/ }).click();
  await page.getByRole('button', { name: 'Thêm vào giỏ hàng' }).click();
}

test.describe('Mã giảm giá', () => {
  test('Áp mã ở Checkout: báo lỗi rõ, server tính giảm 10%, thanh toán trên số tiền sau giảm và tích điểm theo đó', async ({
    page,
    request,
  }) => {
    const khach = await taoKhach(request);
    await vaoVoiTaiKhoan(page, khach, 'CUSTOMER');
    await themCaPheSuaVaoGio(page); // 42.000đ

    await page.goto('/checkout');
    const o = page.getByLabel('Mã giảm giá', { exact: true });
    await o.fill('khongco');
    await page.getByRole('button', { name: 'Áp dụng' }).click();
    await expect(page.getByRole('alert').getByText(/không tồn tại/)).toBeVisible();

    // 42.000 chưa đạt đơn tối thiểu 50.000 của WELCOME10
    await o.fill('welcome10');
    await page.getByRole('button', { name: 'Áp dụng' }).click();
    await expect(page.getByRole('alert').getByText(/tối thiểu 50000đ/)).toBeVisible();

    // 2 ly = 84.000đ, giảm 10% = 8.400đ do server tính
    await themCaPheSuaVaoGio(page);
    await page.goto('/checkout');
    await page.getByLabel('Mã giảm giá', { exact: true }).fill(' welcome10 ');
    await page.getByRole('button', { name: 'Áp dụng' }).click();
    await expect(page.getByTestId('discount-line')).toContainText('8.400đ');
    await expect(page.getByTestId('payable-total')).toHaveText('75.600đ');

    // Tải lại trang vẫn giữ mã đã áp
    await page.reload();
    await expect(page.getByTestId('payable-total')).toHaveText('75.600đ');

    await page.getByRole('button', { name: /Xác nhận trả · 75\.600đ/ }).click();
    await expect(page).toHaveURL(/order-success/);
    await expect(page.getByText('Giảm giá (WELCOME10):')).toBeVisible();

    const ds = await (await request.get(`${API}/orders/me`, { headers: khach.headers })).json();
    const paid = ds.find((d: { status: string }) => d.status === 'PAID');
    expect(paid).toMatchObject({ total: 75_600, discountAmount: 8_400, promoCode: 'WELCOME10' });
    // Điểm thưởng tính trên số tiền thực trả: 75.600đ = 75 điểm
    expect((await (await request.get(`${API}/loyalty/me`, { headers: khach.headers })).json()).balance).toBe(75);
  });

  test('Gỡ mã hoặc đổi giỏ hàng sau khi áp mã thì đơn nháp bị hủy, không giữ lượt dùng', async ({ page, request }) => {
    const khach = await taoKhach(request);
    await vaoVoiTaiKhoan(page, khach, 'CUSTOMER');
    await themCaPheSuaVaoGio(page);
    await themCaPheSuaVaoGio(page); // 84.000đ

    await page.goto('/checkout');
    await page.getByLabel('Mã giảm giá', { exact: true }).fill('GIAM15K');
    await page.getByRole('button', { name: 'Áp dụng' }).click();
    await expect(page.getByTestId('payable-total')).toHaveText('69.000đ');

    await page.getByRole('button', { name: 'Gỡ mã giảm giá' }).click();
    await expect(page.getByTestId('payable-total')).toHaveText('84.000đ');
    await expect
      .poll(async () => (await (await request.get(`${API}/orders/me`, { headers: khach.headers })).json())[0]?.status)
      .toBe('CANCELLED');

    // Áp lại, rồi thêm một ly: đơn nháp cũ không còn khớp giỏ hàng nên bị hủy
    await page.getByLabel('Mã giảm giá', { exact: true }).fill('GIAM15K');
    await page.getByRole('button', { name: 'Áp dụng' }).click();
    await expect(page.getByTestId('payable-total')).toHaveText('69.000đ');
    await page.goto('/');
    await page.getByRole('button', { name: 'Thêm Cà phê sữa', exact: true }).click();
    await page.getByRole('button', { name: 'Thêm vào giỏ hàng' }).click();
    await page.goto('/checkout');
    await expect(page.getByLabel('Mã giảm giá', { exact: true })).toBeVisible();
    await expect
      .poll(async () => {
        const ds = await (await request.get(`${API}/orders/me`, { headers: khach.headers })).json();
        return ds.filter((d: { status: string }) => d.status === 'CANCELLED').length;
      })
      .toBe(2);
  });

  test('Đơn dưới mức tối thiểu của mã bị từ chối (API)', async ({ request }) => {
    const khach = await taoKhach(request);
    const nho = await request.post(`${API}/orders`, {
      headers: khach.headers,
      data: { items: [{ productId: 2, quantity: 1, size: 'S', toppings: [] }], promoCode: 'BREW20' },
    });
    expect(nho.status()).toBe(400);
    expect((await nho.json()).message).toMatch(/tối thiểu 100000đ/);
  });
});
