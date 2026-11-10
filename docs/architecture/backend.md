# Tài Liệu Kiến Trúc Phân Hệ Backend — NestJS Modular Monolith (Task 3.1)

> **Dự án:** Ứng dụng đặt cà phê không tiền mặt BrewLite  
> **Môn học:** Công nghệ phần mềm — Học kỳ 1, Năm học 2026–2027  
> **Phân hệ:** Backend API Application (`apps/api`)  
> **Người thực hiện:** **Nguyễn Thành Long (`Longcodepro`)** & **Trần Quốc Tài (`TaiTran263`)**  
> **Mã Issue GitHub:** `[D3.1b] #45` (Phụ trách Issue Backlog `#04` — Task 3.1)  
> **Tài liệu tham chiếu:**  
> - `docs/architecture/api-contract.md` (Đặc tả HTTP Endpoints)  
> - `docs/architecture/adr/001-monorepo.md`, `002-modular-architecture.md`, `003-prisma-postgresql.md`, `005-idempotency.md`  
> - `docs/diagrams/deployment.puml` (Sơ đồ triển khai Production)

---

## 1. Tổng Quan Kiến Trúc & Triết Lý Thiết Kế

Phân hệ Backend được xây dựng trên nền tảng **NestJS 12** kết hợp **TypeScript**, vận hành theo mô hình kiến trúc **Modular Monolith** kết hợp phân lớp (**Layered Architecture: Controller - Service - Repository/Prisma**).

```
+-----------------------------------------------------------------------------------+
|                           NestJS Application (apps/api)                           |
+-----------------------------------------------------------------------------------+
|  [HTTP Inbound] -> Global ValidationPipe -> JwtAuthGuard -> Logging Interceptor   |
|                                         |                                         |
|  +---------------+  +----------------+  +---------------+  +-------------------+  |
|  |  AuthModule   |  | ProductsModule |  | OrdersModule  |  |  PaymentsModule   |  |
|  | (Login, SĐT,  |  | (Menu, Size,   |  | (Pricing, DB  |  | (Mock Card 0000,  |  |
|  |  JWT, bcrypt) |  |  Topping, Seed)|  |  Transaction) |  |  Wallet > 500k)   |  |
|  +-------+-------+  +-------+--------+  +-------+-------+  +---------+---------+  |
|          |                  |                   |                    |            |
|          +------------------+---------+---------+--------------------+            |
|                                       v                                           |
|                             [PrismaModule (ORM)]                                  |
|                                       v                                           |
|                        PostgreSQL Relational Database                             |
+-----------------------------------------------------------------------------------+
```

### Triết lý kiến trúc cốt lõi:
1. **Module-Driven (Module hóa theo Domain nghiệp vụ):** Mỗi nghiệp vụ lớn là một module độc lập, đóng gói controller, service và DTO riêng, không phụ thuộc chéo bừa bãi.
2. **Server-side Authority (Máy chủ nắm quyền định giá):** Toàn bộ phép tính tổng tiền, phụ thu size/topping và tích điểm đều do Backend tính toán độc quyền (**Server-side Pricing** theo `FR-08`), loại bỏ hoàn toàn nguy cơ gian lận sửa giá từ client.
3. **Nguyên tử hóa dữ liệu (ACID Transactions):** Các thao tác nhạy cảm (tạo đơn, trừ tồn kho, cập nhật trạng thái thanh toán và cộng điểm thưởng) luôn chạy trong một Database Transaction duy nhất.
4. **Bảo vệ chống gửi trùng (Idempotency Control):** Tích hợp kiểm soát khóa `Idempotency-Key` từ header HTTP để bảo vệ tuyệt đối các giao dịch tài chính (`FR-09`).

---

## 2. Cấu Trúc Module Nghiệp Vụ (`apps/api/src/`)

Hệ thống được tổ chức thành 5 module chính xoay quanh các ca sử dụng cốt lõi:

| Tên Module | Trách nhiệm nghiệp vụ | Tệp mã nguồn then chốt | Các Endpoint quản lý |
|---|---|---|---|
| **`AuthModule`** | Quản lý đăng ký, đăng nhập bằng Số điện thoại 10 số VN (`FR-04`), băm mật khẩu `bcryptjs` và ký cấp JWT token hạn 24h. | `auth.controller.ts`<br>`auth.service.ts`<br>`jwt.strategy.ts` | • `POST /auth/register`<br>• `POST /auth/login`<br>• `GET /auth/profile` |
| **`ProductsModule`** | Cung cấp danh mục đồ uống, chi tiết món, giá niêm yết Size S, phụ thu size M/L và danh sách topping (`FR-01`, `FR-02`). | `products.controller.ts`<br>`products.service.ts` | • `GET /products`<br>• `GET /products/:id` |
| **`OrdersModule`** | Tiếp nhận giỏ hàng, thực hiện Server-side Pricing tính tổng tiền, mở transaction lưu Order (`PENDING`) và OrderItem (`FR-05`). | `orders.controller.ts`<br>`orders.service.ts` | • `POST /orders`<br>• `GET /orders/me`<br>• `GET /orders/:id` |
| **`PaymentsModule`** | Tiếp nhận thanh toán không tiền mặt, gọi Cổng thanh toán mô phỏng (xử lý lỗi thẻ đuôi `0000`, ví `> 500k`), cập nhật đơn `PAID` và tích điểm thưởng (`FR-06`, `FR-10`). | `payments.controller.ts`<br>`payments.service.ts` | • `POST /payments`<br>• `GET /payments/:id` |
| **`PrismaModule`** | Cung cấp kết nối CSDL PostgreSQL tập trung thông qua `PrismaService`, hỗ trợ pooling kết nối và quản lý vòng đời transaction. | `prisma.service.ts`<br>`prisma.module.ts` | *(Module chia sẻ toàn cục)* |

---

## 3. Quản Trị Cơ Sở Dữ Liệu & Cơ Chế Migration

### 3.1. Hệ quản trị CSDL PostgreSQL
- Lưu trữ dữ liệu quan hệ có cấu trúc: `Product`, `Order`, `OrderItem`, `Payment`, `User`.
- Sử dụng chỉ mục (**Database Index**) trên các trường tra cứu tần suất cao:
  - `Order @@unique([userId, idempotencyKey])`: Chặn đứng việc tạo trùng đơn hàng ở tầng CSDL.
  - `Order @@index([userId])`: Tối ưu hóa tốc độ truy vấn lịch sử đơn hàng của khách hàng (`GET /orders/me`).
  - `User @unique(phone)`: Đảm bảo tính duy nhất của tài khoản khách hàng.

### 3.2. Cơ chế Migration an toàn với Prisma
- Mọi thay đổi cấu trúc bảng đều được quản lý bằng **Prisma Migrate**:
  ```bash
  npx prisma migrate dev --name <ten_migration>
  ```
- Lịch sử thay đổi được lưu vết bằng mã SQL thuần trong thư mục `prisma/migrations/`, giúp nhóm kiểm soát phiên bản schema trên GitHub tương tự như source code.
- Khi triển khai môi trường Production (Render/Docker), lệnh `npx prisma migrate deploy` được tự động chạy trong pipeline CI/CD trước khi khởi động ứng dụng nhằm đảm bảo tính đồng bộ dữ liệu.

---

## 4. Dịch Vụ Thanh Toán Mô Phỏng & Các Cơ Chế Kỹ Thuật

### 4.1. Cổng thanh toán mô phỏng (Mock Payment Service)
Để phục vụ kiểm thử luồng End-to-End mà không phụ thuộc vào cổng thanh toán thật (Momo/VNPAY), hệ thống xây dựng cơ chế mô phỏng theo 2 quy tắc cứng:
1. **Từ chối thẻ (CARD):** Bất kỳ giao dịch nào dùng số thẻ có **4 chữ số cuối là `0000`** sẽ bị từ chối với lý do `Card Declined`.
2. **Từ chối ví (WALLET):** Mọi giao dịch qua ví có tổng tiền **vượt quá 500.000 VNĐ** sẽ bị từ chối do vượt hạn mức một lần giao dịch.
3. **Thành công:** Các trường hợp còn lại đều được chấp thuận, sinh mã giao dịch `transactionId` ngẫu nhiên và cấp mã nhận đồ 6 số `pickupCode`.

### 4.2. Khóa chống gửi trùng lặp (Idempotency-Key)
- Mọi request nhạy cảm (`POST /orders`, `POST /payments`) bắt buộc phải có header `Idempotency-Key: <UUID>`.
- Cơ sở dữ liệu ràng buộc tính duy nhất qua `@@unique([userId, idempotencyKey])`. Nếu client gửi lại do mạng chập chờn, server tra cứu và trả về ngay kết quả lưu trước đó mà không tạo đơn mới hay trừ tiền lặp lại.

### 4.3. Giám sát & Quản trị hệ thống
- **Health Check Endpoint:** `GET /health` trả về `{ status: "ok", timestamp }` phục vụ dịch vụ giám sát tự động (Uptime Robot, Render Health Check).
- **Quản lý cấu hình tập trung:** Sử dụng biến môi trường qua `.env` và `ConfigModule`, tuyệt đối không hardcode chuỗi kết nối CSDL hoặc secret key JWT.
- **Tài liệu API tự động (Swagger):** Tích hợp `@nestjs/swagger` tại đường dẫn `/api/docs`, tự động sinh tài liệu chuẩn OpenAPI 3.0.

---

## 5. Phân Tích So Sánh Kiến Trúc & Đánh Đổi (Trade-offs)

Đề bài Assignment 2 yêu cầu nhóm phân tích lý do lựa chọn kiến trúc, ưu điểm, hạn chế và đánh đổi so với các mô hình khác:

| Tiêu chí so sánh | **Modular Monolith (Lựa chọn của BrewLite)** | **Microservices Architecture** | **Clean Architecture (Hexagonal)** |
|---|---|---|---|
| **Độ phức tạp hạ tầng** | **Thấp:** Chỉ cần 1 container API và 1 CSDL PostgreSQL duy nhất; dễ deploy lên Render/VPS. | **Rất cao:** Đòi hỏi API Gateway, Service Discovery, gRPC, Message Queue (Kafka/RabbitMQ). | **Trung bình:** Cần nhiều tầng trừu tượng hóa (Entity, UseCase, Adapter, Port). |
| **Toàn vẹn dữ liệu** | **Rất cao:** Dễ dàng chạy ACID Database Transaction giữa Order, Inventory và Payment. | **Thấp:** Phải xử lý phân tán (Saga Pattern, 2-Phase Commit, Eventual Consistency). | **Cao:** Quản lý tốt trong phạm vi 1 bounded context. |
| **Tốc độ phát triển** | **Nhanh:** Phù hợp tuyệt đối với nhóm 2 người trong kỳ hạn 2 Sprint của đồ án. | **Rất chậm:** Tốn quá nhiều chi phí thiết lập hạ tầng mạng và giám sát phân tán. | **Trung bình:** Tốn thời gian viết nhiều interface và file trung gian (boilerplate). |
| **Khả năng mở rộng (Scalability)** | Đủ phục vụ hàng nghìn đơn/ngày; sau này dễ tách các module lớn thành service riêng nếu cần. | Tối ưu cho hệ thống quy mô hàng triệu người dùng và nhiều đội dev độc lập. | Tốt cho việc thay đổi database hoặc framework mà không đụng tới nghiệp vụ lõi. |

### Kết luận đánh đổi (Trade-off Decision):
Nhóm quyết định chọn **Modular Monolith** vì đây là giải pháp cân bằng hoàn hảo nhất: đảm bảo tính module hóa rõ ràng theo chuẩn công nghiệp, dễ bảo trì, dễ viết test mà không gây lãng phí tài nguyên hạ tầng hay tạo ra sự phức tạp quá mức (*Over-engineering*) cho phạm vi môn học.
