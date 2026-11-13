import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

// E2E luồng đặt hàng: menu -> chọn size/topping -> giỏ hàng -> đăng ký -> thanh toán -> đơn hàng.
// Chạy trên hệ thống thật (web + API + PostgreSQL), kiểm tra cả giao diện lẫn dữ liệu phía server.
// Đối chiếu: FR-01..FR-10 trong docs/traceability-matrix.md.

const API = process.env.E2E_API_URL ?? 'http://localhost:4003';
const MAT_KHAU = 'matkhau123';
const THE_THANH_CONG = '4111111111111111';
const THE_BI_TU_CHOI = '4111111111110000'; // 4 số cuối 0000 bị từ chối (mô phỏng)

// Số điện thoại mới mỗi lần chạy (đầu số 09 + 8 chữ số) để không trùng người dùng cũ.
const soDienThoaiMoi = () =>
  `09${String(Date.now()).slice(-6)}${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`;

// Cà phê sữa (29.000) + Size M (+5.000) + Trân châu đen (+8.000) = 42.000đ, tính theo bảng giá của server.
const TONG_TIEN = 42_000;

async function themCaPheSuaVaoGio(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Thêm Cà phê sữa', exact: true }).click();
  await page.getByRole('button', { name: /Size M \(Vừa\)/ }).click();
  await page.getByRole('button', { name: /Trân châu đen/ }).click();
  await expect(page.getByText('42.000đ').first()).toBeVisible();
  await page.getByRole('button', { name: 'Thêm vào giỏ hàng' }).click();
}

async function dangKyQuaGiaoDien(page: Page, phone: string) {
  await page.getByRole('button', { name: 'Đăng ký', exact: true }).click();
  await page.getByPlaceholder('0912345678').fill(phone);
  await page.getByPlaceholder('Nguyễn Văn A').fill('Khách E2E');
  await page.getByPlaceholder('tenban@email.com').fill(`${phone}@e2e.test`);
  await page.getByPlaceholder('••••••••').fill(MAT_KHAU);
  await page.getByRole('button', { name: 'Tạo tài khoản & Đăng nhập' }).click();
}

// Từ trang chủ đến trang thanh toán: vào giỏ hàng, kiểm tra tiền, bấm sang /checkout.
async function denTrangThanhToan(page: Page) {
  await page.locator('a[href="/cart"]').first().click();
  await expect(page).toHaveURL(/\/cart/);
  await expect(page.getByText('Cà phê sữa').first()).toBeVisible();
  await page.locator('a[href="/checkout"]').click();
  await expect(page).toHaveURL(/\/checkout/);
}

async function chonTheVaNhapSo(page: Page, soThe: string) {
  await page.getByText('Thẻ ATM / Thẻ Quốc tế').click();
  await page.getByPlaceholder('9704000000000001').fill(soThe);
}

// Chưa đăng nhập thì bấm xác nhận sẽ mở hộp thoại đăng nhập: đăng ký xong rồi bấm xác nhận lại.
async function dangKyRoiXacNhanTra(page: Page, phone: string) {
  const nutXacNhan = page.getByRole('button', { name: /Xác nhận trả/ });
  await nutXacNhan.click();
  await dangKyQuaGiaoDien(page, phone);
  // Chờ đăng ký + đăng nhập xong (nút Đăng xuất chỉ hiện khi đã có token), tránh bấm khi hộp thoại còn mở.
  await expect(page.getByTitle('Đăng xuất tài khoản')).toBeVisible();
  await expect(page.getByPlaceholder('0912345678')).toBeHidden();
  await nutXacNhan.click();
}

async function dangNhapApi(request: APIRequestContext, phone: string) {
  const res = await request.post(`${API}/auth/login`, { data: { phone, password: MAT_KHAU } });
  expect(res.status()).toBe(200);
  const { accessToken } = await res.json();
  return { headers: { Authorization: `Bearer ${accessToken}` } };
}

test.describe('Luồng đặt hàng', () => {
  test('Khách đặt cà phê sữa size M + trân châu, thanh toán thẻ thành công và được tích điểm', async ({ page, request }) => {
    const phone = soDienThoaiMoi();

    await themCaPheSuaVaoGio(page);
    await denTrangThanhToan(page);
    await chonTheVaNhapSo(page, THE_THANH_CONG);
    await dangKyRoiXacNhanTra(page, phone);

    await expect(page).toHaveURL(/\/order-success/);
    await expect(page.getByRole('heading', { name: 'Đặt hàng thành công!' })).toBeVisible();

    // Dữ liệu phía server: đơn PAID, tổng tiền do server tính, 1 điểm / 1.000đ.
    const auth = await dangNhapApi(request, phone);
    const orders = await (await request.get(`${API}/orders/me`, auth)).json();
    expect(orders).toHaveLength(1);
    expect(orders[0]).toMatchObject({ status: 'PAID', total: TONG_TIEN });
    expect(orders[0].items[0]).toMatchObject({ productName: 'Cà phê sữa', size: 'M', toppings: ['tran-chau'], unitPrice: TONG_TIEN });
    const loyalty = await (await request.get(`${API}/loyalty/me`, auth)).json();
    expect(loyalty.balance).toBe(TONG_TIEN / 1000);

    // Giao diện lịch sử đơn hiển thị trạng thái đã thanh toán.
    await page.locator('a[href="/orders"]').first().click();
    await expect(page.getByText('Đã thanh toán').first()).toBeVisible();
  });

  test('Thẻ có 4 số cuối 0000 bị từ chối: đơn PAYMENT_FAILED, giỏ hàng giữ nguyên, không tích điểm', async ({ page, request }) => {
    const phone = soDienThoaiMoi();

    await themCaPheSuaVaoGio(page);
    await denTrangThanhToan(page);
    await chonTheVaNhapSo(page, THE_BI_TU_CHOI);
    await dangKyRoiXacNhanTra(page, phone);

    await expect(page.getByText(/PAYMENT_FAILED/)).toBeVisible();
    await expect(page).toHaveURL(/\/checkout/);
    // Giỏ hàng giữ nguyên để khách thử lại: nút xác nhận vẫn hiện đúng số tiền.
    await expect(page.getByRole('button', { name: /Xác nhận trả · 42\.000đ/ })).toBeVisible();

    const auth = await dangNhapApi(request, phone);
    const orders = await (await request.get(`${API}/orders/me`, auth)).json();
    expect(orders).toHaveLength(1);
    expect(orders[0]).toMatchObject({ status: 'PAYMENT_FAILED', total: TONG_TIEN });
    const loyalty = await (await request.get(`${API}/loyalty/me`, auth)).json();
    expect(loyalty.balance).toBe(0);
  });

  test('Không có token thì API từ chối tạo đơn (401)', async ({ request }) => {
    const res = await request.post(`${API}/orders`, {
      data: { items: [{ productId: 1, quantity: 1, size: 'S', toppings: [] }] },
    });
    expect(res.status()).toBe(401);
  });
});

// ---- Ví, thanh toán lại và Idempotency-Key (FR-06, FR-09) ----

const MON_42K = { productId: 1, quantity: 1, size: 'M', toppings: ['tran-chau'] }; // 42.000đ
const MON_546K = { ...MON_42K, quantity: 13 }; // 13 x 42.000 = 546.000đ, vượt hạn mức Ví 500.000đ

// Tạo người dùng mới qua API (nhanh hơn đi qua giao diện) và trả về token để gọi API tiếp.
async function taoNguoiDungApi(request: APIRequestContext) {
  const phone = soDienThoaiMoi();
  const reg = await request.post(`${API}/auth/register`, { data: { phone, password: MAT_KHAU } });
  expect(reg.status()).toBe(201);
  return { phone, auth: await dangNhapApi(request, phone) };
}

async function taoDonApi(request: APIRequestContext, auth: { headers: Record<string, string> }, item: object, key?: string) {
  const headers = key ? { ...auth.headers, 'Idempotency-Key': key } : auth.headers;
  const res = await request.post(`${API}/orders`, { headers, data: { items: [item] } });
  expect(res.status()).toBe(201);
  return res.json();
}

async function thanhToanApi(request: APIRequestContext, auth: { headers: Record<string, string> }, body: object, key?: string) {
  const headers = key ? { ...auth.headers, 'Idempotency-Key': key } : auth.headers;
  const res = await request.post(`${API}/payments`, { headers, data: body });
  expect(res.status()).toBe(201);
  return res.json();
}

// Đưa phiên đăng nhập vào trình duyệt (giống kết quả đăng nhập qua giao diện) để khỏi lặp lại màn đăng nhập.
async function vaoTrangDaDangNhap(page: Page, phone: string, auth: { headers: Record<string, string> }) {
  const token = auth.headers.Authorization.replace('Bearer ', '');
  await page.addInitScript(
    ([t, p]) => {
      localStorage.setItem('brewlite_token', t);
      localStorage.setItem(
        'brewlite_auth',
        JSON.stringify({ state: { token: t, user: { id: p, phone: p, role: 'CUSTOMER', name: p } }, version: 0 }),
      );
    },
    [token, phone],
  );
}

test.describe('Thanh toán bằng Ví, thanh toán lại và chống gửi trùng', () => {
  test('Ví: đơn 42.000đ (không quá 500.000đ) thanh toán thành công và được tích điểm', async ({ page, request }) => {
    const phone = soDienThoaiMoi();

    await themCaPheSuaVaoGio(page);
    await denTrangThanhToan(page);
    // Ví điện tử là phương thức mặc định, không cần chọn và không nhập số thẻ.
    await dangKyRoiXacNhanTra(page, phone);

    await expect(page).toHaveURL(/\/order-success/);
    const auth = await dangNhapApi(request, phone);
    const orders = await (await request.get(`${API}/orders/me`, auth)).json();
    expect(orders).toHaveLength(1);
    expect(orders[0]).toMatchObject({ status: 'PAID', total: TONG_TIEN });
    expect((await (await request.get(`${API}/loyalty/me`, auth)).json()).balance).toBe(TONG_TIEN / 1000);
  });

  test('Ví: đơn 546.000đ (trên 500.000đ) bị từ chối, không tích điểm', async ({ page, request }) => {
    const { phone, auth } = await taoNguoiDungApi(request);
    const don = await taoDonApi(request, auth, MON_546K);
    expect(don.total).toBe(546_000);

    const ketQua = await thanhToanApi(request, auth, { orderId: don.id, method: 'WALLET' });
    expect(ketQua).toMatchObject({ status: 'PAYMENT_FAILED', pointsEarned: 0, reason: 'Số dư ví không đủ' });
    expect((await (await request.get(`${API}/loyalty/me`, auth)).json()).balance).toBe(0);

    // Giao diện lịch sử đơn hiển thị đơn lỗi và cho phép thanh toán lại.
    await vaoTrangDaDangNhap(page, phone, auth);
    await page.goto('/orders');
    await expect(page.getByText('Lỗi thanh toán').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Thanh toán lại' })).toBeVisible();
  });

  test('Đơn PAYMENT_FAILED được thanh toán lại ở /orders và chuyển thành PAID', async ({ page, request }) => {
    const { phone, auth } = await taoNguoiDungApi(request);
    const don = await taoDonApi(request, auth, MON_42K);
    const lan1 = await thanhToanApi(request, auth, { orderId: don.id, method: 'CARD', cardNumber: THE_BI_TU_CHOI });
    expect(lan1.status).toBe('PAYMENT_FAILED');

    await vaoTrangDaDangNhap(page, phone, auth);
    await page.goto('/orders');
    await expect(page.getByText('Lỗi thanh toán').first()).toBeVisible();
    await page.getByRole('button', { name: 'Thanh toán lại' }).click();
    await page.getByRole('button', { name: 'Thẻ ngân hàng' }).click();
    await page.getByPlaceholder('9704000000000001').fill(THE_THANH_CONG);
    await page.getByRole('button', { name: 'Xác nhận thanh toán' }).click();

    await expect(page.getByText('Đã thanh toán').first()).toBeVisible();
    const orders = await (await request.get(`${API}/orders/me`, auth)).json();
    expect(orders).toHaveLength(1); // thanh toán lại không tạo đơn mới
    expect(orders[0]).toMatchObject({ id: don.id, status: 'PAID' });
    expect((await (await request.get(`${API}/loyalty/me`, auth)).json()).balance).toBe(TONG_TIEN / 1000);
  });

  test('Bấm xác nhận liên tiếp trên giao diện chỉ tạo một đơn', async ({ page, request }) => {
    const { phone, auth } = await taoNguoiDungApi(request);
    await vaoTrangDaDangNhap(page, phone, auth);

    await themCaPheSuaVaoGio(page);
    await denTrangThanhToan(page);
    await page.getByRole('button', { name: /Xác nhận trả/ }).dblclick();

    await expect(page).toHaveURL(/\/order-success/);
    const orders = await (await request.get(`${API}/orders/me`, auth)).json();
    expect(orders).toHaveLength(1);
  });

  test('Gửi lại cùng Idempotency-Key trả về đúng kết quả cũ, không tạo đơn hay trừ tiền lần nữa', async ({ request }) => {
    const { auth } = await taoNguoiDungApi(request);
    const khoaDon = `e2e-don-${Date.now()}`;
    const khoaTra = `e2e-tra-${Date.now()}`;

    const don1 = await taoDonApi(request, auth, MON_42K, khoaDon);
    const don2 = await taoDonApi(request, auth, MON_42K, khoaDon);
    expect(don2.id).toBe(don1.id);

    const tra1 = await thanhToanApi(request, auth, { orderId: don1.id, method: 'WALLET' }, khoaTra);
    const tra2 = await thanhToanApi(request, auth, { orderId: don1.id, method: 'WALLET' }, khoaTra);
    expect(tra1.status).toBe('PAID');
    expect(tra2).toEqual(tra1);

    const orders = await (await request.get(`${API}/orders/me`, auth)).json();
    expect(orders).toHaveLength(1);
    // Điểm chỉ được cộng một lần dù gửi hai lần.
    expect((await (await request.get(`${API}/loyalty/me`, auth)).json()).balance).toBe(TONG_TIEN / 1000);
  });
});
