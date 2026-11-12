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

Trạng thái đơn: `PENDING` → `PAID` | `PAYMENT_FAILED`. Đơn `PAYMENT_FAILED` được thanh toán lại (→ `PAID`). `PAID` là trạng thái cuối ở MVP (Sprint 3 mở rộng thêm `PREPARING`, `READY`, `COMPLETED`, `CANCELLED`).

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

## Idempotency-Key

`POST /orders` và `POST /payments` nhận thêm header tùy chọn `Idempotency-Key` (1–128 ký tự: chữ, số, `_`, `-`). Frontend nên sinh một key duy nhất (hiện dùng `ord_<thời gian>_<ngẫu nhiên>` cho đơn và `pay_<thời gian>_<ngẫu nhiên>` cho thanh toán; `crypto.randomUUID()` cũng hợp lệ, server không bắt buộc UUID) cho mỗi lần người dùng bấm đặt/thanh toán và gửi lại **đúng key đó** khi retry do mất mạng.

- Gửi lại cùng key: server trả kết quả của lần đầu (vẫn `201`), không tạo thêm đơn hoặc lần thanh toán. Kể cả khi hai yêu cầu đến cùng lúc.
- `POST /orders`: key có hiệu lực trong phạm vi một người dùng. `POST /payments`: trong phạm vi một đơn.
- Key sai định dạng trả `400`. Không gửi header thì hành vi như cũ.
- Thanh toán thử lại sau khi thất bại là một lần thanh toán mới, hãy dùng key mới.
