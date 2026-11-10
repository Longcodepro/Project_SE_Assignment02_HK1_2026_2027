# ADR 005: Kiểm Soát Tính Bất Biến & Chống Gửi Trùng Lặp Bằng Idempotency-Key

> **Trạng thái:** ĐÃ CHẤP NHẬN (ACCEPTED)  
> **Ngày quyết định:** 2026-10-27  
> **Người tham gia:** Nguyễn Thành Long (`Longcodepro`), Trần Quốc Tài (`TaiTran263`)  
> **Phạm vi:** Luồng giao dịch Đặt hàng và Thanh toán (`POST /orders`, `POST /payments`)

---

## 1. Bối Cảnh (Context)
Trong ứng dụng web di động phục vụ quán cà phê qua mạng 4G/WiFi công cộng:
* **Độ trễ mạng & mất gói tin (Network Latency/Packet Loss):** Người dùng bấm nút "Xác nhận Thanh toán", nhưng mạng bị chập chờn khiến giao diện chưa kịp phản hồi. Người dùng sốt ruột bấm tiếp lần thứ hai hoặc thứ ba.
* **Cơ chế tự động thử lại của trình duyệt (Browser Retry):** Trình duyệt hoặc thư viện HTTP client (Axios) tự động gửi lại request khi gặp lỗi timeout mạng.

Nếu máy chủ xử lý mỗi HTTP POST như một giao dịch độc lập mới:
$\rightarrow$ **Hệ quả nghiêm trọng:** Hệ thống sẽ tạo ra 2-3 đơn hàng giống hệt nhau, tài khoản khách hàng bị trừ tiền nhiều lần, gây thất thoát tài chính và khiếu nại khách hàng (`RSK-02`).

Phương án xử lý:
1. **Chỉ khóa nút bấm ở Client (Frontend UI Disable):** Người dùng có thể bypass bằng cách tải lại trang hoặc gọi trực tiếp bằng Postman/curl.
2. **Khóa Idempotency ở tầng Backend & Database:** Yêu cầu mọi request nhạy cảm phải mang một mã định danh duy nhất (Idempotency Key) và máy chủ cam kết chỉ thực thi giao dịch đúng một lần duy nhất.

---

## 2. Quyết Định (Decision)
Nhóm quyết định áp dụng chuẩn **Idempotency-Key** (theo đặc tả kỹ thuật IETF RFC HTTP Idempotency):
- **Phía Frontend:** Mỗi khi người dùng bấm "Đặt hàng" hoặc "Thanh toán", Next.js tự động sinh một chuỗi UUID v4 ngẫu nhiên (ví dụ: `e827d0a4-4f2a-4a2e-8c3d-1a2b3c4d5e6f`) và đính kèm vào HTTP Header: `Idempotency-Key: <UUID>`.
- **Phía Backend:** 
  - Đọc header `Idempotency-Key` từ request.
  - Sử dụng ràng buộc duy nhất trong cơ sở dữ liệu PostgreSQL:
    ```prisma
    model Order {
      ...
      idempotencyKey String?
      @@unique([userId, idempotencyKey])
    }
    ```
  - Nếu phát hiện cặp `(userId, idempotencyKey)` đã tồn tại trong CSDL: Backend lập tức trả về kết quả đơn hàng đã tạo trước đó mà **không thực hiện lại logic trừ tiền hay tạo đơn mới**.

---

## 3. Hệ Quả (Consequences)

### Tích cực (Ưu điểm):
* **Bảo vệ toàn vẹn tài chính 100%:** Loại bỏ hoàn toàn nguy cơ trừ tiền hai lần hoặc tạo đơn hàng trùng lặp do mạng giật lag hoặc do người dùng bấm liên tục.
* **An toàn trước tấn công Replay Attack:** Ngăn chặn việc bắt gói tin HTTP để gửi lại nhiều lần nhằm trục lợi.
* **Trải nghiệm người dùng mượt mà:** Khách hàng gặp mạng lag bấm lại nút vẫn nhận được kết quả đơn hàng chính xác mà không gặp lỗi xung đột khó hiểu.

### Tiêu cực (Hạn chế & Đánh đổi):
* **Ràng buộc phối hợp Client - Server:** Phía Frontend bắt buộc phải sinh UUID và truyền đúng header; nếu client quên truyền key, hệ thống phải từ chối hoặc xử lý fallback.
* **Chi phí lưu trữ chỉ mục (Index Overhead):** CSDL cần duy trì một chỉ mục Unique kép `[userId, idempotencyKey]` trên bảng `Order`, tốn thêm một phần dung lượng lưu trữ nhỏ không đáng kể.
