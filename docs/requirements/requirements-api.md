# SRS phần API — BrewLite (Task 1.2, backend)

> **Mã tài liệu:** `REQ-API` · **Phụ trách:** Nguyễn Thành Long (`Longcodepro`)  
> **Phạm vi mã nguồn:** `apps/api` (NestJS, Prisma, PostgreSQL)  
> **Đường dẫn đích:** `docs/requirements/requirements-api.md`  
> **Tham chiếu:** `cac-chuc-nang-thong-nhat.md` (nguồn sự thật: mã `CN`, `UC`, `FR`, `NFR`, bảng trạng thái đơn), `docs/architecture/api-contract.md`

**Hướng dẫn đọc:** mã FR/NFR là mã chung của cả hệ thống. File này chỉ đặc tả **phần API**; phần giao diện của FR-01, FR-07, FR-02, FR-03 và NFR-04 thuộc SRS web (Tài). Tên trong `backtick` là tên đúng trong mã nguồn. Mâu thuẫn thì theo `cac-chuc-nang-thong-nhat.md`. Tiền là số nguyên VND. Lỗi trả dạng `{ "statusCode", "message", "error" }`.

---

## 1. Tổng hợp yêu cầu chức năng

| Mã | Yêu cầu (phần API) | Endpoint | Sprint | MoSCoW | UC |
|:---:|---|---|:---:|:---:|:---:|
| `FR-01` | Danh sách và chi tiết sản phẩm | `GET /products`, `GET /products/:id` | 1 | Must | UC-01 |
| `FR-04` | Đăng ký, đăng nhập, JWT, vai trò | `POST /auth/register`, `POST /auth/login` | 2 | Must | UC-04 |
| `FR-05` | Tạo đơn, Server-side Pricing | `POST /orders` | 2 | Must | UC-05 |
| `FR-06` | Thanh toán mô phỏng Thẻ/Ví | `POST /payments` | 2 | Must | UC-05 |
| `FR-07` | Lịch sử đơn của chính mình | `GET /orders/me` | 2 | Must | UC-06 |
| `FR-08` | Máy trạng thái đơn, khóa lạc quan | (trong `orders`, `payments`) | 2 | Must | UC-05 |
| `FR-09` | Chống gửi trùng `Idempotency-Key` | header của `POST /orders`, `POST /payments` | 2 | Must | UC-05 |
| `FR-10` | Tích điểm, xem số dư và lịch sử điểm | `POST /payments` (`pointsEarned`), `GET /loyalty/me` | 2 | Should | UC-20 |

Bảng giá dùng chung: Size `S` +0đ, `M` +5.000đ, `L` +10.000đ. Topping `tran-chau` 8.000đ, `kem-cheese` 10.000đ, `thach-cafe` 6.000đ.

**Quy ước mã lỗi (áp dụng cho toàn API):**

| Mã | Dùng khi |
|:---:|---|
| `400` | Dữ liệu không hợp lệ: sai định dạng, thiếu trường, trường lạ, ngoài khoảng cho phép, `productId` trong giỏ không tồn tại, `Idempotency-Key` sai định dạng, id trên đường dẫn sai kiểu |
| `401` | Thiếu, sai hoặc hết hạn token; sai SĐT hoặc mật khẩu khi đăng nhập |
| `403` | Đã đăng nhập nhưng không đủ vai trò (endpoint của nhân viên, Planned) |
| `404` | Tài nguyên không tồn tại, hoặc không thuộc về người dùng (ví dụ đơn của người khác) |
| `409` | Xung đột với trạng thái hiện tại: SĐT đã đăng ký, đơn đã `PAID` hoặc chuyển trạng thái không hợp lệ, sai `version`, món `isAvailable: false` |
| `5xx` | Lỗi hệ thống; phản hồi không lộ chi tiết nội bộ |

Thanh toán bị từ chối theo luật mô phỏng (thẻ đuôi `0000`, ví trên 500.000đ) **không phải lỗi HTTP**: hệ thống đã ghi nhận một lần thanh toán nên trả 201 kèm `status: "PAYMENT_FAILED"`.

---

## 2. Đặc tả chi tiết (MVP)

### FR-01. Danh sách và chi tiết sản phẩm (Sprint 1, Must)

- `GET /products` công khai, chỉ trả danh sách món. Tìm kiếm và lọc danh mục do client thực hiện; tab danh mục lấy từ `category` của các món, không có endpoint danh mục riêng.
- Mỗi món có: `id`, `name`, `price` (giá size S), `imageUrl`, `category` (`{ id, name }`), `isAvailable`.
- `GET /products/:id` trả một món, cùng các trường trên.
- Có dữ liệu seed để chạy ngay sau khi migrate.

**Tiêu chí chấp nhận:**
- `GET /products` trả 200 và mảng; mỗi phần tử đủ 6 trường, trong đó `category` có `id` và `name`; `price` là số nguyên không âm.
- Món hết hàng có `isAvailable: false`.
- `GET /products/:id` trả 200 với id tồn tại, 404 với id không tồn tại, 400 với id không phải số.

### FR-04. Đăng ký, đăng nhập, JWT (Sprint 2, Must)

- **Đăng ký:** `phone` (**khóa chính (Primary Key) của bảng `User`**, bắt buộc, duy nhất, số di động Việt Nam: đầu số `0` hoặc `+84`, tiếp theo là `3`, `5`, `7`, `8` hoặc `9` và 8 chữ số; server chuẩn hóa về dạng 10 chữ số bắt đầu bằng `0` trước khi lưu và so trùng), `password` (6 đến 72 ký tự), `name` (tùy chọn), `email` (tùy chọn, không duy nhất, đúng định dạng, lưu chữ thường). Mật khẩu băm `bcryptjs` salt rounds 10, không bao giờ trả `passwordHash`. `role` mặc định `CUSTOMER`; client không được gửi `role`.
- **Đăng nhập:** `phone` và `password`, thành công trả `{ "accessToken" }`. Sai SĐT hoặc sai mật khẩu đều trả cùng một thông báo 401, không lộ SĐT có tồn tại hay không.
- **JWT:** hạn 24 giờ (`JWT_EXPIRES_IN`), chứa `phone` (khóa chính, dùng làm định danh người dùng thay cho `id` riêng) và `role`. Không có giá trị mặc định cho `JWT_SECRET`; thiếu thì API không khởi động.
- `JwtAuthGuard` bảo vệ `POST /orders`, `POST /payments`, `GET /orders/me`, `GET /loyalty/me`.

**Tiêu chí chấp nhận:**
- Đăng ký hợp lệ trả 201 gồm `phone` (khóa chính), `name`, `email`, `role: "CUSTOMER"`; phản hồi không có `passwordHash`.
- Đăng ký trùng SĐT trả 409; `0912345678` và `+84912345678` được coi là cùng một SĐT.
- SĐT không phải số di động Việt Nam (ví dụ `0212345678`, `091234567`), mật khẩu ngoài 6 đến 72 ký tự, hoặc body có `role` trả 400.
- Đăng nhập đúng trả 200 kèm `accessToken`; sai SĐT hoặc sai mật khẩu trả 401 cùng nội dung.
- Gọi endpoint được bảo vệ khi thiếu, sai hoặc hết hạn token trả 401.

### FR-05. Tạo đơn, Server-side Pricing (Sprint 2, Must)

- Body: `items[]`, mỗi phần tử `productId`, `quantity` (1 đến 99), `size` (`S`/`M`/`L`), `toppings[]` (thuộc 3 topping niêm yết).
- Client **không gửi giá**: body có trường ngoài DTO (ví dụ `price`, `total`, `unitPrice`) bị 400 (`forbidNonWhitelisted`).
- Server đọc giá từ bảng `Product`: `unitPrice = price + phụ thu size + Σ giá topping`; `total = Σ quantity × unitPrice`.
- Món có `isAvailable: false` bị từ chối.
- Đơn mới: `status = PENDING`, `version = 0`, `id` dạng `ord_...`. Mỗi dòng lưu snapshot vào `OrderItem` (gồm `unitPrice` tại thời điểm đặt).

**Tiêu chí chấp nhận:**
- Hợp lệ trả 201 `{ id, status: "PENDING", total }`. Ví dụ: món giá 29.000, size `M`, topping `tran-chau`, `quantity` 2 cho `total` = 84.000.
- Trả 400 khi giỏ rỗng, `quantity` ngoài 1 đến 99, `size` hoặc topping lạ, `productId` không tồn tại, hoặc có trường lạ.
- Món `isAvailable: false` trả 409.
- Thiếu token trả 401.

### FR-06. Thanh toán mô phỏng (Sprint 2, Must)

- Body: `orderId`, `method` (`CARD` hoặc `WALLET`), `cardNumber` (13 đến 19 chữ số, bắt buộc khi `CARD`).
- `amount` lấy từ `Order.total`, client không gửi. Chỉ chủ đơn mới thanh toán được; đơn của người khác hoặc không tồn tại trả 404.
- `CARD`: từ chối nếu 4 số cuối là `0000`. `WALLET`: từ chối nếu `total` lớn hơn 500.000đ. Còn lại thành công.
- Mỗi lần thanh toán tạo một bản ghi `Payment` (`SUCCESS` hoặc `FAILED`). **Không lưu `cardNumber`**, kể cả trong log.
- Thành công: đơn sang `PAID`. Thất bại: đơn sang `PAYMENT_FAILED`, được thanh toán lại.
- Phản hồi luôn 201, kể cả khi thất bại: `{ paymentId, orderId, method, amount, status, pointsEarned, reason? }`, trong đó `status` là `PAID` hoặc `PAYMENT_FAILED`.

**Tiêu chí chấp nhận:**
- Thẻ có 4 số cuối khác `0000`, hoặc ví với đơn không quá 500.000đ, trả 201 `status: "PAID"`.
- Thẻ đuôi `0000` trả 201 `status: "PAYMENT_FAILED"` kèm `reason`; ví với đơn 500.001đ trở lên cũng vậy.
- Thanh toán lại đơn `PAYMENT_FAILED` thành công chuyển sang `PAID`.
- Đơn đã `PAID` mà thanh toán tiếp trả 409.
- Thiếu `cardNumber` khi `CARD` trả 400; thiếu token trả 401; đơn không thuộc người dùng trả 404.
- Cơ sở dữ liệu không chứa chuỗi số thẻ.

### FR-07. Lịch sử đơn (phần API, Sprint 2, Must)

- `GET /orders/me` chỉ trả đơn của người dùng trong token, mới nhất trước. Chưa có đơn thì trả `[]`.
- Mỗi đơn: `id`, `status`, `total`, `createdAt`, `items[]` gồm `productId`, `productName`, `quantity`, `size`, `toppings`, `unitPrice`.
- Màn hình theo dõi đơn polling khoảng 5 giây, nên endpoint chỉ đọc và không có tác dụng phụ.

**Tiêu chí chấp nhận:**
- Trả 200, `createdAt` giảm dần, không lẫn đơn của người khác.
- Người dùng chưa có đơn nhận `[]` với 200.
- Thiếu token trả 401.

### FR-08. Máy trạng thái đơn và khóa lạc quan (Sprint 2, Must)

| Từ | Sang | Khi nào |
|---|---|---|
| `PENDING` | `PAID` | Thanh toán thành công |
| `PENDING` | `PAYMENT_FAILED` | Thanh toán thất bại |
| `PAYMENT_FAILED` | `PAID` | Thanh toán lại thành công |

- Mọi chuyển trạng thái khác bị chặn, trả 409. Bảng đầy đủ của Sprint 3 (Planned) ở `cac-chuc-nang-thong-nhat.md` mục 5.
- Cập nhật đơn theo điều kiện `WHERE id = ? AND version = ?` rồi tăng `version` thêm 1. Không cập nhật được dòng nào thì trả 409.

**Tiêu chí chấp nhận:**
- Mỗi lần chuyển trạng thái hợp lệ làm `version` tăng đúng 1.
- Hai yêu cầu thanh toán đồng thời cho cùng một đơn: đúng một yêu cầu thành công, yêu cầu còn lại trả 409.
- `PAID` sang `PENDING` hoặc `PAID` sang `PAID` không thực hiện được.

### FR-09. Chống gửi trùng `Idempotency-Key` (Sprint 2, Must)

- Header tùy chọn cho `POST /orders` và `POST /payments`: 1 đến 128 ký tự gồm chữ, số, `_`, `-`.
- Gửi lại cùng key trả kết quả của lần đầu (vẫn 201), không tạo thêm đơn hay lần thanh toán, kể cả khi hai yêu cầu đến cùng lúc.
- Phạm vi key: theo người dùng với `POST /orders`; theo đơn với `POST /payments`.
- Không gửi header thì xử lý như bình thường. Thanh toán thử lại sau khi thất bại là lần thanh toán mới, dùng key mới.

**Tiêu chí chấp nhận:**
- Gửi `POST /orders` hai lần cùng key chỉ tạo một đơn; hai phản hồi giống nhau.
- Gửi `POST /payments` hai lần cùng key chỉ tạo một bản ghi `Payment` và cộng điểm một lần.
- Key sai định dạng trả 400.

### FR-10. Tích điểm thành viên (Sprint 2, Should)

- Khi thanh toán thành công, cộng `floor(amount / 1000)` điểm vào `User.loyaltyPoints`, trong cùng transaction với việc chuyển `PAID`. Thất bại cộng 0. Điểm chỉ tích, chưa đổi.
- `GET /loyalty/me` (cần token) trả `{ balance, history[] }`; mỗi phần tử `history` gồm `orderId`, `pointsEarned`, `createdAt`, lấy từ các lần thanh toán thành công, mới nhất trước.

**Tiêu chí chấp nhận:**
- Đơn 84.000đ cộng 84 điểm; đơn 84.999đ cộng 84 điểm; đơn 999đ cộng 0 điểm.
- Thanh toán thất bại không cộng điểm.
- `balance` bằng tổng `pointsEarned` trong `history` (ở Sprint 2, khi chưa có hủy đơn trừ điểm).
- Thiếu token trả 401.

---

## 3. Yêu cầu Planned (Sprint 3 và 4, Could)

Chỉ có tài liệu và sơ đồ, chưa hiện thực. Tiêu chí chấp nhận chi tiết viết khi vào Sprint tương ứng. Quy tắc nghiệp vụ lấy từ `cac-chuc-nang-thong-nhat.md` mục 5 và 6.

| Mã | Phần API | Sprint |
|:---:|---|:---:|
| `FR-11` | Voucher: chỉ một mã mỗi đơn; kiểm tra hạn dùng, đơn tối thiểu, tổng lượt dùng; server tính giảm giá (`FIXED`/`PERCENT`) | 3, 4 |
| `FR-12` | Hủy đơn theo bảng trạng thái, ghi lý do; đơn `PAID` được hoàn tiền mô phỏng và trừ lại điểm; từ `PREPARING` trở đi trả 409 | 3 |
| `FR-13` | Đánh giá 1 đến 5 sao kèm nhận xét, mỗi đơn `COMPLETED` một lần | 3 |
| `FR-14` | Báo cáo ngày/tuần/tháng: doanh thu thực thu, đơn hoàn tất, tỷ lệ hủy, Top 5 món (`MANAGER`) | 4 |
| `FR-15` | Kho: nhập kho có lưu vết, trừ kho cùng transaction với `PAID`, hoàn kho khi hủy | 4 |
| `FR-16` | Công thức pha chế theo món, size, topping | 4 |
| `FR-17` | Cảnh báo khi nguyên liệu chạm ngưỡng tối thiểu | 4 |
| `FR-18` | CRUD danh mục, món, topping, phụ thu size (`MANAGER`) | 4 |
| `FR-19` | Tạo tài khoản nhân viên, gán vai trò, khóa/mở khóa (`MANAGER`) | 4 |
| `FR-20` | Danh sách đơn `PAID` cho Barista; chuyển `PREPARING`, `READY` (`BARISTA`) | 3 |
| `FR-21` | Sinh `pickupCode` 6 số khi `READY`, duy nhất trong các đơn đang `READY`; `CASHIER` nhập đúng mã mới chuyển `COMPLETED` | 3 |

Endpoint dành cho vai trò nhân viên trả 403 khi sai vai trò.

---

## 4. Yêu cầu phi chức năng (phần API)

| Mã | Nhóm | Nội dung và tiêu chí kiểm chứng |
|:---:|---|---|
| `NFR-01` | Bảo mật | Không tin giá từ client; mật khẩu băm `bcryptjs`; JWT 24 giờ; `JWT_SECRET` không có giá trị mặc định; không lưu số thẻ thô; không commit secret (chỉ có `.env.example`). Kiểm chứng bằng test của FR-04, FR-05, FR-06. |
| `NFR-02` | Độ tin cậy và sẵn sàng | Không đặt ngưỡng tốc độ vì phụ thuộc hạ tầng và mạng. Thay bằng: (1) production qua HTTPS và `GET /health` trả 200 `{ status: "ok", timestamp }`; (2) kết quả đúng khi gửi trùng hoặc đồng thời (xem FR-08, FR-09); (3) mọi lỗi theo đúng bảng mã lỗi ở mục 1, lỗi 5xx không lộ stack hay chi tiết nội bộ; (4) log không chứa `cardNumber`, mật khẩu hay token; (5) môi trường tái tạo được từ đầu bằng Docker Compose, migration và seed. Lần gọi đầu trên gói miễn phí có thể chậm: làm nóng bằng `/health` trước khi demo. |
| `NFR-03` | Chất lượng và bảo trì | Mọi PR qua CI (Install, Lint, Test, Build). Có Swagger tại `/docs`. Migration có phiên bản và seed tái tạo được CSDL. Có unit test cho định giá, máy trạng thái, tích điểm và integration test cho `POST /orders`, `POST /payments`. |

`NFR-04` (khả dụng) thuộc phần giao diện, không nằm trong file này.

---

## 5. Gợi ý ca kiểm thử (cho Task 4, Task 5)

1. **Định giá:** món 29.000, size `M`, `tran-chau`, `quantity` 2 cho `total` = 84.000; body có `total` bị 400.
2. **Thanh toán:** thẻ đuôi `0000` thất bại; ví đơn 500.000đ thành công, 500.001đ thất bại; thanh toán đơn `PAID` trả 409.
3. **Idempotency:** hai `POST /payments` cùng key cho một `Payment` và điểm cộng một lần.
4. **Đồng thời:** hai thanh toán song song cùng đơn cho đúng một thành công, một 409.
5. **Điểm:** 84.000đ cho 84 điểm; 84.999đ cho 84 điểm; 999đ cho 0 điểm.
6. **Phân quyền dữ liệu:** `GET /orders/me` không trả đơn của người khác; thanh toán đơn của người khác trả 404.

---

## 6. Thay đổi so với `docs/architecture/api-contract.md` hiện tại

`api-contract.md` là hợp đồng chung với Tài nên phải cập nhật và báo Tài trước khi sửa:

1. Định danh bằng **`phone`** (số di động Việt Nam, chuẩn hóa về 10 chữ số, **là khóa chính của bảng `User`, thay cho `id` riêng**) thay cho `email` ở `POST /auth/register`, `POST /auth/login`; thêm `role` vào phản hồi đăng ký và vào JWT. `email` thành tùy chọn, không duy nhất.
2. `GET /products` thêm `category` (`{ id, name }`) và `isAvailable`; thêm `GET /products/:id`.
3. `POST /orders` từ chối món `isAvailable: false` bằng 409.
4. Thêm endpoint mới `GET /loyalty/me`.
5. JWT hạn 24 giờ (hợp đồng cũ ghi mặc định 1 ngày).
