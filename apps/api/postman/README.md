# BỘ KỊCH BẢN KIỂM THỬ TỰ ĐỘNG POSTMAN / NEWMAN (E2E TEST SUITE)

> **Dự án:** BrewLite - Hệ thống Đặt cà phê không dùng tiền mặt (Assignment 2)  
> **Phiên bản tài liệu:** 1.0  
> **Môi trường mục tiêu:** Local (`http://localhost:4003`), PostgreSQL (`localhost:4005`)  
> **Bộ sưu tập Postman:** `apps/api/postman/BrewLite.postman_collection.json`  
> **File môi trường:** `apps/api/postman/BrewLite.local.postman_environment.json`  
> **Dữ liệu kiểm thử hướng dữ liệu (DDT):** `apps/api/postman/test-cases-auth.json`

---

## 1. TỔNG QUAN HỆ THỐNG KIỂM THỬ

Bộ kịch bản kiểm thử này được thiết kế để chạy tự động và độc lập bằng **Newman CLI** hoặc qua giao diện **Postman Desktop**. 

### 1.1. Cơ chế tự động luân chuyển dữ liệu (Chaining Variables)
Toàn bộ kịch bản được liên kết chuỗi dữ liệu động thông qua Postman Environment variables:
1. `{{customerToken}}`: Tự động trích xuất từ phản hồi của API Đăng nhập khách hàng để gắn vào header `Authorization: Bearer <token>` cho các request đặt hàng/thanh toán.
2. `{{baristaToken}}`: Token của tài khoản Pha chế (`0900000001`), dùng để thao tác màn hình bếp KDS.
3. `{{managerToken}}`: Token của tài khoản Quản lý (`0900000003`), dùng để xem báo cáo doanh thu.
4. `{{createdOrderId}}`: Lưu lại ID của đơn hàng vừa tạo (`POST /orders`) để chuyển tiếp sang API Thanh toán (`POST /payments`) và KDS (`PATCH /kds/orders/:id/status`).
5. `{{kdsVersion}}`: Quản lý phiên bản khóa lạc quan (optimistic lock) cho đơn hàng trong KDS nhằm đảm bảo tính toàn vẹn trạng thái khi Barista cập nhật.

---

## 2. BẢNG TỔNG HỢP CÁC KỊCH BẢN KIỂM THỬ (TEST MATRIX)

| Mã TC | Nhóm chức năng | Tên kịch bản | Method & Endpoint | Mã HTTP | Tiêu chí nghiệm thu (Assertions) |
|:---:|---|---|---|:---:|---|
| **TC-01** | Health & Docs | Kiểm tra Endpoint gốc | `GET /` | `200 OK` | Body trả về đúng chuỗi `"Hello World!"` |
| **TC-02** | Health & Docs | Kiểm tra sức khỏe hệ thống | `GET /health` | `200 OK` | `status = "ok"`, có trường `timestamp` |
| **TC-03** | Health & Docs | Kiểm tra OpenAPI Schema | `GET /docs-json` | `200 OK` | Title là `"BrewLite API"`, tồn tại schema `/products` |
| **TC-04** | Products | Lấy danh sách Menu món | `GET /products` | `200 OK` | Mảng không rỗng; có `id, name, price, category` |
| **TC-05** | Products | Xem chi tiết món hợp lệ | `GET /products/1` | `200 OK` | Đúng `id = 1`, tên là `"Cà phê sữa"` |
| **TC-06** | Products | Xem món không tồn tại | `GET /products/999` | `404 Not Found` | Báo lỗi không tìm thấy món |
| **TC-07** | Products | ID sai kiểu số | `GET /products/abc` | `400 Bad Request` | ParseIntPipe chặn ngay tại Controller |
| **TC-08** | Products | Lấy bảng phụ thu & topping | `GET /menu-options` | `200 OK` | Trả về mảng `sizes` (S, M, L) và `toppings` |
| **TC-09** | Auth | Đăng ký khách hàng mới | `POST /auth/register` | `201 Created` | Tạo thành công; KHÔNG chứa `passwordHash` |
| **TC-10** | Auth | Đăng ký trùng số điện thoại | `POST /auth/register` | `409 Conflict` | Báo lỗi `"Số điện thoại đã được đăng ký"` |
| **TC-11** | Auth | Mật khẩu quá ngắn (< 6 ký tự) | `POST /auth/register` | `400 Bad Request` | ValidationPipe chặn lỗi mật khẩu ngắn |
| **TC-12** | Auth | Đăng nhập khách hàng | `POST /auth/login` | `200 OK` | Trả về `accessToken` chuẩn JWT (3 phần base64) |
| **TC-13** | Auth | Đăng nhập sai mật khẩu | `POST /auth/login` | `401 Unauthorized` | Báo lỗi `"Số điện thoại hoặc mật khẩu không đúng"` |
| **TC-14** | Auth | Đăng nhập Barista | `POST /auth/login` | `200 OK` | Cấp token vai trò BARISTA (`baristaToken`) |
| **TC-15** | Auth | Đăng nhập Manager | `POST /auth/login` | `200 OK` | Cấp token vai trò MANAGER (`managerToken`) |
| **TC-16** | Orders | Đặt đơn khi chưa đăng nhập | `POST /orders` | `401 Unauthorized` | `JwtAuthGuard` chặn do thiếu Header Authorization |
| **TC-17** | Orders | Đặt đơn với giỏ hàng rỗng | `POST /orders` | `400 Bad Request` | ValidationPipe chặn `@ArrayNotEmpty()` |
| **TC-18** | Orders | Đặt đơn hợp lệ (+voucher) | `POST /orders` | `201 Created` | Tạo đơn `PENDING`, tổng tiền do server tính |
| **TC-19** | Orders | Chống gửi đơn trùng lặp | `POST /orders` | `201 Created` | Cùng `Idempotency-Key` trả lại đơn cũ, không trừ lượt |
| **TC-20** | Orders | Xem lịch sử đơn của khách | `GET /orders/me` | `200 OK` | Đơn vừa đặt nằm ở đầu danh sách, status = PENDING |
| **TC-21** | Payments | Thanh toán khi chưa đăng nhập | `POST /payments` | `401 Unauthorized` | Chặn do thiếu token xác thực |
| **TC-22** | Payments | Thẻ đuôi 0000 bị từ chối | `POST /payments` | `201 Created` | `status = PAYMENT_FAILED`, lý do: Thẻ bị từ chối |
| **TC-23** | Payments | Thanh toán Ví thành công | `POST /payments` | `201 Created` | Đơn chuyển sang `PAID`, cộng điểm tích lũy |
| **TC-24** | Payments | Thanh toán lại đơn đã PAID | `POST /payments` | `409 Conflict` | Máy trạng thái chặn không cho trả lần 2 |
| **TC-25** | KDS | Khách xem màn hình bếp | `GET /kds/orders` | `403 Forbidden` | `RolesGuard` chặn tài khoản CUSTOMER |
| **TC-26** | KDS | Barista xem đơn cần pha | `GET /kds/orders` | `200 OK` | Trả về danh sách đơn pha chế |
| **TC-27** | KDS | Barista nhận pha chế | `PATCH /kds/orders/:id/status` | `200 OK` | Đơn chuyển sang `PREPARING`, version tăng lên |
| **TC-28** | KDS | Barista báo xong món | `PATCH /kds/orders/:id/status` | `200 OK` | Đơn chuyển sang `READY`, hệ thống sinh mã nhận nội bộ |
| **TC-29** | Cancel | Tạo đơn phụ để test hủy | `POST /orders` | `201 Created` | Lưu mã đơn phụ vào `cancelOrderId` |
| **TC-30** | Cancel | Khách tự hủy đơn PENDING | `POST /orders/:id/cancel` | `200 OK` | Đơn chuyển `CANCELLED`, version tăng lên 1 |
| **TC-31** | Reports | Khách xem báo cáo doanh thu | `GET /admin/reports` | `403 Forbidden` | `RolesGuard` chặn truy cập báo cáo |
| **TC-32** | Reports | Manager xem báo cáo | `GET /admin/reports` | `200 OK` | Trả về doanh thu tổng, chuỗi ngày, top 5 món |

---

## 3. CHI TIẾT CÁC KỊCH BẢN THEO MODULE

### Module 01: Hạ tầng & Sức khỏe (Health & Docs)
- **TC-01:** `GET /` kiểm tra web server Node.js đang chạy và phản hồi text thuần.
- **TC-02:** `GET /health` kiểm tra tình trạng kết nối. Thường dùng cho Nginx Load Balancer và Docker Compose healthcheck.
- **TC-03:** `GET /docs-json` tải toàn bộ đặc tả OpenAPI của Swagger dưới dạng JSON, kiểm tra tính sẵn sàng của tài liệu.

### Module 02: Menu & Sản phẩm (Products & Menu)
- **TC-04:** `GET /products` lấy toàn bộ danh mục sản phẩm đang mở bán (`isAvailable = true`). Đảm bảo mỗi món có liên kết với object `category`.
- **TC-05:** `GET /products/1` kiểm tra câu lệnh tìm kiếm theo ID Primary Key.
- **TC-06:** `GET /products/999` kiểm tra phản hồi `404 Not Found` khi truy vấn món không tồn tại.
- **TC-07:** `GET /products/abc` kiểm tra `ParseIntPipe` của NestJS: chặn lỗi ép kiểu chữ sang số ngay tại Controller mà không gửi câu truy vấn rác xuống Database.
- **TC-08:** `GET /menu-options` lấy danh sách phụ thu theo size (S: +0đ, M: +5.000đ, L: +10.000đ) và bảng giá các loại topping (Trân châu: 8.000đ, Kem cheese: 10.000đ, Thạch: 6.000đ).

### Module 03: Xác thực & Phân quyền (Auth)
- **TC-09:** `POST /auth/register` sinh ngẫu nhiên số điện thoại di động Việt Nam `09xxxxxxxx` và đăng ký tài khoản khách hàng. Kiểm tra bảo mật: trường `passwordHash` tuyệt đối không được trả về trong JSON.
- **TC-10:** `POST /auth/register` gửi lại đúng số điện thoại vừa tạo để kiểm tra ràng buộc duy nhất (Unique Constraint) của Postgres, bắt mã lỗi `P2002` và trả về `409 Conflict`.
- **TC-11:** `POST /auth/register` gửi mật khẩu 3 ký tự để kiểm tra `class-validator` chặn `400 Bad Request`.
- **TC-12:** `POST /auth/login` đăng nhập bằng tài khoản vừa tạo. Test script tự động đọc trường `accessToken`, kiểm tra token có đúng định dạng JWT 3 phần tách bằng dấu chấm (`header.payload.signature`), sau đó lưu vào biến môi trường `{{customerToken}}`.
- **TC-13:** `POST /auth/login` cố tình đăng nhập sai mật khẩu để kiểm tra thông báo lỗi `401 Unauthorized` chung (chống kỹ thuật dò tài khoản).
- **TC-14 & TC-15:** Đăng nhập lần lượt tài khoản nhân viên pha chế (`0900000001`) và Quản lý (`0900000003`) để lưu `{{baristaToken}}` và `{{managerToken}}`.

### Module 04: Đặt hàng (Orders)
- **TC-16:** `POST /orders` không gửi header Authorization $\rightarrow$ Kiểm tra `JwtAuthGuard` ném mã lỗi `401 Unauthorized`.
- **TC-17:** `POST /orders` gửi mảng giỏ hàng rỗng `items: []` $\rightarrow$ Kiểm tra chặn `400 Bad Request`.
- **TC-18:** `POST /orders` gửi đơn hàng gồm: 1 Cà phê sữa size M, thêm Trân châu đen, áp mã giảm giá `WELCOME10`. Đồng thời sinh header `Idempotency-Key: order-key-<timestamp>`. Kiểm tra:
  - Trạng thái ban đầu bắt buộc là `PENDING`.
  - Tổng tiền `total` do Server tính lại từ Database (không tin giá Client).
  - Tự động gán mã đơn vào biến `{{createdOrderId}}`.
- **TC-19:** `POST /orders` gửi lại request với cùng header `Idempotency-Key` vừa dùng ở TC-18. Kiểm tra cơ chế chống tạo đơn trùng: Server lập tức trả về đúng `id` của đơn cũ mà không sinh đơn mới và không trừ tiếp lượt dùng voucher.
- **TC-20:** `GET /orders/me` kiểm tra lịch sử đơn hàng của chính tài khoản khách đang đăng nhập. Đơn mới tạo phải nằm ở vị trí đầu tiên (sắp xếp giảm dần theo thời gian).

### Module 05: Thanh toán (Payments)
- **TC-21:** `POST /payments` gọi thanh toán khi chưa đăng nhập $\rightarrow$ Chặn `401`.
- **TC-22:** `POST /payments` chọn phương thức `CARD` với số thẻ tận cùng bằng `0000`. Kiểm tra cổng thanh toán mô phỏng: trả về HTTP 201 với `status = PAYMENT_FAILED` và lý do `"Thẻ bị từ chối"`.
- **TC-23:** `POST /payments` thanh toán lại bằng phương thức Ví điện tử `WALLET`. Kiểm tra:
  - Trạng thái chuyển thành công sang `PAID`.
  - Điểm tích lũy `pointsEarned` được cộng theo tỷ lệ 1 điểm / 1.000đ.
  - Tự động trừ nguyên liệu thật trong kho thông qua Database Transaction.
- **TC-24:** `POST /payments` cố tình gửi yêu cầu thanh toán lần nữa cho đơn đã `PAID` $\rightarrow$ Máy trạng thái chặn lại và ném lỗi `409 Conflict`.

### Module 06: Màn hình Bếp (Kitchen Display System - KDS)
- **TC-25:** Khách hàng dùng `{{customerToken}}` gọi vào API bếp `GET /kds/orders` $\rightarrow$ `RolesGuard` phát hiện vai trò là `CUSTOMER`, lập tức từ chối bằng `403 Forbidden`.
- **TC-26:** Barista dùng `{{baristaToken}}` gọi `GET /kds/orders` $\rightarrow$ Được cấp quyền `200 OK`, danh sách các đơn đã thanh toán hiển thị trên màn hình bếp.
- **TC-27:** Barista gọi `PATCH /kds/orders/{{createdOrderId}}/status` với body `{ "status": "PREPARING", "version": {{kdsVersion}} }` $\rightarrow$ Trạng thái chuyển thành đang pha chế, version tăng lên để khóa lạc quan.
- **TC-28:** Barista gọi tiếp với body `{ "status": "READY", "version": {{kdsVersion}} }` (đã pha xong) $\rightarrow$ Đơn chuyển sang `READY`, hệ thống tự sinh mã lấy hàng duy nhất 6 chữ số (`pickupCode`) trong cơ sở dữ liệu để khách hàng hiển thị và đối soát với quầy.

### Module 07: Hủy đơn hàng (Cancel Order)
- **TC-29:** Tạo một đơn hàng phụ ở trạng thái `PENDING` để kiểm thử luồng hủy.
- **TC-30:** Khách hàng gọi `POST /orders/{{cancelOrderId}}/cancel` kèm `version: 0`. Kiểm tra:
  - Khóa lạc quan (Optimistic Locking): `version` hợp lệ cho phép chuyển trạng thái thành `CANCELLED`.
  - Kết quả trả về `version: 1` (đã tăng 1 phiên bản).

### Module 08: Báo cáo Quản lý (Admin Reports)
- **TC-31:** Khách hàng cố tình gọi `GET /admin/reports` $\rightarrow$ Chặn bằng `403 Forbidden`.
- **TC-32:** Quản lý dùng `{{managerToken}}` gọi `GET /admin/reports` $\rightarrow$ Trả về `200 OK` gồm:
  - Tổng doanh thu thực thu (`totals.revenue`).
  - Số đơn hoàn tất, số đơn hủy và tỷ lệ hủy (`cancelRate`).
  - Danh sách Top 5 sản phẩm bán chạy nhất trong kỳ.

---

## 4. KIỂM THỬ HƯỚNG DỮ LIỆU (DATA-DRIVEN TESTING)

File dữ liệu: `apps/api/postman/test-cases-auth.json`.  
Dùng để kiểm tra hàng loạt các ca biên (Boundary / Edge cases) của dữ liệu đầu vào:

| Ca kiểm thử (Scenario) | Số điện thoại thử nghiệm | Mật khẩu | Mã HTTP kỳ vọng | Mục đích kiểm tra |
|---|---|---|:---:|---|
| SĐT sai định dạng chữ | `abc1234567` | `matkhau123` | `400 Bad Request` | Kiểm tra Regex số điện thoại di động VN |
| SĐT bàn Việt Nam | `0241234567` | `matkhau123` | `400 Bad Request` | Chặn đầu số cố định (chỉ chấp nhận đầu 03, 05, 07, 08, 09) |
| SĐT thiếu chữ số | `091234567` (9 số) | `matkhau123` | `400 Bad Request` | Bắt buộc đúng 10 chữ số |
| Mật khẩu quá ngắn | `0912345678` | `123` (3 ký tự) | `400 Bad Request` | Ràng buộc `@MinLength(6)` |
| Mật khẩu quá dài | `0912345678` | Chuỗi 84 ký tự | `400 Bad Request` | Chặn `@MaxLength(72)` do giới hạn của thuật toán bcrypt |

---

## 5. HƯỚNG DẪN THỰC THI KIỂM THỬ

### Cách 1: Chạy tự động toàn bộ kịch bản bằng Newman CLI
Mở terminal tại thư mục backend:
```bash
cd apps/api
npm run postman
```

### Cách 2: Chạy kiểm thử hướng dữ liệu (Data-Driven Test)
```bash
cd apps/api
npm run postman:data
```

### Cách 3: Chạy trên giao diện đồ họa Postman Desktop
1. Khởi động Postman, nhấn **Import** ở góc trên bên trái.
2. Chọn 2 file:
   - `apps/api/postman/BrewLite.postman_collection.json`
   - `apps/api/postman/BrewLite.local.postman_environment.json`
3. Chọn môi trường **BrewLite - Local** ở thanh công cụ góc trên bên phải.
4. Nhấn chuột phải vào thư mục collection `BrewLite API - Comprehensive Test Suite` $\rightarrow$ Chọn **Run collection** $\rightarrow$ Bấm **Run BrewLite API**.
5. Toàn bộ request sẽ tự động chạy nối tiếp nhau, xanh toàn bộ (100% Passed).
