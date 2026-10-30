# Danh Sách User Story Hệ Thống BrewLite (Task 1.2 — Issue D1.2c)

> **Dự án:** Ứng dụng đặt cà phê không tiền mặt BrewLite  
> **Môn học:** Công nghệ phần mềm — Học kỳ 1, Năm học 2026–2027  
> **Nhóm thực hiện:**
> - **Trần Quốc Tài (`TaiTran263`)** — Phụ trách chính: Frontend UI/UX, Quản trị trạng thái Client, QA
> - **Nguyễn Thành Long (`Longcodepro`)** — Phối hợp: Backend, Scrum Master, DevOps, Kiến trúc
>
> - **Đường dẫn:** `docs/requirements/user-story.md`  
> - **Tài liệu tham chiếu:** `docs/requirements/requirements.md` và `docs/BACKLOG.md`  
> **Cấu trúc chuẩn Agile:** *"Là <vai trò>, tôi muốn <hành động> để <lợi ích mang lại>"*

---

## 1. Nhóm Chức Năng Cốt Lõi (MVP — Sprint 1 & Sprint 2)

### [US-01] Duyệt xem Menu đồ uống
* **Ánh xạ yêu cầu:** `FR-01` | **Phân loại MoSCoW:** **Must Have**
* **User Story:** Là **Khách hàng**, tôi muốn **xem danh sách các món cà phê phân theo danh mục trên màn hình điện thoại**, để **dễ dàng lựa chọn được đồ uống mình yêu thích mà không cần tới quầy gọi món**.
* **Tiêu chí chấp nhận ngắn:**
  - Danh sách lấy từ API `GET /products`, hiển thị ảnh đại diện, tên đồ uống, giá cơ bản Size S.
  - Món bán vượt hạn mức ngày (`soldToday >= dailyQuota`) tự động hiển thị nhãn "Hết hàng" (Sold out) màu xám và khóa nút chọn.
  - Có thanh điều hướng danh mục đồ uống (Cà phê phin, Espresso, Cold Brew).

---

### [US-02] Tùy biến kích cỡ và topping cho đồ uống
* **Ánh xạ yêu cầu:** `FR-02` | **Phân loại MoSCoW:** **Must Have**
* **User Story:** Là **Khách hàng**, tôi muốn **chọn kích cỡ ly (S/M/L) và thêm các loại topping đi kèm**, để **thưởng thức ly đồ uống đúng với sở thích và khẩu vị cá nhân**.
* **Tiêu chí chấp nhận ngắn:**
  - Modal hỗ trợ chọn duy nhất 1 trong 3 kích cỡ: Size S (+0đ), Size M (+5.000đ), Size L (+10.000đ).
  - Cho phép tick chọn nhiều loại topping cùng lúc: Trân châu đen (+8.000đ), Kem cheese (+10.000đ), Thạch cà phê (+6.000đ).
  - Tổng tiền trên Modal tự động tính toán lại theo thời gian thực mỗi khi khách thay đổi lựa chọn.

---

### [US-03] Quản lý giỏ hàng phía Client
* **Ánh xạ yêu cầu:** `FR-03` | **Phân loại MoSCoW:** **Must Have**
* **User Story:** Là **Khách hàng**, tôi muốn **thêm món vào giỏ, xem lại, điều chỉnh số lượng hoặc xóa món**, để **kiểm tra danh sách và tổng số tiền trước khi quyết định đặt hàng**.
* **Tiêu chí chấp nhận ngắn:**
  - Trạng thái giỏ hàng lưu bằng Zustand và đồng bộ qua `localStorage`.
  - Phân tách riêng biệt các ly cùng loại nước nhưng khác size hoặc topping.
  - Cho phép tăng/giảm số lượng từng dòng (1–99 ly), xóa từng món hoặc xóa toàn bộ giỏ.
  - Badge đếm số lượng trên thanh điều hướng cập nhật chính xác tổng số ly hiện có.

---

### [US-04] Đăng ký & Đăng nhập tài khoản khách hàng
* **Ánh xạ yêu cầu:** `FR-04` | **Phân loại MoSCoW:** **Must Have**
* **User Story:** Là **Khách hàng**, tôi muốn **đăng ký tài khoản và đăng nhập bằng email/mật khẩu**, để **lưu trữ lịch sử mua hàng cá nhân và tích lũy điểm thưởng thành viên**.
* **Tiêu chí chấp nhận ngắn:**
  - Mật khẩu đăng ký tối thiểu 6 ký tự, mã hóa băm an toàn bằng `bcryptjs`.
  - Đăng nhập thành công cấp phát `accessToken` JWT, lưu tại client và tự động đính kèm vào header các request sau.
  - Hiển thị tên người dùng và nút Đăng xuất trên thanh điều hướng sau khi đăng nhập.

---

### [US-05] Khởi tạo đơn hàng mới từ giỏ hàng
* **Ánh xạ yêu cầu:** `FR-05` | **Phân loại MoSCoW:** **Must Have**
* **User Story:** Là **Khách hàng**, tôi muốn **bấm đặt hàng từ giỏ hàng**, để **chuyển các món đã chọn thành một đơn hàng chính thức trên hệ thống**.
* **Tiêu chí chấp nhận ngắn:**
  - API `POST /orders` yêu cầu Bearer JWT hợp lệ, từ chối request không có token (HTTP `401`).
  - Server tự động tính lại tổng tiền từ Database dựa trên giá niêm yết (chống gian lận sửa giá client).
  - Đơn hàng được tạo ở trạng thái ban đầu `PENDING`. Dữ liệu thiếu/sai trả về lỗi `400 Bad Request`.

---

### [US-06] Thanh toán không tiền mặt mô phỏng
* **Ánh xạ yêu cầu:** `FR-06` | **Phân loại MoSCoW:** **Must Have**
* **User Story:** Là **Khách hàng**, tôi muốn **thanh toán đơn hàng bằng Thẻ ngân hàng hoặc Ví điện tử**, để **hoàn tất giao dịch mua cà phê nhanh chóng mà không cần dùng tiền mặt**.
* **Tiêu chí chấp nhận ngắn:**
  - Hỗ trợ hai phương thức: Thẻ ngân hàng (`CARD`) và Ví điện tử (`WALLET`).
  - Quy tắc mô phỏng: Thẻ có 4 số cuối `0000` bị từ chối; Ví điện tử từ chối đơn hàng $> 500.000$đ.
  - Thanh toán thành công: Cập nhật đơn sang `status: PAID` và cộng điểm tích lũy.
  - Thanh toán thất bại: Cập nhật đơn sang `status: PAYMENT_FAILED`, hiển thị nút "Thử lại".

---

### [US-07] Tra cứu lịch sử đơn hàng cá nhân
* **Ánh xạ yêu cầu:** `FR-07` | **Phân loại MoSCoW:** **Must Have**
* **User Story:** Là **Khách hàng**, tôi muốn **xem danh sách các đơn hàng mình đã từng đặt**, để **theo dõi trạng thái phục vụ và xem lại chi tiết các lần mua trước**.
* **Tiêu chí chấp nhận ngắn:**
  - Gọi API `GET /orders/me` trả về danh sách đơn của đúng người dùng đang đăng nhập (sắp xếp đơn mới nhất lên đầu).
  - Hiển thị đầy đủ: Mã đơn, ngày giờ đặt, tổng tiền thanh toán, danh sách món kèm size/topping.
  - Hiển thị Badge trạng thái đơn trực quan theo màu sắc: `PENDING` (Vàng), `PAID` (Xanh lá), `PAYMENT_FAILED` (Đỏ).

---

### [US-08] Kiểm soát máy trạng thái đơn hàng (Order State Machine)
* **Ánh xạ yêu cầu:** `FR-08` | **Phân loại MoSCoW:** **Should Have**
* **User Story:** Là **Quản lý cửa hàng**, tôi muốn **hệ thống kiểm soát chặt chẽ các bước chuyển trạng thái đơn hàng**, để **ngăn ngừa lỗi nghiệp vụ (như thanh toán lại đơn đã hoàn tất)**.
* **Tiêu chí chấp nhận ngắn:**
  - Máy trạng thái hữu hạn chỉ cho phép chuyển đổi: `PENDING → PAID | PAYMENT_FAILED`, `PAYMENT_FAILED → PAID`.
  - Chặn tuyệt đối việc gọi thanh toán lại cho đơn đã ở trạng thái `PAID` (trả về lỗi `409 Conflict`).

---

### [US-09] Chống gửi trùng lặp thanh toán (Idempotency)
* **Ánh xạ yêu cầu:** `FR-09` | **Phân loại MoSCoW:** **Should Have**
* **User Story:** Là **Khách hàng**, tôi muốn **không bị trừ tiền 2 lần khi mạng lag hoặc bấm nút thanh toán liên tục**, để **an tâm về tính chính xác và an toàn của giao dịch tài chính**.
* **Tiêu chí chấp nhận ngắn:**
  - Client tự động sinh UUID và gửi kèm trong header `Idempotency-Key`.
  - Nếu gặp lại cùng một key trong cùng một đơn, backend trả về kết quả giao dịch cũ ngay lập tức mà không tạo thêm giao dịch mới.

---

### [US-10] Tích lũy điểm thưởng thành viên (Loyalty)
* **Ánh xạ yêu cầu:** `FR-10` | **Phân loại MoSCoW:** **Should Have**
* **User Story:** Là **Khách hàng**, tôi muốn **được tích lũy điểm thưởng sau mỗi đơn hàng thanh toán thành công**, để **nhận được ưu đãi và gắn bó lâu dài với thương hiệu**.
* **Tiêu chí chấp nhận ngắn:**
  - Tỷ lệ tích điểm: 1 điểm cho mỗi 1.000đ giá trị đơn hàng `PAID` (làm tròn xuống).
  - Điểm thưởng được cập nhật ngay vào tài khoản và hiển thị trên màn hình xác nhận đơn.

---

## 2. Nhóm Chức Năng Mở Rộng (Post Sprint 2 — Đánh dấu: [MỞ RỘNG])

> [!NOTE]
> Các User Story dưới đây thuộc nhóm **Could Have (Tính năng mở rộng)**, được quy hoạch cho giai đoạn phát triển tiếp theo sau khi hoàn thành toàn bộ luồng MVP cốt lõi.

### [US-11] [MỞ RỘNG] Áp dụng mã khuyến mãi (Promotion/Voucher)
* **Ánh xạ yêu cầu:** `FR-11` | **Phân loại MoSCoW:** **Could Have (Mở rộng)**
* **User Story:** Là **Khách hàng**, tôi muốn **nhập mã giảm giá khi thanh toán**, để **tiết kiệm chi phí cho đơn mua đồ uống của mình**.
* **Tiêu chí chấp nhận ngắn:**
  - Bảng `Promotion` kiểm tra mã hợp lệ, hạn sử dụng, số lượt dùng và giá trị đơn tối thiểu.
  - Giảm trừ trực tiếp số tiền cố định (`FIXED`) hoặc tỷ lệ phần trăm (`PERCENT`) vào tổng tiền đơn hàng.

---

### [US-12] [MỞ RỘNG] Hủy đơn hàng trước khi pha chế
* **Ánh xạ yêu cầu:** `FR-12` | **Phân loại MoSCoW:** **Could Have (Mở rộng)**
* **User Story:** Là **Khách hàng / Nhân viên quầy**, tôi muốn **có thể hủy đơn hàng trước khi quán tiến hành pha chế**, để **kịp thời xử lý khi khách đổi ý hoặc cửa hàng gặp sự cố đột xuất**.
* **Tiêu chí chấp nhận ngắn:**
  - Chuyển trạng thái đơn hàng sang `CANCELLED`.
  - Chỉ cho phép hủy khi đơn ở trạng thái `PENDING` hoặc `PAID` (chưa chuyển sang bước pha chế).
  - Ghi nhận người thực hiện hủy (`cancelledBy`) và lý do hủy (`cancelNote`).

---

### [US-13] [MỞ RỘNG] Đánh giá và phản hồi chất lượng
* **Ánh xạ yêu cầu:** `FR-13` | **Phân loại MoSCoW:** **Could Have (Mở rộng)**
* **User Story:** Là **Khách hàng**, tôi muốn **chấm điểm số sao và để lại nhận xét sau khi nhận đồ uống**, để **đóng góp ý kiến cải thiện chất lượng phục vụ của quán cà phê**.
* **Tiêu chí chấp nhận ngắn:**
  - Màn hình chi tiết đơn cho phép chấm điểm từ 1 đến 5 sao và nhập nội dung bình luận.
  - Lưu trữ thông tin phản hồi gắn chặt với mã đơn hàng (`orderId`).

---

### [US-14] [MỞ RỘNG] Báo cáo thống kê doanh thu cho Quản lý
* **Ánh xạ yêu cầu:** `FR-14` | **Phân loại MoSCoW:** **Could Have (Mở rộng)**
* **User Story:** Là **Quản lý cửa hàng**, tôi muốn **xem báo cáo tổng hợp doanh thu và số lượng đơn theo ngày/tuần**, để **đánh giá hiệu quả kinh doanh và lên kế hoạch nhập nguyên liệu hợp lý**.
* **Tiêu chí chấp nhận ngắn:**
  - API `GET /admin/stats/overview` tổng hợp: Tổng doanh thu, số đơn thành công và danh sách Top 5 món bán chạy nhất.
  - Hiển thị số liệu trực quan dạng biểu đồ thống kê cơ bản.
