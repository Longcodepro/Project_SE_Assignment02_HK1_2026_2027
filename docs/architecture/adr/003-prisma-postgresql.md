# ADR 003: Sử Dụng Cơ Sở Dữ Liệu PostgreSQL Kết Hợp Prisma ORM

> **Trạng thái:** ĐÃ CHẤP NHẬN (ACCEPTED)  
> **Ngày quyết định:** 2026-10-26  
> **Người tham gia:** Nguyễn Thành Long (`Longcodepro`), Trần Quốc Tài (`TaiTran263`)  
> **Phạm vi:** Tầng truy xuất dữ liệu Backend (`apps/api/prisma`)

---

## 1. Bối Cảnh (Context)
Hệ thống BrewLite xử lý các nghiệp vụ thương mại có tính ràng buộc chặt chẽ:
* Đơn hàng liên kết với người dùng và các dòng sản phẩm (`Order` - `OrderItem` - `Product`).
* Giao dịch thanh toán tài chính cần tính toàn vẹn và nhất quán tuyệt đối (ACID).
* Lịch sử điểm thưởng và mã voucher có quan hệ dữ liệu có cấu trúc.

Các phương án cơ sở dữ liệu và thư viện ORM được đem ra so sánh:
1. **MongoDB (NoSQL) + Mongoose:** Dễ lưu trữ linh hoạt nhưng thiếu cơ chế ràng buộc toàn vẹn khóa ngoại (Foreign Keys) và ACID transactions phức tạp hơn.
2. **PostgreSQL + TypeORM:** CSDL quan hệ mạnh mẽ, TypeORM phổ biến nhưng cú pháp migration phức tạp, tài liệu bảo trì không ổn định và dễ gặp lỗi type safety khi viết quan hệ nhiều-nhiều.
3. **PostgreSQL + Prisma ORM:** CSDL quan hệ chuẩn mực, kết hợp công cụ ORM hiện đại thế hệ mới hỗ trợ Type-Safety toàn diện bằng TypeScript.

---

## 2. Quyết Định (Decision)
Nhóm quyết định lựa chọn **PostgreSQL** làm hệ quản trị cơ sở dữ liệu chính và **Prisma ORM** làm công cụ tương tác dữ liệu:
- Định nghĩa toàn bộ schema tại một tệp duy nhất: `apps/api/prisma/schema.prisma`.
- Quản lý tiến trình thay đổi cấu trúc bảng bằng **Prisma Migrate** (`prisma migrate dev` và `prisma migrate deploy`).
- Sử dụng **Prisma Client** tự động sinh mã (Code Generation) để tương tác CSDL với độ an toàn kiểu dữ liệu tuyệt đối (Type-Safe Database Access).

---

## 3. Hệ Quả (Consequences)

### Tích cực (Ưu điểm):
* **An toàn kiểu dữ liệu toàn diện (Full Type-Safety):** Bất kỳ thay đổi nào trong `schema.prisma` đều được TypeScript compiler kiểm tra ngay khi biên dịch; lập trình viên không bao giờ gõ sai tên cột hay sai kiểu dữ liệu.
* **Tệp cấu hình Schema trực quan, duy nhất:** Toàn bộ model, quan hệ (1-n, n-n), chỉ mục (Index) và enum được gom vào một tệp duy nhất, dễ đọc và dễ review trên GitHub PR.
* **Cơ chế Migration tự động và có kiểm soát phiên bản:** Prisma tự sinh các file SQL migration thuần có đánh số thứ tự trong thư mục `prisma/migrations/`, giúp đồng bộ schema mượt mà giữa các thành viên và trên môi trường Production.
* **Tích hợp ACID Transaction đơn giản:** Dễ dàng chạy `prisma.$transaction([ ... ])` cho luồng tạo đơn và thanh toán.

### Tiêu cực (Hạn chế & Đánh đổi):
* **Độ phức tạp với các câu truy vấn phức tạp (Complex Queries):** Với các câu query thống kê doanh thu đa chiều hoặc phân tích phức tạp, Prisma có thể sinh câu lệnh SQL chưa tối ưu bằng SQL thuần (cần dùng `$queryRaw` khi thực sự cần thiết).
* **Quá trình khởi tạo (Cold-start):** Máy chủ cần tải Prisma Engine khi khởi động, tạo ra một chút độ trễ nhỏ (~100-200ms) trong lần khởi động container đầu tiên.
