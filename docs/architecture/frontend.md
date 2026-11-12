# Tài Liệu Kiến Trúc Phân Hệ Frontend — Next.js Mobile-First (Task 3.1)

> **Dự án:** Ứng dụng đặt cà phê không tiền mặt BrewLite  
> **Môn học:** Công nghệ phần mềm — Học kỳ 1, Năm học 2026–2027  
> **Phân hệ:** Frontend Web Application (`apps/web`)  
> **Người thực hiện:** **Trần Quốc Tài (`TaiTran263`)** — Frontend UI/UX, Quản trị trạng thái Client  
> **Tài liệu liên quan:** `docs/architecture/adr/001-monorepo.md`, `004-zustand-state.md`

---

## 1. Tổng Quan Kiến Trúc & Triết Lý Thiết Kế
Frontend được xây dựng trên nền tảng **Next.js 16 (React 19)** sử dụng mô hình **App Router (`src/app/`)** kết hợp **TypeScript**. 

### Triết lý cốt lõi:
* **Mobile-First / PWA-Ready:** Thiết kế ưu tiên trải nghiệm trên thiết bị di động với khung nhìn tiêu chuẩn ($360\text{px} - 430\text{px}$), bố cục thẻ chạm vuốt trực quan, nút bấm lớn dễ thao tác bằng một ngón tay cái.
* **Component-Driven Architecture:** Giao diện được module hóa thành các component độc lập, tái sử dụng cao (`ProductCard`, `ProductDetailModal`, `AuthModal`, `Navbar`).
* **Client State Bền Vững:** Quản lý giỏ hàng và phiên người dùng tập trung bằng **Zustand**, tự động đồng bộ hóa xuống `localStorage`.
* **Zero Configuration Dynamic Backend:** Hỗ trợ cấu hình máy chủ động trực tiếp trên giao diện để demo mượt mà trên điện thoại qua Cloudflare Tunnel / Cloud.

---

## 2. Cấu Trúc Điều Hướng & Trang Màn Hình (`src/app/`)

Hệ thống phân chia các màn hình tương ứng với từng giai đoạn trong chuỗi nghiệp vụ:

| Tuyến đường (Route) | Tệp mã nguồn | Mô tả nghiệp vụ giao diện |
|---|---|---|
| **`/`** *(Trang chủ)* | `src/app/page.tsx` | • Hiển thị danh mục menu đồ uống dạng lưới thẻ (*ProductCard Grid*).<br>• Lọc món theo danh mục (Cà phê phin, Espresso, Cold Brew...).<br>• Tích hợp trạng thái Loading Skeleton, Empty State và Error Retry.<br>• Mở `ProductDetailModal` để chọn size (S/M/L) và topping. |
| **`/cart`** *(Giỏ hàng)* | `src/app/cart/page.tsx` | • Xem danh sách các ly nước đã chọn trong giỏ.<br>• Tăng/giảm số lượng (1–99 ly), xóa từng món hoặc xóa toàn bộ giỏ.<br>• Hiển thị chi tiết đơn giá, phụ thu và tổng tiền thanh toán tạm tính.<br>• Nút "Tiến hành Đặt hàng" kiểm tra JWT Auth trước khi chuyển trang. |
| **`/checkout`** *(Thanh toán)* | `src/app/checkout/page.tsx` | • Tóm tắt đơn hàng cần thanh toán.<br>• Chọn phương thức không tiền mặt: **Ví điện tử (`WALLET`)** hoặc **Thẻ ngân hàng (`CARD`)**.<br>• Nhập số thẻ ngân hàng (có cơ chế mô phỏng từ chối thẻ đuôi `0000`).<br>• Tự động sinh `Idempotency-Key` (chuỗi duy nhất `ord_…`/`pay_…`) chống trừ tiền trùng khi bấm liên tục. |
| **`/order-success`** | `src/app/order-success/page.tsx` | • Màn hình chúc mừng đặt hàng thành công.<br>• Hiển thị mã đơn hàng, tổng tiền và số điểm loyalty được tích lũy (+1 điểm / 1.000đ).<br>• Nút bấm quay lại Menu hoặc chuyển tới trang Lịch sử đơn. |
| **`/orders`** *(Lịch sử đơn)* | `src/app/orders/page.tsx` | • Danh sách lịch sử các đơn hàng đã đặt của tài khoản đang đăng nhập.<br>• Sắp xếp đơn mới nhất lên đầu; hiển thị chi tiết từng ly kèm size/topping.<br>• Badge màu trạng thái: `PENDING` (Vàng), `PAID` (Xanh lá), `PAYMENT_FAILED` (Đỏ).<br>• Hiển thị số dư điểm tích lũy từ `GET /loyalty/me` (`apiService.getLoyalty`); số dư cũng hiện trên Navbar (FR-10). |

---

## 3. Kiến Trúc Quản Lý Trạng Thái (State Management — Zustand)

Thay vì dùng Redux phức tạp hay React Context dễ gây re-render diện rộng, Frontend sử dụng **Zustand** được tổ chức tại thư mục `src/store/`:

### 3.1. `useCartStore` (`src/store/useCartStore.ts`)
* **Trạng thái:** Mảng `items: CartItem[]`.
* **Khóa nhận diện phân biệt (Unique Cart Item ID):**
  $$\text{cartItemId} = \text{productId} + \text{"-"} + \text{size} + \text{"-"} + \text{sortedToppings}$$
  *(Đảm bảo hai ly cùng loại nước nhưng khác size hoặc khác topping được lưu thành 2 dòng riêng biệt).*
* **Hành vi (Actions):** `addToCart()`, `updateQuantity(delta)`, `removeFromCart()`, `clearCart()`, `getTotalItems()`, `getTotalPrice()`.
* **Cơ chế lưu trữ:** Sử dụng middleware `persist` của Zustand, tự động lưu trữ và phục hồi dữ liệu từ `localStorage` khi người dùng tải lại trang.

### 3.2. `useAuthStore` (`src/store/useAuthStore.ts`)
* **Trạng thái:** `token: string | null`, `user: User | null`, `isAuthenticated: boolean`.
* **Hành vi:** `login(token, user)`, `logout()`.
* **Cơ chế:** Lưu token vào `localStorage` với key `brewlite_token`, tự động gắn vào header các request API.

---

## 4. Cấu Hình Môi Trường & Kết Nối Backend (`src/services/api.ts`)

### 4.1. Biến môi trường tiêu chuẩn
* Frontend đọc biến môi trường qua `process.env.NEXT_PUBLIC_API_URL` (mặc định trỏ về `http://localhost:4003` khi chạy local).

### 4.2. Cơ chế máy chủ động (Dynamic Backend URL)
* Để phục vụ demo thực tế trên smartphone qua mạng di động (kết nối **Cloudflare Tunnel** hoặc **Render Cloud**):
  * Cung cấp nút bấm **"Server"** trên thanh điều hướng mở `ServerConfigModal.tsx`.
  * Hàm `getApiUrl()` ưu tiên đọc URL từ `localStorage.getItem('brewlite_api_url')` trước khi fallback về biến môi trường.
  * Hỗ trợ chức năng Ping kiểm tra độ trễ mạng tới máy chủ theo thời gian thực.

### 4.3. Axios Interceptors
* **Request Interceptor:** Tự động kiểm tra và đính kèm Bearer Token:
  `config.headers.Authorization = 'Bearer ' + token`
* **Response Interceptor:** Bắt mã lỗi `429 Too Many Requests` (phòng ngừa; API hiện chưa bật giới hạn tần suất) để báo người dùng thao tác chậm lại. Mã `401` được xử lý ngay trong các hàm tạo đơn và thanh toán: báo phiên hết hạn và yêu cầu đăng nhập lại, giỏ hàng giữ nguyên.

---

## 5. Đánh Giá Kiến Trúc, Ưu Điểm, Hạn Chế và Trade-off

| Tiêu chí | Đánh giá kiến trúc Frontend BrewLite |
|---|---|
| **Lý do chọn** | Next.js 16 App Router cung cấp khả năng tối ưu hóa hình ảnh tự động, SEO tốt, build bundle nhẹ cho thiết bị di động, và dễ dàng triển khai lên Vercel chỉ với 1 click. |
| **Ưu điểm** | • Tốc độ tải trang cực nhanh (FCP $\le 1.5$s).<br>• Zustand nhẹ (~1KB), cú pháp ngắn gọn, không cần bọc Provider lằng nhằng.<br>• Đồng bộ giỏ hàng và token ngay cả khi tắt trình duyệt.<br>• Linh hoạt đổi URL backend khi demo đồ án mà không cần build lại mã nguồn. |
| **Hạn chế** | • App Router trong Next.js 16 tương đối mới, cần chú ý phân định rõ giữa Server Component và Client Component (`'use client'`).<br>• LocalStorage chỉ lưu được ở Client, cần xử lý cẩn thận hiện tượng Hydration Mismatch của React. |
| **Trade-off** | Nhóm chấp nhận render toàn bộ các trang nghiệp vụ chính (Cart, Checkout, Orders) dưới dạng **Client Components** để tương tác nhanh với Zustand Store và localStorage, đổi lại thời gian render phía client cực kỳ nhạy bén cho trải nghiệm người dùng mobile. |