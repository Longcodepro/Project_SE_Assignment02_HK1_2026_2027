# Product Backlog & Kế Hoạch Sprint — BrewLite (Assignment 2)

> **Dự án:** Ứng dụng đặt cà phê không tiền mặt BrewLite  
> **Môn học:** Công nghệ phần mềm — Học kỳ 1, Năm học 2026–2027  
> **Nhóm phát triển:**
> - **Nguyễn Thành Long (`Longcodepro`)** — Backend, Scrum Master, DevOps, Kiến trúc
> - **Trần Tấn Tài (`TaiTran263`)** — Frontend UI/UX, Quản trị trạng thái Client, QA
>
> **Mô hình ưu tiên:** **MoSCoW** (Must have · Should have · Could have · Won't have)

---

## 1. Tổng Quan Kế Hoạch 2 Sprint

```
Task 1: Yêu cầu  ──>  Task 2: Sơ đồ  ──>  Task 3: Kiến trúc  ──>  Sprint 1 (MVP Menu)  ──>  Sprint 2 (Full Flow)  ──>  Production
```

| Sprint | Thời gian dự kiến | Mục tiêu Sprint (Sprint Goal) | Phạm vi nghiệp vụ |
|---|---|---|---|
| **Sprint 1** | Tuần 1 | Xây dựng nền tảng kỹ thuật, tài liệu có kiểm soát phiên bản và phát hành **MVP đầu tiên: Luồng xem menu**. | Thiết lập Repo, Tài liệu Task 1–3, CI GitHub Actions, API `GET /products`, Menu Mobile-first, Docker Compose. |
| **Sprint 2** | Tuần 2 | Hoàn thiện luồng nghiệp vụ **End-to-End từ chọn món đến thanh toán**, tự động hóa CD và bàn giao phiên bản Production trực tiếp. | Giỏ hàng, Đặt đơn `POST /orders`, Thanh toán `POST /payments`, Lịch sử đơn `GET /orders/me`, Tích điểm, CD GHCR, Production Vercel + Render + Neon. |

---

## 2. Bảng Tổng Hợp Product Backlog (MoSCoW)

| Mã Issue | Tiêu đề Issue | Phân loại MoSCoW | Sprint | Người phụ trách | Trạng thái |
|:---:|---|:---:|:---:|:---:|:---:|
| **#01** | Thiết lập cấu trúc Monorepo, quy ước Git và Definition of Done | **Must** | Sprint 1 | Long | **Done** |
| **#02** | Đặc tả bối cảnh, stakeholder, phạm vi và SRS rút gọn (Task 1) | **Must** | Sprint 1 | Long & Tài | **To do** |
| **#03** | Mô hình hóa hệ thống bằng PlantUML: Activity, Sequence, Class (Task 2) | **Must** | Sprint 1 | Long & Tài | **To do** |
| **#04** | Thiết kế kiến trúc Modular Monolith, ADR 001–005 & Deployment (Task 3) | **Must** | Sprint 1 | Long | **To do** |
| **#05** | Thiết lập pipeline Continuous Integration (CI GitHub Actions) | **Must** | Sprint 1 | Long | **Done** |
| **#06** | API danh sách sản phẩm `GET /products` và chi tiết `GET /products/:id` | **Must** | Sprint 1 | Long | **Done** |
| **#07** | Màn hình Menu Mobile-first, Product Card, loading/empty/error state | **Must** | Sprint 1 | Tài | **Done** |
| **#08** | Modal chi tiết sản phẩm: tùy chọn kích cỡ (S/M/L) và topping | **Must** | Sprint 2 | Tài | **Done** |
| **#09** | Quản lý giỏ hàng Zustand: thêm/sửa/xóa, tổng tiền và badge giỏ | **Must** | Sprint 2 | Tài | **Done** |
| **#10** | Hệ thống Auth Backend: Đăng ký, Đăng nhập JWT, băm bcrypt, Guard | **Must** | Sprint 2 | Long | **Done** |
| **#11** | Giao diện Modal Auth: Đăng ký, Đăng nhập, lưu token Axios | **Must** | Sprint 2 | Tài | **Done** |
| **#12** | API `POST /orders`: Tiếp nhận giỏ, validate DTO, lưu đơn PENDING | **Must** | Sprint 2 | Long | **Done** |
| **#13** | API `POST /payments`: Thanh toán mô phỏng Ví/Thẻ, cập nhật trạng thái | **Must** | Sprint 2 | Long | **Done** |
| **#14** | Màn hình Checkout: Chọn phương thức Ví/Thẻ, xử lý kết quả thanh toán | **Must** | Sprint 2 | Tài | **Done** |
| **#15** | API `GET /orders/me` & Màn hình lịch sử đơn hàng của người dùng | **Must** | Sprint 2 | Long & Tài | **Done** |
| **#16** | Bộ kiểm thử tự động: Unit test, Integration test và kịch bản Postman | **Must** | Sprint 2 | Long & Tài | **Done** |
| **#17** | Pipeline Continuous Delivery (CD) đóng gói Docker Image lên GHCR | **Must** | Sprint 2 | Long | **Done** |
| **#18** | Triển khai Production trực tiếp (Vercel, Render, Neon, Tunnel) & Traceability | **Must** | Sprint 2 | Cả hai | **Doing** |
| **#19** | Máy trạng thái Order State Machine chặn chuyển trạng thái đơn sai | **Should** | Sprint 2 | Long | **Done** |
| **#20** | Chống gửi trùng lặp thanh toán bằng header `Idempotency-Key` | **Should** | Sprint 2 | Long & Tài | **Done** |
| **#21** | Khóa lạc quan (Optimistic Locking cột `version`) chống xung đột đơn | **Should** | Sprint 2 | Long | **Done** |
| **#22** | Tích điểm thành viên (Loyalty points: 1 điểm / 1.000đ) khi thanh toán | **Should** | Sprint 2 | Long & Tài | **Done** |
| **#23** | Cấu hình máy chủ động (Dynamic Backend URL) kết nối Cloudflare Tunnel | **Should** | Sprint 2 | Tài | **Done** |
| **#24** | Quản lý và áp dụng mã khuyến mãi (Promotion/Voucher) giảm giá đơn | **Could** | Hậu Sprint 2 | Long & Tài | **Backlog** |
| **#25** | Hủy đơn hàng trước pha chế và ghi nhận lý do hủy đơn | **Could** | Hậu Sprint 2 | Long & Tài | **Backlog** |
| **#26** | Đánh giá chất lượng dịch vụ và phản hồi sau khi nhận đồ uống | **Could** | Hậu Sprint 2 | Long & Tài | **Backlog** |
| **#27** | Báo cáo thống kê doanh thu và sản lượng bán ra cho Quản lý | **Could** | Hậu Sprint 2 | Long | **Backlog** |
| **#--** | Ví tiền hoàn tiền nội bộ (Wallet refund) và rút tiền về ngân hàng | **Won't** | Không làm | — | **Out of Scope** |
| **#--** | Quản lý chấm công, ca làm việc nhân viên và kho nguyên liệu chi tiết | **Won't** | Không làm | — | **Out of Scope** |

---

## 3. Đặc Tả Chi Tiết Từng Issue

### [Issue #01] Thiết lập cấu trúc Monorepo, quy ước Git và Definition of Done
- **Phân loại:** **MUST HAVE** | **Sprint:** 1 | **Phụ trách:** Long
- **Mô tả:** Khởi tạo cấu trúc repository chuẩn môn học (`apps/web`, `apps/api`, `docs`, `scripts`, `tests`), thiết lập file `.gitignore`, `.env.example`, `docker-compose.yml` và tài liệu hướng dẫn quy chuẩn.
- **Tiêu chí chấp nhận:**
  - [x] Khởi tạo monorepo gồm Next.js 16 và NestJS 12.
  - [x] Thiết lập `docker-compose.yml` chạy 3 service độc lập với cổng riêng.
  - [x] Thiết lập Definition of Done và mẫu Pull Request Template.

---

### [Issue #02] Đặc tả bối cảnh, stakeholder, phạm vi và SRS rút gọn (Task 1)
- **Phân loại:** **MUST HAVE** | **Sprint:** 1 | **Phụ trách:** Long & Tài
- **Mô tả:** Soạn thảo tài liệu Task 1 gồm `context-and-scope.md` và `requirements.md` theo chuẩn đề bài.
- **Tiêu chí chấp nhận:**
  - [ ] Bảng Stakeholder (Khách hàng, Nhân viên, Quản lý, Giảng viên, Đơn vị thanh toán).
  - [ ] Danh mục In-Scope (MVP), Out-of-Scope, Giả định và Ràng buộc.
  - [ ] Danh sách FR (FR-01 đến FR-10) và NFR (NFR-01 đến NFR-05) có mức ưu tiên MoSCoW.
  - [ ] Đặc tả chi tiết Use-Case trọng tâm: *Đặt hàng & Thanh toán không dùng tiền mặt*.

---

### [Issue #03] Mô hình hóa hệ thống bằng PlantUML: Activity, Sequence, Class (Task 2)
- **Phân loại:** **MUST HAVE** | **Sprint:** 1 | **Phụ trách:** Long & Tài
- **Mô tả:** Thiết kế các sơ đồ UML cho hệ thống theo yêu cầu Task 2 bằng PlantUML, xuất đầy đủ file `.puml` và ảnh vector `.svg`.
- **Tiêu chí chấp nhận:**
  - [ ] Task 2.1: Activity Diagram luồng End-to-End có swimlane, nhánh hết hàng, chưa login, lỗi thanh toán.
  - [ ] Task 2.2: Sequence Diagram cho luồng Đặt & Thanh toán: Customer $\rightarrow$ Next.js $\rightarrow$ NestJS $\rightarrow$ DB $\rightarrow$ Payment Service, có JWT, Validate, Transaction, nhánh Alt và Idempotency.
  - [ ] Task 2.3: Class Diagram Domain gồm tối thiểu 7 lớp: `User`, `Product`, `Order`, `OrderItem`, `Payment`, `Promotion`, `LoyaltyTransaction`.

---

### [Issue #04] Thiết kế kiến trúc Modular Monolith, ADR 001–005 & Deployment (Task 3)
- **Phân loại:** **MUST HAVE** | **Sprint:** 1 | **Phụ trách:** Long
- **Mô tả:** Trình bày kiến trúc hệ thống theo mô hình Modular Monolith kết hợp Layered Architecture; viết các bản ADR kỹ thuật và vẽ Deployment Diagram production.
- **Tiêu chí chấp nhận:**
  - [ ] Tài liệu kiến trúc phân tích ưu/nhược điểm và trade-off so với Clean Architecture / Microservices.
  - [ ] Các bản ADR trong `docs/architecture/adr/`: Monorepo, Modular Architecture, Prisma PostgreSQL, Quản lý State Zustand, Chống gửi trùng Idempotency.
  - [ ] Deployment Diagram phản ánh hạ tầng thực tế: Vercel, Render, Neon PostgreSQL, Cloudflare Tunnel.

---

### [Issue #05] Thiết lập pipeline Continuous Integration (CI GitHub Actions)
- **Phân loại:** **MUST HAVE** | **Sprint:** 1 | **Phụ trách:** Long
- **Mô tả:** Thiết lập quy trình tự động kiểm tra chất lượng mã nguồn trên mỗi Pull Request.
- **Tiêu chí chấp nhận:**
  - [x] Chạy qua 4 bước bắt buộc: Install $\rightarrow$ Lint $\rightarrow$ Unit Test $\rightarrow$ Build.
  - [x] Kiểm tra độc lập `apps/api` và `apps/web`.
  - [x] Kiểm tra chạy thử bằng `docker compose up -d` và curl healthcheck.

---

### [Issue #06] API danh sách sản phẩm `GET /products` và chi tiết `GET /products/:id`
- **Phân loại:** **MUST HAVE** | **Sprint:** 1 | **Phụ trách:** Long
- **Mô tả:** Xây dựng module `products` trên NestJS, Prisma migration, seed dữ liệu mẫu 6 món cà phê mộc và tài liệu Swagger.
- **Tiêu chí chấp nhận:**
  - [x] `GET /products` trả về danh sách sản phẩm hợp lệ, mã HTTP 200.
  - [x] `GET /products/:id` trả về chi tiết sản phẩm hoặc 404 khi không tìm thấy.
  - [x] Tích hợp Swagger UI tại `/docs` và có unit test đi kèm.

---

### [Issue #07] Màn hình Menu Mobile-first, Product Card, loading/empty/error state
- **Phân loại:** **MUST HAVE** | **Sprint:** 1 | **Phụ trách:** Tài
- **Mô tả:** Xây dựng giao diện danh sách đồ uống trên Next.js 16, hiển thị dạng thẻ sản phẩm trực quan, tối ưu cho màn hình di động.
- **Tiêu chí chấp nhận:**
  - [x] Gọi API lấy danh sách món và render dạng lưới card.
  - [x] Có trạng thái loading skeleton, trạng thái rỗng và thông báo lỗi kết nối.
  - [x] Giao diện chuẩn mobile-first, mượt mà trên điện thoại.

---

### [Issue #08] Modal chi tiết sản phẩm: tùy chọn kích cỡ (S/M/L) và topping
- **Phân loại:** **MUST HAVE** | **Sprint:** 2 | **Phụ trách:** Tài
- **Mô tả:** Xây dựng cửa sổ Modal khi bấm vào món nước, cho phép khách hàng chọn size và topping đi kèm.
- **Tiêu chí chấp nhận:**
  - [x] Chọn Size S (+0đ), M (+5.000đ), L (+10.000đ).
  - [x] Chọn các loại topping: Trân châu (+8.000đ), Kem cheese (+10.000đ), Thạch cafe (+6.000đ).
  - [x] Tổng tiền tự động cập nhật theo thời gian thực trên modal.

---

### [Issue #09] Quản lý giỏ hàng Zustand: thêm/sửa/xóa, tổng tiền và badge giỏ
- **Phân loại:** **MUST HAVE** | **Sprint:** 2 | **Phụ trách:** Tài
- **Mô tả:** Quản lý trạng thái giỏ hàng phía Client bằng thư viện Zustand, lưu trữ cục bộ qua localStorage.
- **Tiêu chí chấp nhận:**
  - [x] Thêm món từ modal vào giỏ hàng (phân biệt theo size và topping).
  - [x] Tăng/giảm số lượng và xóa món khỏi giỏ hàng.
  - [x] Badge hiển thị số lượng ly trên thanh điều hướng; tính tổng tiền giỏ hàng chuẩn xác.

---

### [Issue #10] Hệ thống Auth Backend: Đăng ký, Đăng nhập JWT, băm bcrypt, Guard
- **Phân loại:** **MUST HAVE** | **Sprint:** 2 | **Phụ trách:** Long
- **Mô tả:** Xây dựng module xác thực cho người dùng trên backend, bảo mật mật khẩu và cấp phát JWT token.
- **Tiêu chí chấp nhận:**
  - [x] `POST /auth/register`: Đăng ký tài khoản, mã hóa mật khẩu bằng bcryptjs.
  - [x] `POST /auth/login`: Xác thực thông tin đăng nhập, trả về Access Token.
  - [x] `JwtAuthGuard`: Chặn các API yêu cầu đăng nhập (`POST /orders`, `POST /payments`, `GET /orders/me`).

---

### [Issue #11] Giao diện Modal Auth: Đăng ký, Đăng nhập, lưu token Axios
- **Phân loại:** **MUST HAVE** | **Sprint:** 2 | **Phụ trách:** Tài
- **Mô tả:** Xây dựng Modal giao diện đăng ký, đăng nhập và quản lý phiên người dùng trên web.
- **Tiêu chí chấp nhận:**
  - [x] Hỗ trợ chuyển đổi qua lại giữa form Đăng nhập và Đăng ký.
  - [x] Lưu accessToken vào store và tự động đính kèm vào header `Authorization: Bearer <token>`.
  - [x] Hiển thị trạng thái đăng nhập, tên người dùng và nút Đăng xuất trên Navbar.

---

### [Issue #12] API `POST /orders`: Tiếp nhận giỏ, validate DTO, lưu đơn PENDING
- **Phân loại:** **MUST HAVE** | **Sprint:** 2 | **Phụ trách:** Long
- **Mô tả:** Tiếp nhận danh sách món từ giỏ hàng, server tự tính lại tổng tiền theo bảng giá niêm yết, tạo đơn ở trạng thái PENDING.
- **Tiêu chí chấp nhận:**
  - [x] Validate đầu vào chặt chẽ bằng `class-validator`, từ chối các trường lạ (400).
  - [x] Server tính lại tổng tiền = $\sum (\text{giá gốc} + \text{phụ thu size} + \text{topping}) \times \text{số lượng}$.
  - [x] Tạo đơn hàng gắn với `userId` trong JWT token, trạng thái khởi tạo `PENDING`.

---

### [Issue #13] API `POST /payments`: Thanh toán mô phỏng Ví/Thẻ, cập nhật trạng thái
- **Phân loại:** **MUST HAVE** | **Sprint:** 2 | **Phụ trách:** Long
- **Mô tả:** Tiếp nhận yêu cầu thanh toán mô phỏng không tiền mặt bằng Ví hoặc Thẻ ngân hàng.
- **Tiêu chí chấp nhận:**
  - [x] Hỗ trợ phương thức `WALLET` và `CARD`.
  - [x] Quy tắc mô phỏng: Thẻ có 4 số cuối `0000` bị từ chối; Ví từ chối đơn trên 500.000đ.
  - [x] Thanh toán thành công chuyển đơn sang `PAID`; thất bại chuyển sang `PAYMENT_FAILED` (cho phép thanh toán lại).

---

### [Issue #14] Màn hình Checkout: Chọn phương thức Ví/Thẻ, xử lý kết quả thanh toán
- **Phân loại:** **MUST HAVE** | **Sprint:** 2 | **Phụ trách:** Tài
- **Mô tả:** Xây dựng màn hình thanh toán, cho phép chọn nguồn tiền, nhập số thẻ và hiển thị kết quả đặt hàng.
- **Tiêu chí chấp nhận:**
  - [x] Chọn Ví hoặc Thẻ ngân hàng (có ô nhập số thẻ cho Thẻ).
  - [x] Gọi API thanh toán, hiển thị màn hình thông báo Đặt hàng thành công (`order-success`).
  - [x] Khi thanh toán thất bại, thông báo lý do rõ ràng và hiển thị nút "Thử lại".

---

### [Issue #15] API `GET /orders/me` & Màn hình lịch sử đơn hàng của người dùng
- **Phân loại:** **MUST HAVE** | **Sprint:** 2 | **Phụ trách:** Long & Tài
- **Mô tả:** Cho phép khách hàng xem lại danh sách các đơn hàng đã đặt trong quá khứ kèm trạng thái chi tiết.
- **Tiêu chí chấp nhận:**
  - [x] Backend: `GET /orders/me` trả về danh sách đơn của người dùng đang đăng nhập (mới nhất xếp trước).
  - [x] Frontend: Trang `/orders` hiển thị danh sách đơn, chi tiết món, tổng tiền và badge trạng thái (`PAID`, `PENDING`, `PAYMENT_FAILED`).

---

### [Issue #16] Bộ kiểm thử tự động: Unit test, Integration test và kịch bản Postman
- **Phân loại:** **MUST HAVE** | **Sprint:** 2 | **Phụ trách:** Long & Tài
- **Mô tả:** Xây dựng bộ test toàn diện đảm bảo chất lượng hệ thống trước khi nghiệm thu.
- **Tiêu chí chấp nhận:**
  - [x] Unit test cho nghiệp vụ tính giá, state machine và tích điểm (64/64 tests pass).
  - [x] Bộ sưu tập Postman Collection kiểm thử tự động các luồng API chính.

---

### [Issue #17] Pipeline Continuous Delivery (CD) đóng gói Docker Image lên GHCR
- **Phân loại:** **MUST HAVE** | **Sprint:** 2 | **Phụ trách:** Long
- **Mô tả:** Thiết lập quy trình CD tự động kích hoạt khi merge code vào nhánh `main`.
- **Tiêu chí chấp nhận:**
  - [x] Tự động đóng gói Docker image của `apps/api`.
  - [x] Gắn tag metadata commit SHA và `latest`.
  - [x] Đăng tải thành công lên GitHub Container Registry (`ghcr.io`).

---

### [Issue #18] Triển khai Production trực tiếp (Vercel, Render, Neon, Tunnel) & Traceability
- **Phân loại:** **MUST HAVE** | **Sprint:** 2 | **Phụ trách:** Long & Tài
- **Mô tả:** Vận hành hệ thống thực tế trên môi trường Cloud có thể truy cập được từ bên ngoài; lập Ma trận truy vết.
- **Tiêu chí chấp nhận:**
  - [x] Frontend chạy trực tiếp trên Vercel qua HTTPS.
  - [x] Backend chạy trên Render Cloud hoặc Cloudflare Tunnel (HTTPS).
  - [x] Database chạy trên Neon PostgreSQL Cloud (Singapore).
  - [ ] Hoàn thành tài liệu `docs/traceability-matrix.md` ánh xạ 1-1 các yêu cầu.

---

### [Issue #19] [Nâng cao] Order State Machine ngăn chặn chuyển trạng thái đơn hàng sai
- **Phân loại:** **SHOULD HAVE** | **Sprint:** 2 | **Phụ trách:** Long
- **Mô tả:** Áp dụng mô hình máy trạng thái hữu hạn (FSM) cho đơn hàng: `PENDING → PAID | PAYMENT_FAILED`, `PAYMENT_FAILED → PAID`, chặn mọi chuyển đổi trạng thái bất hợp lệ (trả 409 Conflict).
- **Tiêu chí chấp nhận:**
  - [x] Không thể thanh toán cho đơn hàng đã `PAID`.
  - [x] Có unit test kiểm thử toàn diện các nhánh chuyển trạng thái.

---

### [Issue #20] [Nâng cao] Chống gửi trùng lặp thanh toán bằng header `Idempotency-Key`
- **Phân loại:** **SHOULD HAVE** | **Sprint:** 2 | **Phụ trách:** Long & Tài
- **Mô tả:** Tránh việc khách hàng bị trừ tiền 2 lần do mạng lag hoặc bấm nút thanh toán liên tục.
- **Tiêu chí chấp nhận:**
  - [x] Client sinh UUID đính kèm vào header `Idempotency-Key`.
  - [x] Backend ghi nhận key; nếu gặp lại cùng key sẽ trả kết quả cũ mà không tạo thêm giao dịch mới.

---

### [Issue #21] [Nâng cao] Khóa lạc quan (Optimistic Locking với cột `version`) chống xung đột
- **Phân loại:** **SHOULD HAVE** | **Sprint:** 2 | **Phụ trách:** Long
- **Mô tả:** Đơn hàng được bổ sung cột `version`. Mỗi lần cập nhật sẽ tăng `version`. Nếu hai yêu cầu sửa đơn đến cùng lúc, yêu cầu thứ hai sẽ bị từ chối 409 Conflict thay vì ghi đè dữ liệu.
- **Tiêu chí chấp nhận:**
  - [x] Bổ sung cột `version` trong bảng `Order`.
  - [x] Kiểm tra và tăng version trong transaction cập nhật đơn.

---

### [Issue #22] [Nâng cao] Tích điểm thành viên (Loyalty points: 1 điểm / 1.000đ) khi thanh toán
- **Phân loại:** **SHOULD HAVE** | **Sprint:** 2 | **Phụ trách:** Long & Tài
- **Mô tả:** Tự động tích lũy điểm thưởng cho khách hàng sau khi hoàn tất đơn hàng thành công.
- **Tiêu chí chấp nhận:**
  - [x] Tích 1 điểm cho mỗi 1.000đ giá trị đơn hàng (làm tròn xuống).
  - [x] Cập nhật `loyaltyPoints` vào tài khoản khách hàng và hiển thị trên màn hình xác nhận đơn.

---

### [Issue #23] [Nâng cao] Cấu hình máy chủ động (Dynamic Backend URL) kết nối Cloudflare Tunnel
- **Phân loại:** **SHOULD HAVE** | **Sprint:** 2 | **Phụ trách:** Tài & Long
- **Mô tả:** Cung cấp nút bấm cấu hình Server trực tiếp trên giao diện web, cho phép người dùng dán link HTTPS Cloudflare Tunnel hoặc Render để demo mượt mà trên điện thoại.
- **Tiêu chí chấp nhận:**
  - [x] Nút "Server" trên thanh Navbar mở Modal cấu hình.
  - [x] Hỗ trợ kiểm tra độ trễ mạng (Ping test) tới máy chủ.
  - [x] Lưu URL vào `localStorage` và tự động áp dụng cho các request sau.

---

### [Issue #24] [Mở rộng - HK1] Quản lý và áp dụng mã khuyến mãi (Promotion/Voucher) giảm giá đơn
- **Phân loại:** **COULD HAVE** | **Sprint:** Hậu Sprint 2 (Nếu còn thời gian) | **Phụ trách:** Long & Tài
- **Mô tả:** Khách hàng nhập mã giảm giá (`FIXED` hoặc `PERCENT`) khi thanh toán; hệ thống kiểm tra điều kiện đơn tối thiểu và trừ tiền.
- **Tiêu chí chấp nhận:**
  - [ ] Bảng `Promotion` lưu mã, mức giảm, thời hạn và số lượt dùng.
  - [ ] API validate mã và trừ tiền vào tổng đơn.

---

### [Issue #25] [Mở rộng - HK1] Hủy đơn hàng trước pha chế và ghi nhận lý do hủy đơn
- **Phân loại:** **COULD HAVE** | **Sprint:** Hậu Sprint 2 (Nếu còn thời gian) | **Phụ trách:** Long & Tài
- **Mô tả:** Cho phép khách hàng hoặc nhân viên hủy đơn đang ở trạng thái `PENDING` hoặc `PAID` (chưa chuyển sang `PREPARING`), ghi lại lý do hủy.
- **Tiêu chí chấp nhận:**
  - [ ] Chuyển trạng thái đơn sang `CANCELLED`.
  - [ ] Lưu người hủy (`cancelledBy`) và ghi chú hủy (`cancelNote`).

---

### [Issue #26] [Mở rộng - HK1] Đánh giá chất lượng dịch vụ và phản hồi sau khi nhận đồ uống
- **Phân loại:** **COULD HAVE** | **Sprint:** Hậu Sprint 2 (Nếu còn thời gian) | **Phụ trách:** Long & Tài
- **Mô tả:** Khách hàng đánh giá số sao (1-5 sao) và gửi bình luận sau khi đơn hàng hoàn tất.
- **Tiêu chí chấp nhận:**
  - [ ] Bảng `Feedback` lưu đơn hàng, số sao, nội dung nhận xét.
  - [ ] Màn hình chi tiết đơn có form gửi đánh giá.

---

### [Issue #27] [Mở rộng - HK1] Báo cáo thống kê doanh thu và sản lượng bán ra cho Quản lý
- **Phân loại:** **COULD HAVE** | **Sprint:** Hậu Sprint 2 (Nếu còn thời gian) | **Phụ trách:** Long
- **Mô tả:** API thống kê tổng doanh thu, số đơn thành công và top các món bán chạy nhất trong ngày/tuần.
- **Tiêu chí chấp nhận:**
  - [ ] API `GET /admin/stats/overview` tổng hợp số liệu doanh thu.
  - [ ] Biểu đồ thống kê cơ bản.

---

## 4. Các Chức Năng Loại Trừ (WON'T HAVE - Out of Scope)

Theo đề bài Assignment 2, để đảm bảo tính khả thi và chất lượng trong thời gian 2 Sprint của nhóm 2 người, các tính năng sau **chính thức không thực hiện**:
1. **Ví hoàn tiền nội bộ (Wallet Refund) & Rút tiền ngân hàng:** Không tạo hệ thống nạp/rút số dư ví phức tạp.
2. **Quản lý ca làm việc & chấm công nhân viên:** Không thuộc phạm vi bán cà phê cốt lõi.
3. **Quản lý định lượng kho chi tiết (hạt cà phê, siro, đường, sữa):** Chỉ kiểm soát tồn kho theo số lượng ly đồ uống hoàn chỉnh bán ra trong ngày (`dailyQuota`).
4. **Hạ tầng SMS Brandname / Email OTP trả phí:** Chỉ sử dụng JWT đăng nhập mật khẩu và mô phỏng giao dịch thanh toán.
