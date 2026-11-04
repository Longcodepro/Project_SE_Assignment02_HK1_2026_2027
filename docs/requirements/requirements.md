# Đặc Tả Yêu Cầu SRS — Phân Hệ Giao Diện (Task 1.2 — Issue D1.2a)

> **Dự án:** Ứng dụng đặt cà phê không tiền mặt BrewLite  
> **Môn học:** Công nghệ phần mềm — Học kỳ 1, Năm học 2026–2027  
> **Nhóm thực hiện:**
> - **Nguyễn Thành Long (`Longcodepro`)** — Backend, Scrum Master, DevOps, Kiến trúc
> - **Trần Quốc Tài (`TaiTran263`)** — Frontend UI/UX, Quản trị trạng thái Client, QA
> - **Đường dẫn bắt buộc:** `docs/requirements/requirements.md`  
> - **Tài liệu tham chiếu:** `docs/architecture/api-contract.md`

---

## 1. Bảng Quy Chuẩn Định Giá (Size & Topping)

Bảng giá niêm yết được đồng bộ hóa tuyệt đối giữa Frontend và Backend (khớp 100% với hợp đồng API tại `docs/architecture/api-contract.md`):

| Phân loại | Tùy chọn hiển thị | Mã định danh API | Phụ thu niêm yết | Ghi chú nghiệp vụ |
|---|---|:---:|:---:|---|
| **Kích cỡ ly**<br>*(Size)* | **Size S** (Nhỏ - Tiêu chuẩn) | `S` | `+0 đ` | Mặc định khi mở Modal chọn món |
| | **Size M** (Vừa) | `M` | `+5.000 đ` | Dung tích tiêu chuẩn quán |
| | **Size L** (Lớn) | `L` | `+10.000 đ` | Dung tích lớn nhất |
| **Topping thêm**<br>*(Toppings)* | **Trân châu đen** | `tran-chau` | `+8.000 đ` | Cho phép chọn nhiều topping cùng lúc |
| | **Kem cheese** | `kem-cheese` | `+10.000 đ` | Lớp kem béo ngậy phủ trên mặt ly |
| | **Thạch cà phê** | `thach-cafe` | `+6.000 đ` | Thạch dai giòn vị cà phê mộc |

### Công thức tính giá niêm yết:
* **Đơn giá 1 ly (Unit Price):**
  $$\text{Đơn giá} = \text{Giá gốc sản phẩm (Size S)} + \text{Phụ thu Size} + \sum (\text{Giá các Topping đã tick chọn})$$
* **Tổng tiền giỏ hàng (Total Amount):**
  $$\text{Tổng tiền} = \sum_{i=1}^{n} (\text{Đơn giá ly } i \times \text{Số lượng ly } i)$$

---

## 2. Bảng Yêu Cầu Chức Năng Giao Diện (Functional Requirements)

Bao gồm 4 yêu cầu chức năng cốt lõi thuộc phân hệ giao diện:

| Mã FR | Tên chức năng | Phân loại MoSCoW | Mô tả nghiệp vụ chi tiết | Tiêu chí chấp nhận kiểm chứng được (Acceptance Criteria) |
|:---:|---|:---:|---|---|
| **FR-01** | **Duyệt Menu đồ uống** | **Must** | Hiển thị danh mục các món cà phê mộc và đồ uống theo dạng thẻ sản phẩm (*Product Card*) trên lưới di động. | • Gọi API `GET /products` thành công, nhận dữ liệu JSON danh sách món (HTTP `200 OK`).<br>• Hiển thị đầy đủ thông tin: Ảnh đồ uống, tên sản phẩm, giá bán cơ bản (Size S).<br>• Món có sản lượng bán trong ngày vượt định mức (`soldToday >= dailyQuota`) phải hiển thị nhãn "Hết hàng" (Sold out) màu xám và vô hiệu hóa nút chọn.<br>• Hỗ trợ thanh chuyển danh mục (Cà phê phin, Espresso, Cold Brew) mượt mà. |
| **FR-02** | **Modal Chi tiết & Tùy biến món** | **Must** | Khi bấm vào món nước, mở cửa sổ Modal cho phép tùy biến size và topping trước khi cho vào giỏ. | • Mặc định mở Modal với **Size S** và không chọn topping nào.<br>• Cho phép chọn duy nhất 1 trong 3 kích cỡ (S, M, L).<br>• Cho phép tick chọn 0, 1 hoặc nhiều loại topping cùng lúc.<br>• Tổng tiền tạm tính trên Modal tự động nhảy theo thời gian thực mỗi khi thay đổi size hoặc tick/bỏ tick topping.<br>• Nút "Thêm vào giỏ hàng" đóng Modal và kích hoạt thông báo/hiệu ứng thêm thành công. |
| **FR-03** | **Quản lý Giỏ hàng (Client Store)** | **Must** | Quản lý trạng thái giỏ hàng phía Client bằng thư viện Zustand, lưu trữ bền vững qua `localStorage`. | • Phân biệt món: Hai ly cùng loại nước nhưng khác size hoặc khác topping phải được lưu thành 2 dòng riêng biệt trong giỏ.<br>• Cho phép tăng/giảm số lượng từng dòng món (giới hạn từ 1 đến 99 ly).<br>• Cho phép xóa từng món bằng nút thùng rác hoặc xóa toàn bộ giỏ hàng.<br>• Badge đếm số lượng trên thanh điều hướng (*Navbar*) tự động cập nhật tổng số ly trong giỏ.<br>• Tổng tiền giỏ hàng hiển thị chính xác theo đúng công thức tính giá. |
| **FR-07** | **Màn hình Lịch sử đơn hàng** | **Must** | Cho phép khách hàng xem lại danh sách các đơn hàng đã đặt trong quá khứ của chính tài khoản mình. | • Gọi API `GET /orders/me` kèm header `Authorization: Bearer <accessToken>` (HTTP `200 OK`).<br>• Sắp xếp danh sách đơn theo thứ tự thời gian tạo mới nhất lên đầu.<br>• Mỗi đơn hiển thị: Mã đơn hàng, ngày giờ đặt, tổng tiền thanh toán, danh sách từng ly (kèm size và topping chi tiết).<br>• Hiển thị Badge trạng thái đơn trực quan theo màu sắc chuẩn:<br>  - `PENDING`: Màu vàng (Chờ thanh toán).<br>  - `PAID`: Màu xanh lá cây (Đã thanh toán thành công).<br>  - `PAYMENT_FAILED`: Màu đỏ (Thanh toán thất bại, có nút Thử lại). |

---

## 3. Bảng Yêu Cầu Phi Chức Năng Giao Diện (Non-Functional Requirements)

Tất cả các tiêu chuẩn phi chức năng đều có ngưỡng đo lường thực tế cụ thể (không ghi số liệu chưa đo):

| Mã NFR | Nhóm chất lượng | Tiêu chuẩn kỹ thuật | Ngưỡng đo lường kiểm chứng cụ thể (Đã chốt) |
|:---:|---|---|---|
| **NFR-01** | **Hiệu năng giao diện**<br>*(Performance)* | Đảm bảo tốc độ phản hồi và tải trang mượt mà trên thiết bị di động. | • **First Contentful Paint (FCP):** $\le 1.5\text{ giây}$ trên đường truyền mạng di động 4G tiêu chuẩn.<br>• **Thời gian phản hồi gọi API `GET /products`:** $\le 300\text{ ms}$ trong môi trường mạng ổn định.<br>• **Thời gian phản hồi API `GET /orders/me`:** $\le 400\text{ ms}$.<br>• Thao tác bấm đổi size/topping trên Modal cập nhật lại giá ngay lập tức: $\le 50\text{ ms}$ (không có độ trễ cảm nhận được). |
| **NFR-03** | **Tính khả dụng & Trải nghiệm**<br>*(Usability)* | Thiết kế theo triết lý **Mobile-First**, tương thích responsive và xử lý trọn vẹn 3 trạng thái giao diện. | • **Độ phân giải hiển thị:** Giao diện tối ưu hoàn hảo cho màn hình điện thoại từ $360\text{px}$ (smartphone nhỏ như iPhone SE) đến $430\text{px}$ (iPhone Pro Max, Samsung Galaxy) mà không bị tràn ngang (*Horizontal Scroll*).<br>• **Trạng thái Đang tải (Loading State):** Hiển thị khung xương nhấp nháy (*Skeleton Card*) khi đang chờ dữ liệu API, tuyệt đối không để màn hình trắng.<br>• **Trạng thái Rỗng (Empty State):** Khi giỏ hàng trống hiển thị hình minh họa thân thiện kèm nút bấm *"Khám phá Menu ngay"*; khi lịch sử chưa có đơn hiển thị *"Bạn chưa có đơn hàng nào"*.<br>• **Trạng thái Báo lỗi (Error State):** Khi mất mạng hoặc API lỗi, hiển thị thông báo lỗi rõ ràng kèm nút bấm *"Thử lại"* (Retry) để kích hoạt fetch lại dữ liệu. |

---

## 4. Tiêu Chí Chấp Nhận Viết Test (Testing Criteria Cho Các Task Sau)

Tài liệu này đóng vai trò căn cứ kỹ thuật để viết bộ kiểm thử tự động ở Task 4 (Sprint 1) và Task 5 (Sprint 2):

1. **Unit / Component Test (Jest & React Testing Library):**
   * Test hàm tính giá: Truyền vào `basePrice: 29000`, `size: 'M'`, `toppings: ['tran-chau']` $\rightarrow$ Kết quả mong đợi chính xác: `42000`.
   * Test Modal: Bấm chọn topping 'kem-cheese' $\rightarrow$ DOM render giá tổng tăng thêm `10000`.
   * Test Cart Store: Thêm 2 món cùng ID nhưng khác size $\rightarrow$ `cart.length` phải bằng `2`. Giảm số lượng từ `1` xuống `0` $\rightarrow$ món tự động bị xóa khỏi giỏ.
2. **Integration / E2E Test (Playwright / Cypress):**
   * Luồng từ Menu $\rightarrow$ Click Card $\rightarrow$ Chọn Size M $\rightarrow$ Thêm giỏ $\rightarrow$ Badge giỏ hàng hiển thị số `1`.
   * Giả lập API lỗi (Mock network error 500) $\rightarrow$ Component hiển thị khung báo lỗi và nút Retry.
