# Đặc Tả Yêu Cầu Kỹ Thuật Phần Backend — BrewLite (Assignment 2)

> **Mã tài liệu:** `REQ-API` (Liên kết: Issue #36 `[D1.2b]`)  
> **Người thực hiện:** Nguyễn Thành Long (`Longcodepro`) — Backend, Scrum Master, DevOps, Kiến trúc  
> **Phạm vi mã nguồn:** `apps/api` (NestJS 12, Prisma 7, PostgreSQL 16, TypeScript ESM)  
> **Tài liệu tham chiếu:** [`docs/architecture/api-contract.md`]
---

## 1. Yêu Cầu Chức Năng Backend (Functional Requirements - FR)

Tất cả các yêu cầu chức năng bên dưới được ánh xạ với mã FR chung của toàn hệ thống và phân loại mức độ ưu tiên theo chuẩn **MoSCoW** (Must have · Should have · Could have · Won't have).

---

### [FR-04] Xác Thực Và Phân Quyền Người Dùng (User Authentication & JWT)
- **Độ ưu tiên:** **MUST HAVE** | **Sprint:** 2 | **Endpoint:** `POST /auth/register`, `POST /auth/login`
- **Mô tả nghiệp vụ:** Cung cấp cơ chế đăng ký tài khoản mới và đăng nhập an toàn để nhận mã xác thực (JSON Web Token), phục vụ việc gắn quyền sở hữu cho các đơn hàng và lượt thanh toán.
- **Quy tắc xử lý:**
  1. **Đăng ký (`POST /auth/register`):**
     - Email đầu vào được tự động chuẩn hóa về chữ thường (lowercase) và loại bỏ khoảng trắng thừa.
     - Mật khẩu phải có độ dài từ 6 đến 72 ký tự; được băm tự động bằng `bcryptjs` với salt rounds = 10 trước khi lưu vào cơ sở dữ liệu (`passwordHash`).
     - Tên người dùng (`name`): Tùy chọn (optional).
     - Kiểm tra trùng lặp email: Nếu email đã tồn tại trong bảng `User`, trả về mã lỗi HTTP `409 Conflict`.
     - Phản hồi thành công: HTTP `201 Created` kèm thông tin người dùng (`id`, `email`, `name`), tuyệt đối không trả `passwordHash`.
  2. **Đăng nhập (`POST /auth/login`):**
     - Xác thực email và so khớp mật khẩu bằng `bcrypt.compare`.
     - Chống dò quét thông tin người dùng (User Enumeration): Nếu sai email hoặc sai mật khẩu, trả về cùng một mã HTTP `401 Unauthorized` với thông điệp chung: `"Invalid email or password"`.
     - Phản hồi thành công: HTTP `200 OK` chứa chuỗi mã hóa `accessToken`.
     - Token được cấu hình thời hạn hiệu lực qua biến môi trường `JWT_EXPIRES_IN` (mặc định 24 giờ).
  3. **Bảo vệ Endpoint:**
     - Các API nghiệp vụ phía sau (`POST /orders`, `POST /payments`, `GET /orders/me`) được bảo vệ bằng `JwtAuthGuard`. Request thiếu hoặc sai header `Authorization: Bearer <accessToken>` sẽ bị từ chối với mã HTTP `401 Unauthorized`.
- **Tiêu chí chấp nhận (Acceptance Criteria):**
  - [x] Đăng ký thành công trả về 201 kèm ID và email.
  - [x] Đăng ký trùng email trả về 409.
  - [x] Đăng nhập đúng trả về 200 kèm JWT accessToken hợp lệ.
  - [x] Đăng nhập sai mật khẩu hoặc sai email trả về 401.
  - [x] Các endpoint được bảo vệ chặn đứng request không có Bearer token hợp lệ.

---

### [FR-05] Tiếp Nhận Và Định Giá Đơn Hàng (Order Creation & Server-side Pricing)
- **Độ ưu tiên:** **MUST HAVE** | **Sprint:** 2 | **Endpoint:** `POST /orders`
- **Mô tả nghiệp vụ:** Tiếp nhận danh sách món ăn từ giỏ hàng của khách hàng đã đăng nhập, kiểm tra tính hợp lệ và thực hiện tính toán tổng tiền độc quyền tại Server.
- **Quy tắc định giá và xử lý:**
  1. **Server-side Pricing độc quyền:**
     - Client tuyệt đối **không gửi giá tiền** lên backend. Nếu body chứa trường giá (`price`, `total`, `unitPrice`...) hoặc bất kỳ trường lạ nào ngoài DTO quy định, hệ thống lập tức từ chối với mã HTTP `400 Bad Request` (`forbidNonWhitelisted: true`).
     - Backend đọc giá gốc của từng sản phẩm từ bảng `Product` trong CSDL theo `productId`.
     - Công thức tính đơn giá 1 ly (`unitPrice`):
       $$\text{unitPrice} = \text{basePrice} + \text{sizeSurcharge} + \sum \text{toppingPrice}$$
     - Bảng phụ thu kích cỡ (Size):
       - Size `S`: +0 đ (giá gốc niêm yết).
       - Size `M`: +5.000 đ.
       - Size `L`: +10.000 đ.
     - Bảng giá món thêm (Topping):
       - `tran-chau`: 8.000 đ.
       - `kem-cheese`: 10.000 đ.
       - `thach-cafe`: 6.000 đ.
     - Tổng tiền đơn hàng (`Order.total`):
       $$\text{total} = \sum_{i=1}^{n} (\text{quantity}_i \times \text{unitPrice}_i)$$
  2. **Trạng thái và Dữ liệu khởi tạo:**
     - Đơn hàng được tạo mới luôn có trạng thái ban đầu là `PENDING`.
     - Khởi tạo giá trị khóa lạc quan: `version = 0`.
     - Mã đơn hàng được sinh tự động định dạng duy nhất (ví dụ: tiền tố `ord_`).
     - Lưu chi tiết snapshot từng dòng sản phẩm vào bảng `OrderItem` (gồm `productId`, `quantity`, `size`, `toppings`, và `unitPrice` đã tính).
- **Tiêu chí chấp nhận (Acceptance Criteria):**
  - [x] Tạo đơn thành công trả về HTTP `201 Created` gồm `id`, `status: "PENDING"`, và `total` chính xác từng đồng.
  - [x] Trả về 400 khi giỏ rỗng, số lượng ngoài khoảng 1–99, hoặc mã sản phẩm không tồn tại.
  - [x] Trả về 400 khi client gửi size lạ hoặc topping không nằm trong bảng giá quy định.
  - [x] Trả về 401 khi chưa gửi kèm Authorization Bearer token.

---

### [FR-06] Xử Lý Giao Dịch Thanh Toán Mô Phỏng (Simulated Payment Processing)
- **Độ ưu tiên:** **MUST HAVE** | **Sprint:** 2 | **Endpoint:** `POST /payments`
- **Mô tả nghiệp vụ:** Xử lý yêu cầu thanh toán cho đơn hàng đã tạo bằng 2 phương thức mô phỏng: Thẻ ngân hàng (`CARD`) hoặc Ví điện tử (`WALLET`).
- **Quy tắc xử lý:**
  1. **Số tiền giao dịch (`amount`):**
     - Lấy trực tiếp từ trường `Order.total` trong CSDL, client không được tự ý gửi số tiền.
     - Chỉ cho phép thanh toán cho đơn hàng thuộc sở hữu của chính người dùng đang đăng nhập (`Order.userId == req.user.id`), nếu không khớp trả về HTTP `404 Not Found`.
  2. **Quy tắc mô phỏng nghiệp vụ thanh toán:**
     - **Thanh toán bằng Thẻ (`CARD`):** Yêu cầu gửi trường `cardNumber` (chuỗi số 13–19 chữ số).
       - *Kịch bản thất bại mô phỏng:* Nếu thẻ có 4 chữ số cuối là `0000` $\rightarrow$ Từ chối giao dịch, ghi nhận lý do: `"Thẻ bị từ chối"`.
       - *Kịch bản thành công:* Mọi số thẻ hợp lệ khác có 4 số cuối khác `0000` đều thanh toán thành công.
       - *Bảo mật:* Tuyệt đối **không lưu chuỗi `cardNumber`** vào cơ sở dữ liệu.
     - **Thanh toán bằng Ví (`WALLET`):** Không yêu cầu nhập số thẻ.
       - *Kịch bản thất bại mô phỏng:* Nếu tổng giá trị đơn hàng `> 500.000 đ` $\rightarrow$ Từ chối giao dịch do vượt hạn mức số dư ví.
       - *Kịch bản thành công:* Các đơn hàng $\le 500.000$ đ thanh toán thành công.
  3. **Lưu vết giao dịch (`Payment` table):**
     - Mỗi lượt bấm thanh toán tạo ra một bản ghi trong bảng `Payment` với `status: SUCCESS` hoặc `status: FAILED`.
     - Nếu thanh toán thành công: Đơn hàng chuyển trạng thái sang `PAID`.
     - Nếu thanh toán thất bại: Đơn hàng chuyển trạng thái sang `PAYMENT_FAILED`. Hệ thống cho phép người dùng thực hiện thanh toán lại với phương thức khác trên cùng một `orderId`.
- **Tiêu chí chấp nhận (Acceptance Criteria):**
  - [x] Trả về HTTP `201 Created` kèm `status: "PAID"` khi thanh toán hợp lệ.
  - [x] Thẻ có đuôi `0000` trả về `201 Created` kèm `status: "PAYMENT_FAILED"` và lý do từ chối.
  - [x] Ví điện tử từ chối các đơn hàng trên 500.000 đ.
  - [x] Đơn thất bại có thể gọi lại API để thanh toán lại thành công.
  - [x] Trả về 409 Conflict nếu cố thanh toán một đơn hàng đã ở trạng thái `PAID`.

---

### [FR-08] Quản Lý Vòng Đời Trạng Thái Đơn Hàng (Order State Machine & Optimistic Locking)
- **Độ ưu tiên:** **MUST HAVE** | **Sprint:** 2 | **Module:** `orders`, `payments`
- **Mô tả nghiệp vụ:** Đảm bảo tính toàn vẹn trạng thái đơn hàng theo máy trạng thái xác định (State Machine) và ngăn ngừa xung đột dữ liệu đồng thời bằng khóa lạc quan (Optimistic Locking).
- **Quy tắc chuyển trạng thái (State Transitions):**
  ```
  [ Khởi tạo ] ──> PENDING ──┬──(Thanh toán thành công)──> PAID [Cuối]
                             │
                             └──(Thanh toán thất bại)────> PAYMENT_FAILED ──(Thanh toán lại thành công)──> PAID [Cuối]
  ```
  - `PENDING` $\rightarrow$ `PAID`: Khi thanh toán thành công lần đầu.
  - `PENDING` $\rightarrow$ `PAYMENT_FAILED`: Khi thanh toán thất bại lần đầu.
  - `PAYMENT_FAILED` $\rightarrow$ `PAID`: Khi thanh toán lại thành công.
  - Bất kỳ nỗ lực chuyển trạng thái nào ngoài 3 luồng trên (ví dụ: `PAID` $\rightarrow$ `PENDING`, hoặc thanh toán thêm khi đã `PAID`) đều bị chặn và trả về lỗi HTTP `409 Conflict`.
- **Khóa lạc quan (Optimistic Locking) với cột `version`:**
  - Bảng `Order` chứa trường `version: Int @default(0)`.
  - Khi thực hiện cập nhật đơn hàng (đặc biệt là chuyển trạng thái qua thanh toán), câu lệnh UPDATE trong Prisma kiểm tra điều kiện:
    ```sql
    UPDATE "Order" SET "status" = $newStatus, "version" = "version" + 1 
    WHERE "id" = $orderId AND "version" = $expectedVersion;
    ```
  - Nếu số bản ghi cập nhật bằng 0 (do một tiến trình khác đã cập nhật trước và tăng `version`), hệ thống trả về mã lỗi HTTP `409 Conflict`, ngăn chặn triệt để hiện tượng ghi đè mất dữ liệu (Lost Update).
- **Tiêu chí chấp nhận (Acceptance Criteria):**
  - [x] Chuyển đổi trạng thái đơn hàng tuân thủ nghiêm ngặt State Machine.
  - [x] Không thể thanh toán lại đơn hàng đã `PAID` (409 Conflict).
  - [x] Kiểm thử 2 request đồng thời cập nhật trạng thái cùng 1 đơn hàng: 1 request thành công, 1 request trả về 409 Conflict do sai version.

---

### [FR-09] Cơ Chế Chống Gửi Trùng Yêu Cầu (Idempotency Control)
- **Độ ưu tiên:** **SHOULD HAVE** | **Sprint:** 2 | **Header:** `Idempotency-Key`
- **Mô tả nghiệp vụ:** Đảm bảo khi người dùng hoặc mạng gửi lại cùng một yêu cầu tạo đơn hoặc thanh toán (do lag mạng, timeout, hoặc double-click), hệ thống chỉ thực hiện nghiệp vụ một lần duy nhất và trả về đúng kết quả ban đầu.
- **Quy tắc kỹ thuật:**
  1. Hỗ trợ header tùy chọn `Idempotency-Key` (chuỗi từ 1 đến 128 ký tự gồm chữ cái, chữ số, dấu gạch dưới `_` và gạch ngang `-`).
  2. **Áp dụng cho `POST /orders`:**
     - Khóa duy nhất theo người dùng: Ràng buộc CSDL `@@unique([userId, idempotencyKey])`.
     - Nếu gửi lại cùng key: Hệ thống không tạo đơn mới mà trả lại thông tin đơn hàng đã tạo trước đó với mã HTTP `201 Created`.
  3. **Áp dụng cho `POST /payments`:**
     - Khóa duy nhất theo đơn hàng: Ràng buộc CSDL `@@unique([orderId, idempotencyKey])`.
     - Nếu gửi lại cùng key: Hệ thống không gọi lại cổng thanh toán hay trừ kho lần hai, mà trả về nguyên vẹn bản ghi `Payment` cũ (mã HTTP `201 Created`).
  4. Header sai định dạng trả về mã HTTP `400 Bad Request`. Nếu không gửi header `Idempotency-Key`, hệ thống thực hiện xử lý thông thường.
- **Tiêu chí chấp nhận (Acceptance Criteria):**
  - [x] Gửi 2 request tạo đơn cùng `Idempotency-Key` chỉ sinh ra 1 đơn hàng duy nhất trong DB; cả 2 request đều nhận phản hồi 201 với cùng dữ liệu.
  - [x] Gửi 2 request thanh toán cùng `Idempotency-Key` chỉ lưu 1 bản ghi Payment và không bị cộng trùng điểm loyalty.

---

### [FR-10] Tích Lũy Điểm Thưởng Khách Hàng (Loyalty Points Accumulation)
- **Độ ưu tiên:** **SHOULD HAVE** | **Sprint:** 2 | **Module:** `payments`
- **Mô tả nghiệp vụ:** Tự động tích lũy điểm thưởng thành viên vào hồ sơ tài khoản người dùng ngay sau khi thanh toán thành công, khuyến khích khách hàng quay lại sử dụng dịch vụ.
- **Quy tắc tích điểm:**
  - Tỷ lệ tích điểm: **1 điểm cho mỗi 1.000 đ** giá trị thanh toán thực tế của đơn hàng.
  - Công thức tính:
    $$\text{pointsEarned} = \left\lfloor \frac{\text{Order.total}}{1000} \right\rfloor$$
  - Điểm thưởng chỉ được cộng khi thanh toán có trạng thái `SUCCESS` (đơn chuyển `PAID`). Nếu thanh toán `FAILED`, số điểm tích lũy bằng 0 (`pointsEarned = 0`).
  - Điểm được cộng dồn vào trường `User.loyaltyPoints` ngay trong cùng transaction hoàn tất thanh toán.
  - Điểm thưởng nhận được của lượt thanh toán được lưu vết vào trường `Payment.pointsEarned` để phục vụ trả về kết quả nhất quán khi gửi lại request có `Idempotency-Key`.
- **Tiêu chí chấp nhận (Acceptance Criteria):**
  - [x] Đơn hàng 84.000 đ thanh toán thành công tích đúng 84 điểm vào tài khoản khách hàng.
  - [x] Đơn hàng thanh toán thất bại tích 0 điểm; số dư điểm của user giữ nguyên.
  - [x] Phản hồi `POST /payments` chứa trường `pointsEarned` chính xác.

---

### [FR-11] Quản Lý Và Áp Dụng Mã Khuyến Mãi (Promotion / Voucher)
- **Độ ưu tiên:** **COULD HAVE** | **Phạm vi:** Mở rộng sau MVP | **Module:** `promotions`
- **Mô tả nghiệp vụ:** Cho phép khách hàng nhập mã ưu đãi giảm giá (theo số tiền cố định hoặc theo phần trăm) vào đơn hàng trước khi thanh toán.
- **Quy tắc:**
  - Kiểm tra các điều kiện: Mã còn hiệu lực (ngày bắt đầu, ngày hết hạn), tổng giá trị đơn hàng đạt mức tối thiểu (`minOrderValue`), và mã chưa vượt quá số lượt dùng tối đa (`usageLimit`).
  - Giảm trừ trực tiếp vào `Order.total` trước khi chuyển sang bước thanh toán.

---

### [FR-12] Hủy Đơn Hàng Và Ghi Nhận Lý Do (Order Cancellation)
- **Độ ưu tiên:** **COULD HAVE** | **Phạm vi:** Mở rộng sau MVP | **Module:** `orders`
- **Mô tả nghiệp vụ:** Cho phép khách hàng hoặc nhân viên quầy thực hiện hủy đơn hàng khi đơn chưa bước vào giai đoạn pha chế.
- **Quy tắc:**
  - Chỉ cho phép hủy khi đơn ở trạng thái `PENDING` hoặc `PAID` (chưa chuyển sang `PREPARING`).
  - Đơn chuyển sang trạng thái `CANCELLED`, lưu thông tin người hủy (`cancelledBy`) và ghi chú lý do hủy (`cancelReason`).

---

### [FR-13] Đánh Giá Và Phản Hồi Chất Lượng (Customer Feedback)
- **Độ ưu tiên:** **COULD HAVE** | **Phạm vi:** Mở rộng sau MVP | **Module:** `feedbacks`
- **Mô tả nghiệp vụ:** Khách hàng có thể gửi đánh giá số sao (từ 1 đến 5 sao) kèm nội dung phản hồi sau khi đã nhận đồ uống hoàn tất.
- **Quy tắc:**
  - Chỉ những đơn hàng đã hoàn tất mới được phép gửi đánh giá; mỗi đơn hàng chỉ được gửi đánh giá 1 lần duy nhất.

---

### [FR-14] Báo Cáo Thống Kê Doanh Thu Và Sản Lượng (Sales Reporting)
- **Độ ưu tiên:** **COULD HAVE** | **Phạm vi:** Mở rộng sau MVP | **Module:** `reports`
- **Mô tả nghiệp vụ:** Cung cấp API tổng hợp báo cáo kinh doanh cho tài khoản có vai trò Quản lý (`ADMIN`).
- **Quy tắc:**
  - Thống kê tổng doanh thu thực thu, tổng số đơn thành công, tỷ lệ hủy đơn theo ngày, tuần, tháng.
  - Xếp hạng danh sách các món cà phê và topping bán chạy nhất.

---

## 2. Yêu Cầu Phi Chức Năng Backend (Non-Functional Requirements - NFR)

---

### [NFR-02] An Toàn Và Bảo Mật Thông Tin (Security & Privacy)
- **Độ ưu tiên:** **MUST HAVE** | **Mục tiêu:** Đảm bảo an toàn thông tin người dùng, tính toàn vẹn của giao dịch và phòng chống các lỗ hổng bảo mật phổ biến.
- **Chỉ tiêu kiểm chứng & Giải pháp kỹ thuật:**
  1. **Bảo mật mật khẩu:** 100% mật khẩu người dùng được băm một chiều bằng thuật toán `bcryptjs` với hệ số salt round = 10. Tuyệt đối không lưu trữ, ghi log hoặc trả về chuỗi mật khẩu thô trong bất kỳ trường hợp nào.
  2. **Xác thực Không trạng thái (Stateless Authentication):** Sử dụng chuẩn JSON Web Token (JWT) có chữ ký HMAC SHA-256 (`HS256`). Khóa bí mật `JWT_SECRET` bắt buộc phải được truyền qua biến môi trường; ứng dụng từ chối khởi động nếu thiếu biến này (không đặt giá trị mặc định fallback vào code).
  3. **Lọc và Kiểm tra tính hợp lệ dữ liệu (Input Validation):** Áp dụng toàn cục `ValidationPipe` với cấu hình:
     ```typescript
     new ValidationPipe({
       whitelist: true,              // Loại bỏ hoàn toàn các trường không khai báo trong DTO
       forbidNonWhitelisted: true,  // Báo lỗi 400 ngay khi nhận payload có trường lạ
       transform: true,              // Tự động ép kiểu dữ liệu theo DTO
     })
     ```
     Ngăn chặn triệt để các kiểu tấn công Mass Assignment và Parameter Tampering.
  4. **Bảo vệ dữ liệu tài chính:** Hệ thống **không lưu trữ số thẻ ngân hàng thô** (`cardNumber`) vào bất kỳ bảng nào trong cơ sở dữ liệu. Số thẻ chỉ được tiếp nhận trong bộ nhớ tạm (in-memory) tại thời điểm gọi API thanh toán để kiểm tra quy tắc 4 số cuối mô phỏng rồi giải phóng ngay lập tức.
  5. **Chống tấn công dò quét (User Enumeration Defense):** Các phản hồi liên quan đến xác thực thất bại dùng chung thông báo lỗi chuẩn hóa và mã HTTP 401, không để lộ thông tin email có tồn tại trong hệ thống hay không.

---

### [NFR-04] Khả Năng Triển Khai Và Tự Động Hóa Vận Hành (Deployability & DevOps)
- **Độ ưu tiên:** **MUST HAVE** | **Mục tiêu:** Hệ thống dễ dàng đóng gói, di chuyển môi trường và tích hợp kiểm thử tự động trong quy trình phát triển.
- **Chỉ tiêu kiểm chứng & Giải pháp kỹ thuật:**
  1. **Container hóa bằng Docker:**
     - Mã nguồn `apps/api` đi kèm file `Dockerfile` tối ưu nhiều tầng (Multi-stage build) trên nền ảnh `node:20-alpine`, tạo ra container kích thước nhỏ (< 250MB) và bảo mật.
     - Toàn bộ ngăn xếp (PostgreSQL 16, NestJS API cổng 4003, Next.js Web cổng 4004) sẵn sàng khởi động đồng bộ chỉ qua một lệnh: `docker compose up -d`.
  2. **Di chuyển CSDL tự động (Automated Database Migration):**
     - Quá trình deploy sử dụng lệnh `npx prisma migrate deploy` để áp dụng các file SQL migration có sẵn mà không cần terminal tương tác (non-interactive/no TTY).
     - Khởi tạo dữ liệu ban đầu cho menu sản phẩm qua kịch bản `prisma/seed.ts` một cách tự động và lặp lại được (idempotent).
  3. **Tự động hóa CI/CD (Continuous Integration / Continuous Delivery):**
     - 100% các Pull Request tạo vào nhánh `main` phải vượt qua quy trình kiểm tra tự động trên GitHub Actions gồm 4 công đoạn bắt buộc:
       $$\text{Install Dependencies} \longrightarrow \text{Lint Code (oxlint)} \longrightarrow \text{Unit Tests (Vitest)} \longrightarrow \text{TypeScript Build}$$
     - Khi merge vào `main`: Workflow CD tự động đóng gói image đẩy lên GitHub Packages (GHCR) và thực hiện smoke test kiểm tra tính sẵn sàng của ứng dụng.
  4. **Giám sát Sức khỏe Dịch vụ (Health Check):**
     - Cung cấp endpoint kiểm tra trạng thái hoạt động `GET /` hoặc `GET /health` phản hồi mã HTTP `200 OK` với thời gian trễ dưới 200ms để phục vụ bộ theo dõi sức khỏe của Docker Compose và Cloud Orchestration.

---

## 3. Danh Mục Tính Năng Loại Trừ (Won't Have - Out of Scope) Và Lý Do Giải Trình

Để đảm bảo tính khả thi và chất lượng kỹ thuật cao nhất trong khung thời gian 2 Sprint của nhóm phát triển 2 người, các tính năng sau được **chính thức xác nhận loại trừ** khỏi phạm vi thực hiện của dự án, kèm lý do cụ thể:

| STT | Tính năng loại trừ (Won't Have) | Lý do kỹ thuật và nghiệp vụ giải trình |
|:---:|---|---|
| **1** | **Ví tiền hoàn tiền nội bộ (Wallet Refund) & Rút tiền ngân hàng** | Đồ án thiết kế thanh toán ở mức mô phỏng nghiệp vụ (*Simulated Payment*). Việc xây dựng ví điện tử nạp/rút tiền thật đòi hỏi quy trình đối soát giao dịch liên ngân hàng (reconciliation), xử lý tranh chấp bồi hoàn và tuân thủ các quy chuẩn bảo mật tài chính khắt khe (PCI-DSS), vượt quá giới hạn thời gian và mục tiêu học phần môn học. |
| **2** | **Quản lý ca làm việc & Chấm công nhân sự** | Trọng tâm cốt lõi của BrewLite là tối ưu hóa trải nghiệm khách hàng trong luồng đặt hàng và thanh toán nhanh không tiền mặt. Quản lý chấm công là nghiệp vụ quản trị nội bộ (ERP/HRM) riêng biệt, không tác động đến luồng giá trị chính của MVP. |
| **3** | **Quản lý định lượng kho nguyên liệu chi tiết (từng gam cà phê, ml sữa, siro)** | Việc theo dõi trừ kho đến từng gam nguyên liệu đòi hỏi nghiệp vụ kiểm kê hao hụt phức tạp. Đồ án áp dụng giải pháp tinh gọn khả thi hơn: Quản lý định mức tồn kho theo số lượng ly thành phẩm bán ra trong ngày (`dailyQuota`) của từng món. |
| **4** | **Hạ tầng SMS Brandname / Gửi mã OTP trả phí** | Đòi hỏi chi phí đăng ký với các nhà mạng viễn thông và duy trì kinh phí duy trì đầu số. Nhóm thay thế hoàn toàn bằng phương thức xác thực JWT qua tài khoản mật khẩu và đối chiếu nhận đơn tại quầy thông qua mã đơn hàng 6 chữ số trực tiếp trên màn hình ứng dụng. |
