# API Contract

Base URL: `http://localhost:4003`. Mọi thay đổi phải báo người kia trước khi sửa.

## GET /health

Không cần token, dùng để làm nóng API và kiểm tra tình trạng trước khi demo/triển khai.

200 OK

```json
{ "status": "ok", "timestamp": "2026-10-26T03:40:26.834Z" }
```

## GET /products

200 OK

```json
[
  {
    "id": 1,
    "name": "Cà phê sữa",
    "price": 29000,
    "imageUrl": "https://example.com/ca-phe-sua.jpg",
    "category": { "id": 1, "name": "Cà phê" },
    "isAvailable": true
  }
]
```

`price`: số nguyên, đơn vị VND (size S). Size/topping thêm ở Task 4. Tìm kiếm và lọc theo `category` do client tự xử lý trên danh sách trả về, không có endpoint danh mục riêng.

## GET /products/:id

200 OK, cùng cấu trúc một phần tử của `GET /products`:

```json
{
  "id": 1,
  "name": "Cà phê sữa",
  "price": 29000,
  "imageUrl": "https://example.com/ca-phe-sua.jpg",
  "category": { "id": 1, "name": "Cà phê" },
  "isAvailable": true
}
```

404 khi `id` không tồn tại. 400 khi `id` không phải số.

## POST /auth/register

Request

```json
{ "phone": "0912345678", "password": "matkhau123", "name": "Long", "email": "long@test.com" }
```

`phone` là **khóa chính của `User`**: số di động Việt Nam (đầu số `0` hoặc `+84`, tiếp theo `3`/`5`/`7`/`8`/`9` và 8 chữ số), server chuẩn hóa về dạng 10 chữ số bắt đầu bằng `0` trước khi lưu và so trùng. `password` 6–72 ký tự. `name` không bắt buộc. `email` tùy chọn, không duy nhất, chuẩn hóa chữ thường. Client không được gửi `role`.

201 Created

```json
{ "phone": "0912345678", "name": "Long", "email": "long@test.com", "role": "CUSTOMER" }
```

400 khi `phone` không hợp lệ, mật khẩu ngoài 6–72 ký tự, hoặc body có `role`. 409 khi `phone` đã đăng ký (`0912345678` và `+84912345678` tính là cùng một số).

## POST /auth/login

Request

```json
{ "phone": "0912345678", "password": "matkhau123" }
```

200 OK

```json
{ "accessToken": "eyJhbGciOi..." }
```

401 khi sai SĐT hoặc sai mật khẩu (cùng một thông báo cho cả hai trường hợp, không lộ SĐT có tồn tại hay không). JWT chứa `phone` (khóa chính, dùng làm định danh người dùng) và `role`, hạn 24 giờ (`JWT_EXPIRES_IN`); không có giá trị mặc định cho `JWT_SECRET`, thiếu biến này thì API không khởi động. Gửi token lên bằng header `Authorization: Bearer <accessToken>`.

## POST /orders

Cần header `Authorization: Bearer <accessToken>`, thiếu hoặc sai token trả 401. Đơn được gắn với người dùng trong token.

Request

```json
{
  "items": [
    { "productId": 1, "quantity": 2, "size": "M", "toppings": ["tran-chau"] }
  ]
}
```

201 Created

```json
{ "id": "ord_123", "status": "PENDING", "total": 84000 }
```

`total` do server tính: Σ `quantity × (giá sản phẩm + phụ thu size + giá topping)`. Phụ thu size: S +0, M +5.000, L +10.000. Topping: `tran-chau` 8.000, `kem-cheese` 10.000, `thach-cafe` 6.000. Ví dụ trên: 2 × (29.000 + 5.000 + 8.000) = 84.000. Client không gửi giá; trường lạ bị từ chối (400).

400 khi dữ liệu không hợp lệ (giỏ rỗng, `quantity` ngoài 1–99, `size`/`toppings` lạ, `productId` không tồn tại):

```json
{ "statusCode": 400, "message": ["items must not be empty"], "error": "Bad Request" }
```

409 khi món trong giỏ có `isAvailable: false`.

Trạng thái đơn: `PENDING` → `PAID` | `PAYMENT_FAILED`. Đơn `PAYMENT_FAILED` được thanh toán lại (→ `PAID`). Từ Sprint 3 đơn `PAID` còn đi tiếp qua `PREPARING`, `READY`, `COMPLETED` hoặc bị `CANCELLED`: xem mục **Vòng đời đơn hàng và phân quyền (từ Sprint 3)**.

## POST /payments

Cần header `Authorization: Bearer <accessToken>`. Số tiền lấy từ đơn, client không gửi.

Request

```json
{ "orderId": "ord_123", "method": "CARD", "cardNumber": "4111111111111111" }
```

`method`: `WALLET` hoặc `CARD`. `cardNumber` (13–19 chữ số) bắt buộc khi `CARD`, không được lưu lại. Mô phỏng: thẻ có 4 số cuối `0000` bị từ chối; Ví từ chối khi đơn trên 500.000đ.

201 Created (cả khi thanh toán thất bại, xem `status`)

```json
{ "paymentId": 1, "orderId": "ord_123", "method": "CARD", "amount": 84000, "status": "PAID", "pointsEarned": 84 }
```

`pointsEarned`: điểm tích lũy được, 1 điểm / 1.000đ (làm tròn xuống), chỉ khi thành công. Thất bại: `"status": "PAYMENT_FAILED"`, `"pointsEarned": 0` kèm `"reason": "Thẻ bị từ chối"`. Gọi lại với cùng `orderId` để thử lại.

400 dữ liệu sai. 401 thiếu token. 404 đơn không tồn tại hoặc không phải của người dùng. 409 đơn đã `PAID`, hoặc đơn vừa bị một yêu cầu khác cập nhật (khoá lạc quan theo `version`): đọc lại trạng thái đơn rồi thử lại nếu cần.

## GET /orders/me

Cần header `Authorization: Bearer <accessToken>`. Trả lịch sử đơn của người dùng đang đăng nhập, đơn mới nhất trước. Chưa có đơn thì trả `[]`.

200 OK

```json
[
  {
    "id": "ord_123",
    "status": "PAID",
    "total": 84000,
    "createdAt": "2026-10-26T03:40:26.834Z",
    "items": [
      {
        "productId": 1,
        "productName": "Cà phê sữa",
        "quantity": 2,
        "size": "M",
        "toppings": ["tran-chau"],
        "unitPrice": 42000
      }
    ]
  }
]
```

401 thiếu hoặc sai token.

## GET /loyalty/me

Cần header `Authorization: Bearer <accessToken>`. Trả số dư và lịch sử điểm tích lũy của người dùng đang đăng nhập.

200 OK

```json
{
  "balance": 84,
  "history": [
    { "orderId": "ord_123", "pointsEarned": 84, "createdAt": "2026-10-26T03:40:26.834Z" }
  ]
}
```

`history` lấy từ các lần thanh toán thành công (`PAID`), mới nhất trước. 401 thiếu hoặc sai token.

## Vòng đời đơn hàng và phân quyền (từ Sprint 3)

Nền tảng cho Sprint 3 (issue S3.1). Chưa thêm endpoint mới; các endpoint pha chế, giao món, hủy đơn, voucher, đánh giá được chốt riêng ở S3.2 trở đi.

### Trạng thái đơn

`PENDING`, `PAID`, `PAYMENT_FAILED`, `PREPARING`, `READY`, `COMPLETED`, `CANCELLED`. Client phải xử lý được cả 7 giá trị trong `status` của `GET /orders/me` (giá trị lạ hiển thị theo mặc định, không được làm hỏng trang).

| Từ | Sang | Ai thực hiện | Ghi chú |
|---|---|---|---|
| `PENDING` | `PAID` | Khách (thanh toán) | |
| `PENDING` | `PAYMENT_FAILED` | Hệ thống | thẻ `0000`, ví trên 500.000đ |
| `PAYMENT_FAILED` | `PAID` | Khách (thanh toán lại) | |
| `PENDING`, `PAYMENT_FAILED` | `CANCELLED` | Khách | chưa trả tiền nên không hoàn tiền |
| `PAID` | `PREPARING` | Barista | |
| `PAID` | `CANCELLED` | Khách hoặc Cashier | hoàn tiền mô phỏng, trừ lại điểm |
| `PREPARING` | `READY` | Barista | sinh `pickupCode` |
| `READY` | `COMPLETED` | Cashier | nhập đúng `pickupCode` |

Không có đường hủy từ `PREPARING`, `READY`, `COMPLETED`; `COMPLETED` và `CANCELLED` là trạng thái cuối. Mọi chuyển trạng thái không có trong bảng (kể cả `PAID` sang `PAID`) trả `409`. Các endpoint thực hiện từng bước chuyển sẽ được chốt ở S3.2 (pha chế), S3.4 (giao món), S3.8 (hủy đơn).

### Dữ liệu mới trên đơn

Ba cột mới, đều cho phép rỗng, **chưa xuất hiện trong response ở S3.1** (tránh đổi hợp đồng khi chưa có chức năng dùng):

| Cột | Nghĩa | Xuất hiện trong API từ |
|---|---|---|
| `pickupCode` | mã nhận hàng 6 số, chỉ có khi đơn `READY` | S3.4 |
| `cancelReason` | lý do hủy | S3.8 |
| `refundedAt` | thời điểm hoàn tiền mô phỏng | S3.8 |

### Vai trò và phân quyền

`role` của người dùng: `CUSTOMER`, `BARISTA`, `CASHIER`, `MANAGER`. JWT chứa claim `role` (đã có từ `POST /auth/login`). Route dành cho nhân viên dùng thêm kiểm tra vai trò sau khi xác thực token:

- Thiếu hoặc sai token: `401` (như hiện tại).
- Đúng token nhưng vai trò không được phép: `403`

```json
{ "statusCode": 403, "message": "Không đủ quyền truy cập", "error": "Forbidden" }
```

`POST /auth/register` vẫn luôn tạo `CUSTOMER` và từ chối body có `role`.

### Tài khoản nhân viên (seed)

Bước seed tạo sẵn hai tài khoản để đăng nhập bằng `POST /auth/login`: Barista `0900000001`, Cashier `0900000002`. Mật khẩu đọc từ biến môi trường `SEED_STAFF_PASSWORD` (xem `.env.example`). Môi trường production (`NODE_ENV=production`) **không tạo** hai tài khoản này nếu chưa đặt biến đó. Chạy seed nhiều lần không tạo trùng.

## GET /kds/orders

Màn hình pha chế (KDS) của Barista (issue S3.2). Cần header `Authorization: Bearer <accessToken>` của tài khoản có `role` là `BARISTA`. Trả các đơn đang chờ pha: trạng thái `PAID` hoặc `PREPARING`, **đơn cũ nhất lên đầu**. Màn hình tự gọi lại khoảng 5 giây một lần (polling).

200 OK

```json
[
  {
    "id": "ord_123",
    "status": "PAID",
    "version": 1,
    "createdAt": "2026-11-13T03:40:26.834Z",
    "items": [
      { "productName": "Cà phê sữa", "quantity": 2, "size": "M", "toppings": ["tran-chau"] }
    ]
  }
]
```

`version` là số phiên bản của đơn, phải gửi lại khi đổi trạng thái (xem bên dưới). Không có đơn nào thì trả `[]`. 401 thiếu hoặc sai token. 403 đúng token nhưng không phải `BARISTA`.

## PATCH /kds/orders/:id/status

Barista đổi trạng thái đơn: `PAID` → `PREPARING`, rồi `PREPARING` → `READY`. Cùng quy tắc xác thực với `GET /kds/orders`.

Request

```json
{ "status": "PREPARING", "version": 1 }
```

`status` chỉ nhận `PREPARING` hoặc `READY`; `version` là số nguyên không âm, **đúng giá trị lấy từ `GET /kds/orders`**. Trường lạ bị từ chối (400).

200 OK: `version` trong kết quả đã tăng thêm 1, dùng cho lần đổi tiếp theo.

```json
{ "id": "ord_123", "status": "PREPARING", "version": 2 }
```

- 400 `status` ngoài `PREPARING`/`READY`, thiếu hoặc sai kiểu `version`, hoặc có trường lạ.
- 401 thiếu hoặc sai token. 403 không phải `BARISTA`.
- 404 không có đơn với `id` này.
- 409 trong hai trường hợp, thông báo khác nhau: `version` không khớp (đơn vừa bị người khác đổi, ví dụ khách vừa hủy), hoặc chuyển sai thứ tự (`PAID` → `READY`, `PREPARING` → `PREPARING`, đơn đã `CANCELLED`...). Client tải lại danh sách rồi thử lại.

Khi chuyển sang `READY`, server sinh `pickupCode` (xem mục **Mã nhận hàng và giao món** bên dưới). Mã **không** có trong kết quả của endpoint này: Barista không cần biết mã, khách đọc mã ở `GET /orders/me`.

## Mã nhận hàng và giao món

Issue S3.4. Mã nhận hàng (`pickupCode`) là chuỗi đúng 6 chữ số (có thể bắt đầu bằng `0`, luôn là chuỗi, không phải số). Quy tắc:

- Sinh ngẫu nhiên khi đơn sang `READY`, **duy nhất trong số các đơn đang `READY`**.
- Khách đọc mã ở trường `pickupCode` của `GET /orders/me`; trường này là `null` ở mọi trạng thái khác `READY`.
- Cashier hỏi khách mã rồi nhập vào hệ thống để giao món. Danh sách của Cashier **không** hiển thị mã, để việc đối chiếu có ý nghĩa.
- Đơn sang `COMPLETED` thì mã được xóa (trả về `null`), mã của đơn đó có thể được cấp lại cho đơn `READY` khác.

### GET /orders/me (bổ sung)

Mỗi đơn có thêm một trường:

```json
{ "id": "ord_123", "status": "READY", "total": 84000, "pickupCode": "038417", "createdAt": "...", "items": [] }
```

`pickupCode`: chuỗi 6 chữ số khi `status` là `READY`, ngược lại `null`.

### GET /cashier/orders

Danh sách đơn Cashier xử lý được tại quầy. Cần header `Authorization: Bearer <accessToken>` của tài khoản có `role` là `CASHIER`. Trả các đơn `READY` (chờ giao món) và `PAID` (có thể hủy tại quầy, xem S3.8), **cũ nhất lên đầu**. Query tùy chọn `status=READY` hoặc `status=PAID` để chỉ lấy một loại.

200 OK

```json
[
  {
    "id": "ord_123",
    "status": "READY",
    "version": 3,
    "total": 84000,
    "createdAt": "2026-11-14T03:40:26.834Z",
    "items": [
      { "productName": "Cà phê sữa", "quantity": 2, "size": "M", "toppings": ["tran-chau"] }
    ]
  }
]
```

Không có đơn nào thì trả `[]`. Không trả `pickupCode`. 400 khi `status` ngoài `READY`/`PAID`. 401 thiếu hoặc sai token. 403 không phải `CASHIER`.

### POST /cashier/orders/:id/complete

Cashier nhập mã khách đọc để giao món: `READY` → `COMPLETED`. Cùng quy tắc xác thực với `GET /cashier/orders`.

Request

```json
{ "pickupCode": "038417" }
```

`pickupCode` là chuỗi đúng 6 chữ số. Trường lạ bị từ chối (400).

200 OK: `version` đã tăng thêm 1.

```json
{ "id": "ord_123", "status": "COMPLETED", "version": 4 }
```

- 400 `pickupCode` không đúng định dạng 6 chữ số, hoặc **sai mã** (thông báo `Mã nhận hàng không đúng`). Sai mã không đổi trạng thái đơn.
- 401 thiếu hoặc sai token. 403 không phải `CASHIER`.
- 404 không có đơn với `id` này.
- 409 đơn không ở trạng thái `READY` (chưa pha xong, đã `COMPLETED`, đã `CANCELLED`...), hoặc đơn vừa bị yêu cầu khác cập nhật.

Kiểm tra theo thứ tự: 404, rồi 409 (sai trạng thái), rồi 400 (sai mã).

## Mã giảm giá (voucher) phía khách

Issue S3.6. Khách nhập mã khi đặt đơn; **server tính giảm giá**, client không gửi số tiền giảm.

### Mã giảm giá trong CSDL (`Promotion`)

| Trường | Ý nghĩa |
|---|---|
| `code` | mã duy nhất, lưu viết hoa (`WELCOME10`); khách nhập không phân biệt hoa thường (client nên tự cắt khoảng trắng đầu cuối, khoảng trắng trong mã bị từ chối) |
| `discountType` | `FIXED` (giảm số tiền cố định) hoặc `PERCENT` (giảm theo phần trăm) |
| `discountValue` | `FIXED`: số VND; `PERCENT`: 1 đến 100 |
| `minOrderAmount` | giá trị đơn tối thiểu (VND, tính trước giảm), 0 là không yêu cầu |
| `isActive` | `false` là mã đã bị vô hiệu |
| `expiryDate` | hạn dùng, rỗng là không hết hạn; quá hạn khi thời điểm đặt đơn lớn hơn `expiryDate` |
| `maxUses`, `usedCount` | tổng số lượt dùng tối đa (rỗng là không giới hạn) và số lượt đã giữ |

Seed sẵn: `WELCOME10` (giảm 10%, đơn từ 50.000đ, tối đa 1.000 lượt), `GIAM15K` (giảm 15.000đ, đơn từ 80.000đ, không giới hạn lượt), `BREW20` (giảm 20%, đơn từ 100.000đ, tối đa 50 lượt). Chạy seed nhiều lần không tạo trùng và không đặt lại `usedCount`. Giao diện quản lý mã dành cho Manager làm ở Sprint 4 (S4.8).

### POST /orders (bổ sung)

Thêm trường tùy chọn `promoCode` (3–32 ký tự: chữ, số, `_`, `-`). Một đơn dùng tối đa một mã.

```json
{
  "items": [{ "productId": 1, "quantity": 2, "size": "M", "toppings": ["tran-chau"] }],
  "promoCode": "WELCOME10"
}
```

Cách tính (server): `subtotal` = Σ `quantity × unitPrice` như trước. `FIXED`: giảm `discountValue`, nhưng không quá `subtotal`. `PERCENT`: giảm `⌊subtotal × discountValue / 100⌋`. **`total` = `subtotal` − giảm**, đây cũng là số tiền `POST /payments` thu và là cơ sở tính điểm thưởng (1 điểm / 1.000đ trên số tiền thực trả).

201 Created. Hai trường mới, luôn có mặt (`discountAmount` là `0` khi không dùng mã):

```json
{ "id": "ord_123", "status": "PENDING", "total": 75600, "discountAmount": 8400, "promoCode": "WELCOME10" }
```

Ví dụ: `subtotal` 84.000đ, `WELCOME10` (10%) giảm 8.400đ, `total` 75.600đ. `promoCode` là `null` khi đơn không dùng mã. Gửi lại cùng `Idempotency-Key` trả đơn cũ, không giữ thêm lượt dùng.

Mã bị từ chối thì **không tạo đơn** và không giữ lượt:

| Mã | Khi nào | Thông báo (`message`) |
|---|---|---|
| 400 | mã không tồn tại, hoặc bị vô hiệu | `Mã giảm giá không tồn tại hoặc đã bị vô hiệu` |
| 400 | quá `expiryDate` | `Mã giảm giá đã hết hạn` |
| 400 | `subtotal` nhỏ hơn `minOrderAmount` | `Đơn chưa đạt giá trị tối thiểu 50000đ để dùng mã này` (con số là `minOrderAmount`) |
| 409 | `usedCount` đã bằng `maxUses` | `Mã giảm giá đã hết lượt sử dụng` |
| 400 | `promoCode` sai định dạng, hoặc có trường lạ trong body | lỗi validate như các trường khác |

Lượt dùng được **giữ ngay khi tạo đơn** (tăng `usedCount`, cùng transaction với việc tạo đơn nên hai khách tranh lượt cuối cùng chỉ một người được). Đơn bị hủy (S3.8) trả lại lượt đã giữ.

### GET /orders/me (bổ sung)

Mỗi đơn có thêm `discountAmount` (số nguyên, `0` nếu không dùng mã) và `promoCode` (chuỗi hoặc `null`). `total` đã là số tiền sau giảm.

## Hủy đơn hàng

Issue S3.8. Hủy theo bảng chuyển trạng thái ở mục **Vòng đời đơn hàng và phân quyền**: chỉ hủy được khi quán chưa bắt đầu pha chế.

| Trạng thái đơn | Khách (chủ đơn) | Cashier | Hoàn tiền mô phỏng và trừ điểm |
|---|---|---|---|
| `PENDING`, `PAYMENT_FAILED` | hủy được | **không** (403) | không (chưa trả tiền) |
| `PAID` | hủy được, **bắt buộc có lý do** | hủy được, **bắt buộc có lý do** | có |
| `PREPARING`, `READY`, `COMPLETED`, `CANCELLED` | 409 | 409 | |

Khi hủy đơn `PAID`, trong cùng một transaction: đơn sang `CANCELLED` kèm `cancelReason`; `refundedAt` ghi thời điểm hoàn tiền mô phỏng (không có giao dịch hoàn tiền thật, không thêm dòng `Payment`); trừ lại số điểm đã tích của đơn đó khỏi `loyaltyPoints`; nếu đơn dùng mã giảm giá thì trả lại một lượt dùng của mã. Hủy đơn chưa trả tiền chỉ trả lại lượt dùng của mã (nếu có). Hoàn kho nguyên liệu bổ sung ở Sprint 4 (S4.5).

### POST /orders/:id/cancel

Khách hủy đơn của chính mình. Cần header `Authorization: Bearer <accessToken>`. Đơn của người khác trả 404 như không có đơn.

Request

```json
{ "version": 2, "reason": "Đổi ý, không muốn uống nữa" }
```

`version` là số nguyên không âm, **đúng giá trị `version` của đơn lấy từ `GET /orders/me`**. `reason` là chuỗi tối đa 200 ký tự, bắt buộc khi đơn đang `PAID` (sau khi cắt khoảng trắng không được rỗng), tùy chọn ở các trạng thái khác. Trường lạ bị từ chối (400).

200 OK: `version` đã tăng thêm 1. `refundedAt` là thời điểm hoàn tiền mô phỏng khi đơn từng `PAID`, ngược lại `null`.

```json
{ "id": "ord_123", "status": "CANCELLED", "version": 3, "refundedAt": "2026-11-14T04:10:00.000Z" }
```

- 400 thiếu hoặc sai kiểu `version`, `reason` quá 200 ký tự, có trường lạ, hoặc đơn `PAID` mà không có `reason` (thông báo `Cần ghi lý do khi hủy đơn đã thanh toán`).
- 401 thiếu hoặc sai token.
- 404 không có đơn này, hoặc không phải đơn của người dùng trong token.
- 409 `version` không khớp (đơn vừa bị đổi, ví dụ Barista vừa bấm `PREPARING`), hoặc đơn không hủy được từ trạng thái hiện tại (`PREPARING`, `READY`, `COMPLETED`, `CANCELLED`). Client tải lại `GET /orders/me` rồi thử lại.

Kiểm tra theo thứ tự: 404, rồi 409 (`version`), rồi 409 (trạng thái), rồi 400 (`reason`).

### POST /cashier/orders/:id/cancel

Cashier hủy đơn **đã thanh toán** (`PAID`) tại quầy. Cần token của tài khoản `role` `CASHIER`. Cùng body, cùng kết quả và cùng quy tắc `version` với `POST /orders/:id/cancel`, trừ các điểm khác:

- Hủy được đơn của mọi khách (tìm theo `id`).
- Chỉ hủy được đơn `PAID`; đơn `PENDING` hoặc `PAYMENT_FAILED` trả 403 (`Quầy chỉ hủy được đơn đã thanh toán`).
- Danh sách đơn có thể hủy lấy ở `GET /cashier/orders?status=PAID` (kèm `version`).
- 401 thiếu hoặc sai token. 403 không phải `CASHIER`.

Tình huống Barista bấm `PREPARING` đúng lúc khách bấm hủy: cả hai gửi `version` của cùng lần đọc, bên đến sau nhận 409; nếu Barista đến trước thì đơn đã `PREPARING` và không hủy được nữa.

### GET /orders/me (bổ sung)

Mỗi đơn có thêm ba trường:

| Trường | Nghĩa |
|---|---|
| `version` | số phiên bản của đơn, gửi lại khi hủy |
| `cancelReason` | lý do hủy, `null` nếu chưa hủy hoặc hủy không ghi lý do |
| `refundedAt` | thời điểm hoàn tiền mô phỏng (ISO 8601), `null` nếu chưa hoàn |

### GET /loyalty/me (điều chỉnh)

`history` **không liệt kê** các lần thanh toán của đơn đã `CANCELLED` (điểm đã được trừ lại), để tổng `history` luôn khớp `balance`.

## Đánh giá đơn hàng

Issue S3.10. Khách chấm 1–5 sao kèm nhận xét sau khi nhận món.

### POST /orders/:id/review

Cần header `Authorization: Bearer <accessToken>`. Chỉ chủ đơn đánh giá được; đơn của người khác trả 404 như không có đơn. Chỉ đơn `COMPLETED` được đánh giá, và **mỗi đơn đánh giá một lần** (không sửa, không xóa).

Request

```json
{ "stars": 5, "comment": "Cà phê ngon, ra món nhanh" }
```

`stars` là số nguyên từ 1 đến 5. `comment` tùy chọn, chuỗi tối đa 500 ký tự (cắt khoảng trắng đầu cuối; rỗng thì lưu `null`). Trường lạ bị từ chối (400).

201 Created

```json
{ "id": 1, "orderId": "ord_123", "stars": 5, "comment": "Cà phê ngon, ra món nhanh", "createdAt": "2026-11-14T04:30:00.000Z" }
```

- 400 `stars` ngoài 1–5 hoặc không phải số nguyên, `comment` không phải chuỗi hoặc quá 500 ký tự, hoặc có trường lạ.
- 401 thiếu hoặc sai token.
- 404 không có đơn này, hoặc không phải đơn của người dùng trong token.
- 409 đơn chưa `COMPLETED` (`Chỉ đánh giá được đơn đã hoàn tất`), hoặc đơn đã được đánh giá (`Đơn này đã được đánh giá`). Hai yêu cầu đánh giá đến cùng lúc: chỉ một yêu cầu thành công, yêu cầu còn lại nhận 409.

Kiểm tra theo thứ tự: 404, rồi 409 (chưa hoàn tất), rồi 409 (đã đánh giá).

### GET /orders/me (bổ sung)

Mỗi đơn có thêm trường `review`: `null` nếu chưa đánh giá, ngược lại `{ "stars": 5, "comment": "..." }` (`comment` có thể là `null`). Client dùng trường này để biết có hiển thị popup đánh giá hay không (S3.11): đơn `COMPLETED` mà `review` là `null`.

## Nền tảng Sprint 4 (Manager, kho, khóa tài khoản)

Issue S4.1. Chưa thêm endpoint nghiệp vụ mới; các endpoint quản trị được chốt riêng ở S4.2, S4.4, S4.5, S4.7, S4.8, S4.9. Mục này chốt **quy tắc chung của khu quản trị**, **khóa tài khoản** và **mô hình dữ liệu**.

### Khu quản trị `/admin/*`

Mọi route quản trị của Manager nằm dưới tiền tố `/admin`. Cần header `Authorization: Bearer <accessToken>` của tài khoản có `role` là `MANAGER`. Thiếu hoặc sai token: `401`. Đúng token nhưng vai trò khác: `403` như Sprint 3:

```json
{ "statusCode": 403, "message": "Không đủ quyền truy cập", "error": "Forbidden" }
```

Ngoại lệ có chủ đích: nhập kho (S4.4) cho cả `BARISTA` và `MANAGER`, được ghi rõ ở mục kho.

Seed tạo thêm tài khoản Manager `0900000003` cùng quy tắc với Barista và Cashier: mật khẩu đọc từ `SEED_STAFF_PASSWORD`, môi trường production (`NODE_ENV=production`) không tạo nếu chưa đặt biến đó.

### Khóa tài khoản

`User` có thêm cờ `isLocked` (mặc định `false`; mọi tài khoản hiện có không bị khóa). `POST /auth/login` với tài khoản bị khóa:

- Sai SĐT hoặc sai mật khẩu: `401` như cũ (không lộ tài khoản có bị khóa hay không).
- Đúng mật khẩu nhưng tài khoản bị khóa: `403`

```json
{ "statusCode": 403, "message": "Tài khoản đã bị khóa", "error": "Forbidden" }
```

Token đã cấp trước khi khóa vẫn dùng được cho đến khi hết hạn (24 giờ); server không tra CSDL ở mỗi request. Người quản trị cần chặn ngay thì đổi `JWT_SECRET` (đăng xuất mọi người), không có cơ chế thu hồi từng token.

### Mô hình dữ liệu mới

| Model | Trường chính | Dùng ở |
|---|---|---|
| `Ingredient` | `id`, `name` (duy nhất), `unit` (`G`, `ML`, `PIECE`: hiển thị g, ml, cái), `stock` (số nguyên theo `unit`), `minStock` (ngưỡng cảnh báo) | S4.4, S4.5 |
| `StockReceipt` (phiếu nhập kho) | `ingredientId`, `quantity` (lớn hơn 0), `note`, `createdByPhone` (người thực hiện), `createdAt` | S4.4 |
| `RecipeItem` | `productId`, `size`, `ingredientId`, `quantity`: nguyên liệu cho **một ly** món đó ở cỡ đó; duy nhất theo (`productId`, `size`, `ingredientId`) | S4.4, S4.5 |
| `Topping` | `code` (khóa, ví dụ `tran-chau`), `name`, `price` (VND), `isActive` | S4.2 |
| `SizeSurcharge` | `size` (khóa, `S`/`M`/`L`), `extra` (VND) | S4.2 |
| `ToppingRecipeItem` | `toppingCode`, `ingredientId`, `quantity`: nguyên liệu cho **một phần** topping; duy nhất theo (`toppingCode`, `ingredientId`) | S4.4, S4.5 |

Seed `Topping` và `SizeSurcharge` đúng bảng giá hiện tại (`tran-chau` 8.000, `kem-cheese` 10.000, `thach-cafe` 6.000; size S +0, M +5.000, L +10.000), nên kết quả tính giá không đổi cho tới khi S4.2 chuyển `POST /orders` sang đọc bảng này. Migration chỉ thêm bảng và cột có giá trị mặc định, chạy được trên CSDL đã có dữ liệu.

## Quản trị nhân sự (Manager)

Issue S4.7. Mọi route dưới `/admin/staff` chỉ cho `MANAGER` (quy tắc chung ở mục **Nền tảng Sprint 4**: 401 thiếu hoặc sai token, 403 sai vai trò). Nhân viên là tài khoản có `role` `BARISTA` hoặc `CASHIER`. Manager không tạo, không đổi vai trò, không khóa tài khoản `MANAGER` hay `CUSTOMER` qua các route này.

### GET /admin/staff

Danh sách tài khoản nhân viên và Manager (mọi `role` khác `CUSTOMER`), cũ nhất lên đầu. Không trả mật khẩu.

200 OK

```json
[
  { "phone": "0900000001", "name": "Barista", "role": "BARISTA", "isLocked": false, "createdAt": "2026-11-13T03:00:00.000Z" }
]
```

### POST /admin/staff

Tạo tài khoản nhân viên; nhân viên đăng nhập bằng SĐT ở `POST /auth/login`.

Request

```json
{ "phone": "0911222333", "password": "matkhau123", "name": "Thu ngân 2", "role": "CASHIER" }
```

`phone` theo đúng quy tắc của `POST /auth/register` (số di động Việt Nam, `+84` được đổi thành `0`). `password` 6–72 ký tự. `name` tùy chọn, tối đa 100 ký tự. `role` chỉ nhận `BARISTA` hoặc `CASHIER`. Trường lạ bị từ chối (400).

201 Created

```json
{ "phone": "0911222333", "name": "Thu ngân 2", "role": "CASHIER", "isLocked": false }
```

400 dữ liệu không hợp lệ, hoặc `role` ngoài `BARISTA`/`CASHIER` (kể cả `MANAGER`, `CUSTOMER`). 409 `phone` đã có tài khoản.

### PATCH /admin/staff/:phone

Đổi vai trò và/hoặc khóa, mở khóa một tài khoản nhân viên. `:phone` là SĐT 10 chữ số của tài khoản.

Request: ít nhất một trong hai trường.

```json
{ "role": "BARISTA", "isLocked": true }
```

`role` chỉ nhận `BARISTA` hoặc `CASHIER`; `isLocked` là `true` (khóa) hoặc `false` (mở khóa). Gửi lại đúng trạng thái hiện tại vẫn trả 200 (không lỗi). Tài khoản bị khóa không đăng nhập được (xem mục **Khóa tài khoản**), token đã cấp vẫn dùng được đến khi hết hạn.

200 OK

```json
{ "phone": "0911222333", "name": "Thu ngân 2", "role": "BARISTA", "isLocked": true }
```

- 400 body rỗng, `role` hoặc `isLocked` sai kiểu, hoặc `:phone` không phải SĐT hợp lệ.
- 404 không có tài khoản với SĐT này.
- 409 tài khoản không phải nhân viên (`MANAGER` hoặc `CUSTOMER`), thông báo `Chỉ quản lý được tài khoản nhân viên`.

## Idempotency-Key

`POST /orders` và `POST /payments` nhận thêm header tùy chọn `Idempotency-Key` (1–128 ký tự: chữ, số, `_`, `-`). Frontend nên sinh một key duy nhất (hiện dùng `ord_<thời gian>_<ngẫu nhiên>` cho đơn và `pay_<thời gian>_<ngẫu nhiên>` cho thanh toán; `crypto.randomUUID()` cũng hợp lệ, server không bắt buộc UUID) cho mỗi lần người dùng bấm đặt/thanh toán và gửi lại **đúng key đó** khi retry do mất mạng.

- Gửi lại cùng key: server trả kết quả của lần đầu (vẫn `201`), không tạo thêm đơn hoặc lần thanh toán. Kể cả khi hai yêu cầu đến cùng lúc.
- `POST /orders`: key có hiệu lực trong phạm vi một người dùng. `POST /payments`: trong phạm vi một đơn.
- Key sai định dạng trả `400`. Không gửi header thì hành vi như cũ.
- Thanh toán thử lại sau khi thất bại là một lần thanh toán mới, hãy dùng key mới.
