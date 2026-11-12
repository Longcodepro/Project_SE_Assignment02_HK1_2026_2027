# ADR 002: Áp Dụng Mô Hình Kiến Trúc Modular Monolith Cho Backend

> **Trạng thái:** ĐÃ CHẤP NHẬN (ACCEPTED)  
> **Ngày quyết định:** 2026-10-25  
> **Người tham gia:** Nguyễn Thành Long (`Longcodepro`), Trần Quốc Tài (`TaiTran263`)  
> **Phạm vi:** Phân hệ Backend API (`apps/api`)

---

## 1. Bối Cảnh (Context)
Khi xây dựng hệ thống đặt đồ uống trực tuyến BrewLite, nhóm phát triển cần lựa chọn mô hình kiến trúc phần mềm phù hợp:
1. **Traditional Monolith (Monolith truyền thống):** Toàn bộ code gộp chung vào một khối, không phân chia ranh giới module rõ ràng, dễ biến thành mã nguồn spaghetti khó bảo trì.
2. **Microservices Architecture (Kiến trúc vi dịch vụ):** Tách riêng từng phân hệ (Auth, Products, Orders, Payments) thành các service độc lập chạy trên nhiều container và giao tiếp qua mạng (HTTP/gRPC/Kafka).
3. **Clean Architecture (Hexagonal/Ports & Adapters):** Phân chia nghiêm ngặt theo các tầng trừu tượng (Entities, Use Cases, Interface Adapters).
4. **Modular Monolith (Monolith theo khối module):** Đóng gói toàn bộ hệ thống vào một ứng dụng duy nhất nhưng được chia tách rõ ràng thành các module độc lập theo nghiệp vụ (Domain-driven Modules: `AuthModule`, `ProductsModule`, `OrdersModule`, `PaymentsModule`, `LoyaltyModule`).

Yêu cầu thực tế: Nhóm gồm 2 thành viên, thời gian triển khai gói gọn trong 2 Sprint, hạ tầng triển khai trên nền tảng đám mây miễn phí/giá rẻ (Render, Neon PostgreSQL).

---

## 2. Quyết Định (Decision)
Nhóm quyết định lựa chọn mô hình **Modular Monolith** kết hợp kiến trúc phân lớp (**Layered Architecture: Controller $\rightarrow$ Service $\rightarrow$ Prisma**) trên nền tảng framework **NestJS**:
- Mỗi module nghiệp vụ sở hữu controller, service và DTO riêng.
- Các module giao tiếp với nhau thông qua Dependency Injection và phương thức gọi nội bộ của NestJS, không gọi qua mạng HTTP.
- Toàn bộ backend được đóng gói và vận hành trong 1 Docker container duy nhất.

---

## 3. Hệ Quả (Consequences)

### Tích cực (Ưu điểm):
* **Toàn vẹn dữ liệu tối đa:** Dễ dàng thực thi các giao dịch cơ sở dữ liệu **ACID Transactions** (ví dụ: chuyển đơn sang `PAID`, ghi nhận thanh toán và cộng điểm thưởng trong cùng 1 transaction; từ Sprint 4 có thêm trừ kho nguyên liệu, mà không cần các cơ chế phân tán phức tạp như Saga Pattern).
* **Chi phí vận hành & hạ tầng tối thiểu:** Chỉ cần 1 dịch vụ web trên Render/VPS kết nối với 1 CSDL PostgreSQL duy nhất; cấu hình triển khai đơn giản, không tốn tài nguyên cho service discovery hay message broker.
* **Tốc độ phát triển nhanh:** Dễ debug, dễ chạy local bằng Docker Compose, không gặp độ trễ mạng giữa các dịch vụ nội bộ.
* **Khả năng tiến hóa cao:** Các ranh giới module được phân định nghiêm ngặt; trong tương lai nếu một module (như Payments hoặc Products) có tải cao đột biến, nhóm hoàn toàn có thể trích xuất module đó thành một Microservice độc lập mà không phải đập đi xây lại.

### Tiêu cực (Hạn chế & Đánh đổi):
* **Chia sẻ tài nguyên tiến trình:** Toàn bộ hệ thống chạy chung một Node.js process; nếu một module gặp lỗi nghiêm trọng gây sập tiến trình (Fatal Error/Out of Memory) thì toàn bộ backend sẽ bị ảnh hưởng tạm thời cho đến khi tiến trình tự khởi động lại.
* Đòi hỏi tính kỷ luật cao giữa các thành viên để tránh việc import lậu service giữa các module không đúng quy chuẩn.
