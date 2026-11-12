# Bản Ghi Chú Phát Hành — Release Notes v1.0.0 (Production)

> **Dự án:** Ứng dụng đặt cà phê không tiền mặt BrewLite  
> **Môn học:** Công nghệ phần mềm — Học kỳ 1, Năm học 2026–2027  
> **Phiên bản phát hành:** `v1.0.0` (Mốc nghiệm thu Assignment 2 — Core MVP)  
> **Ngày phát hành:** 10/11/2026 (cập nhật 12/11/2026 sau khi gộp PR #114 và #115: đồng bộ CSDL theo số điện thoại)  
> **Nhóm thực hiện:**
> - **Nguyễn Thành Long (`Longcodepro`)** — Backend, Scrum Master, DevOps, Kiến trúc
> - **Trần Quốc Tài (`TaiTran263`)** — Frontend UI/UX, Quản trị trạng thái Client, QA
>
> **Mã tạo phẩm:** `DOC-REL-01` | **Đường dẫn:** `docs/release-notes.md` (Phục vụ **Task 5.4 & Checklist 9.1** của đề bài)  
> **Tài liệu liên quan:** [`README.md`](../README.md), [`docs/deployment.md`](./deployment.md), [`docs/traceability-matrix.md`](./traceability-matrix.md)

---

## 1. Tổng Quan Phiên Bản Phát Hành v1.0.0

Phiên bản **BrewLite v1.0.0** đánh dấu cột mốc hoàn thành toàn diện chu trình phát triển phần mềm từ **Yêu cầu (Task 1) → Mô hình hóa (Task 2) → Thiết kế kiến trúc (Task 3) → Lập trình MVP & CI (Task 4) → Tự động hóa CD & Đóng gói Production (Task 5)** theo đúng đề bài Assignment 2.

Hệ thống cho phép khách hàng thực hiện trọn vẹn luồng trải nghiệm số:  
> **Xem menu** → **Tùy biến món (Size/Topping)** → **Quản lý giỏ hàng** → **Đăng nhập SĐT** → **Đặt đơn** → **Thanh toán không tiền mặt** → **Theo dõi đơn & Tích điểm**

---

## 2. Thông Tin Hạ Tầng & Địa Chỉ Truy Cập Production (Live URLs)

Toàn bộ dịch vụ đã được triển khai trực tiếp trên nền tảng đám mây công cộng qua kết nối mã hóa an toàn **HTTPS**:

| Thành phần | Nền tảng hạ tầng | Địa chỉ truy cập Production | Giao thức | Ghi chú nghiệm thu |
|---|---|---|:---:|---|
| **Frontend Web App** | **Vercel Edge Network** | [`https://brewlite-web.vercel.app`](https://brewlite-web.vercel.app) | HTTPS | Ứng dụng Next.js 16 Mobile-first, CDN toàn cầu |
| **Backend API Service** | **Render Cloud Services** | [`https://brewlite-api.onrender.com`](https://brewlite-api.onrender.com) | HTTPS | Container NestJS triển khai tự động từ GHCR |
| **Endpoint Health Check** | **Render Cloud** | [`https://brewlite-api.onrender.com/health`](https://brewlite-api.onrender.com/health) | HTTPS | Trả về HTTP 200 `{ "status": "ok" }` |
| **Tài liệu API (Swagger)** | **Render Cloud** | [`https://brewlite-api.onrender.com/docs`](https://brewlite-api.onrender.com/docs) | HTTPS | Giao diện thử nghiệm API OpenAPI 3.0 |
| **Cơ sở dữ liệu** | **Neon Serverless PostgreSQL** | `ep-dry-pond-xxx.ap-southeast-1.aws.neon.tech` | TLS 5432 | Đặt tại Singapore (`ap-southeast-1`), SSL Mode |
| **Demo Tunnel (Dự phòng)** | **Cloudflare Zero Trust** | [`https://demo.brewlite.online`](https://demo.brewlite.online) | HTTPS | Phát trực tiếp từ môi trường Local chấm bài |

---

## 3. Dữ Liệu Kiểm Thử Nhanh (Demo Test Credentials)

Giảng viên và người nghiệm thu có thể sử dụng các tài khoản và thông tin thẻ mô phỏng đã được seed sẵn trong hệ thống:

### 3.1. Tài khoản khách hàng thử nghiệm
- **Không có tài khoản được seed sẵn:** `prisma/seed.ts` chỉ tạo danh mục và món, không tạo người dùng.
- Cách đăng nhập: bấm **Đăng ký** trên web với SĐT di động Việt Nam 10 chữ số (đầu số `03`, `05`, `07`, `08`, `09`, ví dụ `0912345678`) và mật khẩu 6 đến 72 ký tự.
- Nút **"Tài khoản mẫu (Demo)"** ở form đăng nhập chỉ điền sẵn `0912345678` / `matkhau123` vào ô nhập. Tài khoản này chỉ đăng nhập được nếu đã được đăng ký trước đó với đúng cặp này.

### 3.2. Kịch bản thanh toán thẻ & ví mô phỏng (Mock Payment Gate)
- **Thanh toán bằng Thẻ (`CARD`):**
  - **Thành công:** Nhập số thẻ 13 đến 19 chữ số (ví dụ 16 số) có 4 số cuối **khác `0000`** (Ví dụ: `4111 2222 3333 4444`).
  - **Thất bại (Test nhánh Alt lỗi thẻ):** Nhập số thẻ có 4 số cuối là **`0000`** (Ví dụ: `4111 2222 3333 0000`).
- **Thanh toán bằng Ví điện tử (`WALLET`):**
  - **Thành công:** Áp dụng cho các đơn hàng có tổng giá trị <= 500.000đ.
  - **Thất bại:** Hệ thống tự động từ chối nếu đơn hàng vượt quá hạn mức 500.000đ.

---

## 4. Chi Tiết Các Tính Năng Đã Hoàn Thành (Changelog v1.0.0)

### 4.1. Phân hệ Giao diện Khách hàng (Frontend — `apps/web`)
* **Xem Menu Mobile-First (`FR-01`):** Phân chia tab danh mục (Cà phê phin, Espresso, Cold Brew), hiển thị ảnh đại diện, giá niêm yết, tự động gắn nhãn "Hết hàng" (Sold out) theo cờ `isAvailable`. Hỗ trợ 3 trạng thái giao diện: Skeleton Loading, Empty State, Error & Retry.
* **Modal tùy biến đồ uống (`FR-02`):** Cho phép chọn duy nhất 1 Size (S +0đ, M +5.000đ, L +10.000đ) và tick chọn nhiều Topping (Trân châu đen +8.000đ, Kem cheese +10.000đ, Thạch cà phê +6.000đ). Giá tạm tính tự động nhảy số theo thời gian thực.
* **Giỏ hàng Client Store (`FR-03`):** Quản lý bằng Zustand, tự động lưu bền vững vào `localStorage`. Cho phép tăng/giảm số lượng, xóa từng món, tự xóa giỏ khi thanh toán xong; hiển thị badge đếm số ly trên thanh điều hướng.
* **Modal Xác thực SĐT (`FR-04`):** Giao diện đăng ký/đăng nhập chuẩn di động, validate regex SĐT 10 số Việt Nam (`^(?:03|05|07|08|09)\d{8}$`), lưu token JWT vào Axios headers.
* **Màn hình Thanh toán Checkout (`FR-05`, `FR-06`):** Tóm tắt đơn hàng, lựa chọn phương thức Thẻ/Ví, sinh mã UUID `Idempotency-Key` bảo vệ giao dịch.
* **Lịch sử & Theo dõi đơn hàng (`FR-07`, `FR-10`):** Màn hình `/orders` hiển thị danh sách đơn cá nhân, cơ chế Polling tự động làm mới trạng thái mỗi 5 giây, hiển thị số dư điểm tích lũy và lịch sử cộng điểm.

### 4.2. Phân hệ Dịch vụ Máy chủ (Backend API — `apps/api`)
* **Xác thực an toàn (`FR-04`):** Đăng ký/Đăng nhập bằng SĐT, băm mật khẩu 1 chiều `bcryptjs` (salt rounds = 10), phát hành JWT hạn dùng 24h, bảo vệ tài nguyên qua `JwtAuthGuard`.
* **Server-side Pricing (`FR-05`):** Server tự đọc giá sản phẩm, phụ thu size và topping từ cơ sở dữ liệu để tính tổng tiền; từ chối mọi trường hợp client tự truyền giá lên (`forbidNonWhitelisted: true`).
* **Máy trạng thái đơn hàng (Order State Machine — `FR-08`):** Kiểm soát nghiêm ngặt vòng đời chuyển trạng thái (`PENDING` → `PAID` / `PAYMENT_FAILED`).
* **Khóa lạc quan (Optimistic Locking — `FR-08`):** Bổ sung cột `version` trong bảng `Order`. Cập nhật sai phiên bản trả về mã lỗi `409 Conflict`, loại bỏ hoàn toàn rủi ro ghi đè dữ liệu đồng thời.
* **Chống gửi trùng Idempotency (`FR-09`):** Bắt giữ header `Idempotency-Key`; nếu client gửi lặp lại cùng một key sẽ trả về kết quả cũ mà không tạo thêm đơn hoặc trừ tiền lần 2.
* **Tích điểm tự động (`FR-10`):** Tự động tích lũy 1 điểm cho mỗi 1.000đ giá trị thực trả của đơn hàng thành công (`PAID`).

### 4.3. Hạ Tầng DevOps & Chất Lượng (CI/CD)
* **Pipeline CI (GitHub Actions):** Tự động kích hoạt khi mở PR, vượt qua 4 chốt chặn bắt buộc: `Install -> Lint (oxlint) -> Unit Test (Vitest) -> Build`.
* **Pipeline CD (GitHub Actions):** Đóng gói Docker Image lên GitHub Container Registry (`ghcr.io`), kích hoạt Render Webhook triển khai (khi đã cấu hình secret) và smoke test `/health` (khi đã cấu hình URL Production). Migration CSDL và seed chạy ở lệnh khởi động của container.
* **Container hóa:** Tệp `docker-compose.yml` cho phép chạy trọn gói cả 3 dịch vụ (Web:4004, API:4003, DB:4005) ở máy cục bộ chỉ bằng một câu lệnh `docker compose up`.

---

## 5. Danh Mục Tạo Phẩm Bàn Giao Kèm Theo (Deliverables Matrix)

| Nhóm tạo phẩm | Tên tạo phẩm | Đường dẫn trong repository |
|---|---|---|
| **Yêu cầu (Task 1)** | Bối cảnh, Stakeholder & Phạm vi | [`docs/requirements/context-and-scope.md`](./requirements/context-and-scope.md) |
| | SRS Đặc tả yêu cầu Web & API | [`docs/requirements/requirements-web.md`](./requirements/requirements-web.md), [`requirements-api.md`](./requirements/requirements-api.md) |
| | Danh sách User Stories | [`docs/requirements/user-stories.md`](./requirements/user-stories.md) |
| | Đặc tả Use-Case Checkout trọng tâm | [`docs/requirements/use-case-checkout.md`](./requirements/use-case-checkout.md) |
| **Sơ đồ (Task 2)** | Sơ đồ Use-Case tổng quát 21 UC | [`docs/diagrams/usecase-overview.puml`](./diagrams/usecase-overview.puml) (ảnh: `.svg`) |
| | Sơ đồ Activity End-to-End | [`docs/diagrams/activity-01-menu-cart-auth.puml`](./diagrams/activity-01-menu-cart-auth.puml) (ảnh: `.svg`) |
| | Sơ đồ Sequence Đặt & Thanh toán | [`docs/diagrams/sequence-checkout.puml`](./diagrams/sequence-checkout.puml) (ảnh: `.svg`) |
| | Sơ đồ Class Domain Model | [`docs/diagrams/class-domain.puml`](./diagrams/class-domain.puml) (ảnh: `.svg`) |
| **Kiến trúc (Task 3)** | Kiến trúc Frontend & Backend | [`docs/architecture/frontend.md`](./architecture/frontend.md), [`backend.md`](./architecture/backend.md) |
| | Các bản quyết định kiến trúc (ADR) | [`docs/architecture/adr/`](./architecture/adr/) (ADR 001 đến ADR 005) |
| | Sơ đồ UML Deployment hạ tầng | [`docs/diagrams/deployment.puml`](./diagrams/deployment.puml) (ảnh: `.svg`) |
| | Kế hoạch triển khai & Rollback | [`docs/deployment.md`](./deployment.md) |
| **Truy vết (Task 8)** | Ma trận truy vết yêu cầu (21 FR + 5 NFR) | [`docs/traceability-matrix.md`](./traceability-matrix.md) |

---

## 6. Giới Hạn Đã Biết & Lộ Trình Phiên Bản Tiếp Theo

### 6.1. Giới hạn kỹ thuật chấp nhận ở phiên bản v1.0.0
- Xác thực tài khoản khách hàng thực hiện qua Số điện thoại + Mật khẩu (chưa tích hợp tổng đài gửi mã OTP SMS trả phí do chi phí hạ tầng).
- Chưa có kiểm thử end-to-end tự động (Playwright hoặc Cypress). Hiện có unit test và integration test của API (Vitest) cùng kịch bản Postman.
- Cơ chế theo dõi trạng thái đơn hàng sử dụng kỹ thuật Polling (thăm dò chu kỳ 5 giây) thay cho WebSocket để tối ưu tài nguyên máy chủ miễn phí.

### 6.2. Lộ trình phát triển mở rộng (Sprint 3 & Sprint 4 — Planned)
Các tính năng sau đã được thiết kế sẵn cấu trúc trên Sơ đồ Use Case và Sơ đồ Lớp CSDL, sẵn sàng triển khai trong các phiên bản sau:
- **Sprint 3:** Màn hình KDS cho nhân viên pha chế Barista (`FR-20`), Giao nhận đồ uống bằng mã số 6 chữ số `pickupCode` (`FR-21`), Tiện ích hủy đơn và đánh giá 5 sao (`FR-12`, `FR-13`).
- **Sprint 4:** Quản lý danh mục & món đồ uống CRUD cho Quản lý (`FR-18`), Quản lý định lượng kho nguyên liệu & công thức pha chế (`FR-15`, `FR-16`, `FR-17`), Quản trị voucher và Dashboard thống kê doanh thu (`FR-14`, `FR-19`).

---

## 7. Quy Trình Khôi Phục Sự Cố (Emergency Rollback)

Trong trường hợp phiên bản Production gặp sự cố nghiêm trọng, nhóm quản trị vận hành theo quy trình khôi phục nhanh đã được đặc tả tại [docs/deployment.md#5-quy-trinh-khoi-phuc-su-co-tung-buoc-step-by-step-rollback-guide](./deployment.md):
- **Frontend Vercel:** Truy cập Dashboard → Deployments → Chọn bản deploy trước → Bấm **Instant Rollback** (thao tác dưới 10 giây).
- **Backend Render:** Truy cập Render Service → Deploy History → Chọn commit SHA an toàn → Bấm **Rollback to this deploy** (thao tác dưới 2 phút).
- **Cơ sở dữ liệu:** Sử dụng tính năng Point-in-Time Recovery (PITR) trên Neon Cloud để hoàn tác trạng thái bảng.
