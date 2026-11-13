# Ma Trận Truy Vết Yêu Cầu Hệ Thống — Requirements Traceability Matrix (RTM)

> **Dự án:** Ứng dụng đặt cà phê không tiền mặt BrewLite  
> **Môn học:** Công nghệ phần mềm — Học kỳ 1, Năm học 2026–2027  
> **Nhóm thực hiện:**
> - **Nguyễn Thành Long (`Longcodepro`)** — Backend, Scrum Master, DevOps, Kiến trúc
> - **Trần Quốc Tài (`TaiTran263`)** — Frontend UI/UX, Quản trị trạng thái Client, QA
>
> **Mã tạo phẩm:** `DOC-TRM-01` | **Đường dẫn:** `docs/traceability-matrix.md`  
> **Căn cứ chuẩn (SSOT):**  `docs/requirements/context-and-scope.md` (mục 6: danh mục CN/UC/FR/NFR), `docs/BACKLOG.md`  
> **Quy ước trạng thái:**  
> - **Hoàn thành (MVP - Sprint 1 & 2):** Truy vết từ Yêu cầu $\rightarrow$ Use-case/Story $\rightarrow$ Sơ đồ thiết kế $\rightarrow$ Mã nguồn/API $\rightarrow$ Kiểm thử. Phần API có kiểm thử tự động (Vitest, Postman); phần giao diện web chưa có kiểm thử tự động và chưa có E2E.  
> - **Lên kế hoạch (Planned - Sprint 3 & 4):** Đã mô hình hóa đầy đủ ở cấp độ Use Case và Domain Class Model; mã nguồn và kiểm thử ghi nhận `Planned` theo đúng quy chuẩn SSOT.

---

## 1. Nguyên Tắc Thiết Kế Ma Trận Truy Vết (Traceability Principles)

1. **Tuân thủ mẫu đề bài (Mục 8.1):** Cấu trúc 5 cột bắt buộc: `Mã yêu cầu` | `Use-case / User Story` | `Thiết kế / Sơ đồ` | `Code / API` | `Test`.
2. **Khép kín vòng đời phát triển phần mềm (Bi-directional Traceability):** Mỗi yêu cầu nghiệp vụ bắt buộc phải xác định được Use-case sở hữu, sơ đồ UML trực quan thể hiện luồng, tệp mã nguồn xử lý và bài kiểm thử tương ứng để chứng minh tính đúng đắn.
3. **Phân định rõ ranh giới MVP và Planned:** 
   - `FR-01` đến `FR-10` thuộc Core MVP (Sprint 1 & Sprint 2): Đã có mã nguồn hoạt động; kiểm thử tự động ở `apps/api` (Vitest, Postman). Giao diện web: lint, build và test đơn vị Vitest (`apps/web`, 13 test cho giỏ hàng và bảng giá) trong CI; E2E Playwright (`tests/e2e`, 8 test) chạy trong CI cho luồng đặt hàng.
   - `FR-11` đến `FR-21` thuộc Planned (Sprint 3 & Sprint 4): Đã mô hình hóa trên Use Case Diagram và Class Diagram; cột Code và Test ghi rõ `Planned` theo mục 0 quy tắc SSOT.

---

## 2. Bảng Ma Trận Truy Vết Yêu Cầu Chức Năng (Functional Requirements — FR)

| Mã yêu cầu | Use-case / User Story | Thiết kế / Sơ đồ | Code / API | Test |
|:---:|---|---|---|---|
| **`FR-01`** | **US-01:** Duyệt xem menu đồ uống<br>**UC-01:** Xem menu sản phẩm | `Activity-01` (Giai đoạn 1: Xem menu)<br>`Class-01` (Lớp `Product`, `Category`) | **API:** `GET /products`, `GET /products/:id`<br>**Web UI:** `apps/web/src/app/page.tsx`, `apps/web/src/components/ProductCard.tsx` | **API:** `products.controller.spec.ts` (4 test), `swagger.spec.ts`<br>**Postman:** nhóm Products<br>**Web:** CI chạy lint và build<br>**E2E:** `tests/e2e/checkout.spec.ts` (mở menu, chọn món) |
| **`FR-02`** | **US-02:** Tùy biến size & topping<br>**UC-02:** Xem chi tiết & tùy chọn món | `Activity-01` (Giai đoạn 2: Chọn món & Size)<br>`Class-01` (Lớp `Product`, `OrderItem`, enum `Size`) | **Web UI:** `apps/web/src/components/ProductDetailModal.tsx`<br>**Bảng giá niêm yết:** phía server ở `apps/api/src/orders/pricing.ts` | **Server:** `orders.controller.spec.ts` (tính tổng theo size, topping)<br>**Web:** CI chạy lint và build<br>**E2E:** `tests/e2e/checkout.spec.ts` (Size M + Trân châu đen, tổng 42.000đ) |
| **`FR-03`** | **US-03:** Quản lý giỏ hàng phía Client<br>**UC-03:** Quản lý giỏ hàng | `Activity-01` (Giai đoạn 3: Giỏ hàng)<br>`ADR-004:` Quản lý State bằng Zustand | **UI:** `apps/web/src/app/cart/page.tsx`<br>**Store:** `apps/web/src/store/useCartStore.ts` (Zustand + `localStorage`) | **E2E:** `tests/e2e/checkout.spec.ts` (thêm vào giỏ, vào giỏ hàng, sang thanh toán)<br>**Web:** CI chạy lint và build<br>Kiểm tra thủ công: thêm, sửa, xóa dòng giỏ |
| **`FR-04`** | **US-04:** Đăng ký & Đăng nhập bằng SĐT<br>**UC-04:** Đăng ký / Đăng nhập tài khoản | `Activity-01` (Giai đoạn 4: Xác thực)<br>`Sequence-01:` JWT và Auth Header<br>`Class-01:` Lớp `User`, enum `Role` | **API:** `POST /auth/register`, `POST /auth/login`<br>**Guard:** `apps/api/src/auth/jwt-auth.guard.ts`, `bcryptjs`<br>**Web UI:** `apps/web/src/components/AuthModal.tsx` | `auth.controller.spec.ts` (7 test: băm mật khẩu, chuẩn hóa SĐT, 409 trùng, 401 chung, guard)<br>**Postman:** nhóm Auth<br>**E2E:** `tests/e2e/checkout.spec.ts` (đăng ký và đăng nhập qua giao diện; 401 khi thiếu token) |
| **`FR-05`** | **US-05:** Tạo đơn & Server-side Pricing<br>**UC-05:** Đặt hàng & thanh toán | `Sequence-01:` Nhận DTO, tính giá CSDL, tạo Order<br>`Class-01:` Lớp `Order`, `OrderItem`, enum `OrderStatus` | **API:** `POST /orders`<br>**Service:** `OrdersService.create`<br>**Pricing:** `apps/api/src/orders/pricing.ts` | `orders.controller.spec.ts` (nhóm `POST /orders`: tổng do server tính, 400, 409 hết hàng)<br>**Postman:** nhóm Orders<br>**E2E:** `tests/e2e/checkout.spec.ts` (đơn PAID, tổng 42.000đ do server tính) |
| **`FR-06`** | **US-06:** Thanh toán mô phỏng Thẻ/Ví<br>**UC-05:** Đặt hàng & thanh toán | `Sequence-01:` Cổng thanh toán mô phỏng, nhánh `alt`<br>`Class-01:` Lớp `Payment`, enum `PaymentMethod`, `PaymentStatus` | **API:** `POST /payments`<br>**Service:** `PaymentsService.pay`<br>**Mô phỏng:** `apps/api/src/payments/mock-gateway.ts` (thẻ `0000`, ví trên 500.000đ) | `payments.controller.spec.ts` (nhóm `POST /payments`: thành công, từ chối thẻ và ví, thanh toán lại, 404, 409)<br>**Postman:** nhóm Payments<br>**E2E:** `tests/e2e/checkout.spec.ts` (thẻ thành công; thẻ đuôi `0000` bị từ chối, đơn `PAYMENT_FAILED`; Ví 42.000đ thành công và Ví 546.000đ bị từ chối; thanh toán lại ở `/orders` thành `PAID`) |
| **`FR-07`** | **US-07:** Lịch sử đơn & Polling theo dõi<br>**UC-06:** Xem lịch sử & theo dõi đơn hàng | `Activity-01` (Giai đoạn 6: Theo dõi đơn hàng)<br>`Class-01:` Lớp `Order`, `User` | **API:** `GET /orders/me`<br>**Service:** `OrdersService.findMine`<br>**Web UI:** `apps/web/src/app/orders/page.tsx` (polling 5 giây) | **API:** `orders.controller.spec.ts` (nhóm `GET /orders/me`)<br>**Postman:** nhóm Orders<br>**E2E:** `tests/e2e/checkout.spec.ts` (trạng thái "Đã thanh toán" ở trang Đơn hàng)<br>**Web:** CI chạy lint và build |
| **`FR-08`** | **US-08:** Máy trạng thái & Khóa lạc quan<br>**UC-05:** Đặt hàng & thanh toán | `Sequence-01:` Transaction và kiểm tra `version`<br>`Class-01:` Cột `version`, enum `OrderStatus` | **Máy trạng thái:** `apps/api/src/orders/order-status.ts`<br>**Khóa lạc quan:** `PaymentsService.pay` (`$transaction`, cập nhật theo `version`) | `order-status.spec.ts` (3 test)<br>`payments.controller.spec.ts` (409 khi đơn đã `PAID`, 409 khi `version` đã đổi) |
| **`FR-09`** | **US-09:** Chống gửi trùng thanh toán<br>**UC-05:** Đặt hàng & thanh toán | `Sequence-01:` Nhánh `opt` Idempotency<br>`ADR-005:` Cơ chế Idempotency Key | **Header:** `Idempotency-Key`<br>**Code:** `apps/api/src/common/idempotency.ts`, `OrdersService.create`, `PaymentsService.pay` | `orders.controller.spec.ts` và `payments.controller.spec.ts` (nhóm `với Idempotency-Key`: gửi lại, đồng thời, sai định dạng)<br>**Postman:** gửi 2 request cùng key<br>**E2E:** `tests/e2e/checkout.spec.ts` (gửi lại cùng key trả đơn và kết quả thanh toán cũ, điểm chỉ cộng một lần; bấm xác nhận liên tiếp chỉ tạo một đơn) |
| **`FR-10`** | **US-10:** Tích điểm thành viên tự động<br>**UC-20:** Xem điểm tích lũy & lịch sử | `Sequence-01:` Cộng điểm sau khi `PAID`<br>`Class-01:` `User.loyaltyPoints`; lớp `LoyaltyTransaction` mức domain (chưa là bảng ở MVP) | **API:** `POST /payments` (cộng điểm), `GET /loyalty/me`<br>**Code:** `apps/api/src/payments/loyalty.ts` (`pointsFor`, 1 điểm/1.000đ), `LoyaltyService.getMyLoyalty`<br>**Web UI:** `Navbar.tsx`, `orders/page.tsx` | `payments/loyalty.spec.ts` (`pointsFor`)<br>`loyalty.controller.spec.ts` (3 test)<br>`payments.controller.spec.ts` (tích điểm, thất bại không tích, gửi lại không cộng lần 2)<br>**E2E:** `tests/e2e/checkout.spec.ts` (thanh toán 42.000đ cộng 42 điểm; thất bại không cộng) |
| **`FR-11`** | **US-11:** Áp dụng Voucher & Quản lý mã<br>**UC-10:** Áp mã KM; **UC-21:** Tạo mã | `Use-Case Overview:` UC-10, UC-21<br>`Class-01:` Lớp `Promotion`, Enum `DiscountType` | *Planned (Sprint 3 & 4)* | *Planned* |
| **`FR-12`** | **US-12:** Hủy đơn trước khi pha chế<br>**UC-08:** Khách hủy; **UC-13:** Quầy hủy | `Use-Case Overview:` UC-08, UC-13<br>`Class-01:` enum `OrderStatus` (`CANCELLED`); trường lý do hủy sẽ mô hình hóa khi vào Sprint 3 | *Planned (Sprint 3)* | *Planned* |
| **`FR-13`** | **US-13:** Đánh giá & gửi phản hồi dịch vụ<br>**UC-09:** Đánh giá & gửi phản hồi | `Use-Case Overview:` UC-09 | *Planned (Sprint 3)* | *Planned* |
| **`FR-14`** | **US-14:** Báo cáo doanh thu & sản lượng<br>**UC-19:** Báo cáo thống kê | `Use-Case Overview:` UC-19 | *Planned (Sprint 4)* | *Planned* |
| **`FR-15`** | **UC-14:** Nhập kho; **UC-17:** Tồn kho | `Use-Case Overview:` UC-14, UC-17 | *Planned (Sprint 4)* | *Planned* |
| **`FR-16`** | **UC-16:** Quản lý công thức pha chế | `Use-Case Overview:` UC-16 | *Planned (Sprint 4)* | *Planned* |
| **`FR-17`** | **UC-17:** Cảnh báo tồn kho tối thiểu | `Use-Case Overview:` UC-17 | *Planned (Sprint 4)* | *Planned* |
| **`FR-18`** | **UC-15:** Quản lý menu, danh mục, giá | `Use-Case Overview:` UC-15<br>`Class-01:` Lớp `Product`, `Category` | *Planned (Sprint 4)* | *Planned* |
| **`FR-19`** | **UC-18:** Quản lý tài khoản nhân viên | `Use-Case Overview:` UC-18<br>`Class-01:` Lớp `User`, Enum `Role` (`BARISTA`, `CASHIER`) | *Planned (Sprint 4)* | *Planned* |
| **`FR-20`** | **UC-11:** Pha chế & cập nhật tiến độ | `Use-Case Overview:` UC-11<br>`Class-01:` Enum `OrderStatus` (`PREPARING`, `READY`) | *Planned (Sprint 3)* | *Planned* |
| **`FR-21`** | **UC-07:** Nhận món; **UC-12:** Giao món | `Use-Case Overview:` UC-07, UC-12<br>`Class-01:` Thuộc tính `Order.pickupCode` (mã 6 số) | *Planned (Sprint 3)* | *Planned* |

---

## 3. Bảng Ma Trận Truy Vết Yêu Cầu Phi Chức Năng (Non-Functional Requirements — NFR)

| Mã NFR | Nhóm chất lượng | Nội dung đặc tả kỹ thuật | Thiết kế & Kiến trúc | Cấu hình & Hiện thực | Kiểm chứng & Đo lường |
|:---:|---|---|---|---|---|
| **`NFR-01`** | **Bảo mật (Security)** | Không tin giá từ Client; mật khẩu băm `bcryptjs` (salt 10); JWT 24h không secret mặc định; không lưu số thẻ thô; không commit secret. | `Sequence-01:` JWT Guard<br>`docs/deployment.md` (mục 2: quản lý secrets) | `.env.example`, `.gitignore`<br>`apps/api/src/auth/jwt-auth.guard.ts` | `auth.controller.spec.ts`, `orders.controller.spec.ts` (từ chối trường giá), `payments.controller.spec.ts`<br>Rà soát secret trong lịch sử Git: làm thủ công trước khi nộp |
| **`NFR-02`** | **Độ tin cậy & Sẵn sàng (Reliability)** | Production qua HTTPS, có `GET /health`; kết quả đúng khi gửi trùng hoặc đồng thời; lỗi trả đúng mã, không lộ chi tiết nội bộ; môi trường tái tạo được bằng Docker Compose, migration và seed. Không đặt ngưỡng tốc độ. | `Deployment-01`<br>`docs/architecture/backend.md`<br>`docs/deployment.md` | `GET /health` (`AppController`)<br>`Idempotency-Key`, cột `version`<br>`docker-compose.yml`, `apps/api/Dockerfile` | `app.controller.spec.ts`, `payments.controller.spec.ts` (gửi trùng, đồng thời)<br>Smoke test `/health` trong `cd.yml` (khi đã đặt `PRODUCTION_BACKEND_URL`) |
| **`NFR-03`** | **Chất lượng & Bảo trì (Maintainability)** | Mọi PR qua CI (Install, Lint, Test, Build); API có Swagger; migration có phiên bản. | `Deployment-01`<br>`ADR-001:` Monorepo (npm, mỗi app có `package.json` riêng)<br>`ADR-002:` Modular Monolith | `.github/workflows/ci.yml`<br>`apps/api/prisma/migrations/`<br>Swagger UI tại `/docs` | CI chặn merge khi lint, test hoặc build lỗi<br>`swagger.spec.ts`<br>73 test của `apps/api` (`npx vitest run`) |
| **`NFR-04`** | **Khả dụng (Usability)** | Giao diện Mobile-first; menu có đủ 3 trạng thái: Skeleton Loading, Empty State, Error & Retry. | `Activity-01` (Giai đoạn 1)<br>`docs/architecture/frontend.md` | Tailwind CSS responsive<br>`apps/web/src/app/page.tsx`, `ProductCard.tsx` | Kiểm tra thủ công trên thiết bị di động; chưa có test tự động<br>**Lighthouse di động (13/11/2026, production):** Accessibility 92 (`/`), 95 (`/cart`, `/checkout`); Best Practices 100; CLS 0. Xem `docs/lighthouse.md` |
| **`NFR-05`** | **Hiệu năng giao diện (Performance)** | FCP không quá 1,5 giây trên 4G, TBT không quá 200 ms, đổi size/topping cập nhật giá trong 50 ms, luồng menu đến thanh toán trong 60 giây (đo sau khi API đã khởi động, xem `RSK-08`). | `docs/requirements/requirements-web.md` (NFR-05)<br>`docs/architecture/frontend.md` | Next.js 16 (App Router), build tối ưu mặc định | **Đã đo một phần** bằng Lighthouse di động (13/11/2026, production): Performance 97 ở `/`, `/cart`, `/checkout`; TBT 30 đến 80 ms (đạt); FCP trung vị 1,2 s (đạt) nhưng 3 trong 9 lượt vượt 1,5 s. *Chưa đo*: đổi size/topping trong 50 ms và luồng menu đến thanh toán trong 60 giây. Xem `docs/lighthouse.md` |

---

## 4. Bảng Tổng Hợp Độ Phủ Truy Vết (Coverage & Compliance Summary)

| Hạng mục truy vết | Số lượng thực tế | Mức độ phủ |
|---|---|---|
| Yêu cầu chức năng (FR) | 21 / 21 | 21 có Use-case và sơ đồ UML |
| Yêu cầu cốt lõi MVP (FR-01 đến FR-10) | 10 / 10 | 10 có mã nguồn; 8 có kiểm thử tự động (FR-02 và FR-03 chỉ kiểm tra thủ công, CI chạy lint và build) |
| Yêu cầu mở rộng (FR-11 đến FR-21) | 11 | Planned: có Use-case và mô hình lớp, chưa có mã nguồn và kiểm thử |
| Yêu cầu phi chức năng (NFR) | 5 / 5 | 5 có giải pháp kỹ thuật; đã kiểm chứng bằng test: NFR-01, NFR-02, NFR-03; NFR-04 đã đo Lighthouse, NFR-05 mới đo một phần (xem `docs/lighthouse.md`) |
| Kiểm thử tự động hiện có | 74 test API (9 file), 13 test web (2 file) và 8 test E2E | Vitest cho `apps/api` và `apps/web` (`useCartStore.test.ts`, `pricing.test.ts` so khớp bảng giá với server); kịch bản Postman; Playwright `tests/e2e/checkout.spec.ts` (8 test: thẻ, Ví, thanh toán lại, Idempotency-Key) |
| Sơ đồ UML đối chiếu | 6 sơ đồ | Use Case tổng quát, Use Case Checkout, Activity, Sequence, Class, Deployment |

> [!NOTE]
> Ma trận theo mẫu **Mục 8.1 của đề bài Assignment 2**. Các ô Test ghi đúng trạng thái thực tế: giao diện web có test đơn vị cho giỏ hàng và tính giá, luồng đặt hàng có E2E Playwright; mọi tên file và tên test trong bảng có thể đối chiếu trực tiếp trong repo.
