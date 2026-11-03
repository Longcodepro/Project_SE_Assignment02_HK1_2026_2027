# ADR 004: Quản Lý Trạng Thái Client Bằng Thư Viện Zustand

> **Trạng thái:** ĐÃ CHẤP NHẬN (ACCEPTED)  
> **Ngày quyết định:** 2026-10-26  
> **Người tham gia:** Trần Quốc Tài (`TaiTran263`), Nguyễn Thành Long (`Longcodepro`)

---

## 1. Bối Cảnh (Context)
Ứng dụng đặt đồ uống BrewLite có nhiều trạng thái toàn cục (Global State) cần chia sẻ xuyên suốt các trang:
* Danh sách món trong giỏ hàng, số lượng từng ly, tùy chọn size/topping và tổng tiền.
* Phiên đăng nhập của khách hàng (`accessToken` JWT và thông tin tài khoản).
* Yêu cầu bắt buộc: Dữ liệu giỏ hàng và phiên đăng nhập không được mất đi khi khách hàng F5 tải lại trang.

Các phương án được đưa ra cân nhắc:
1. **React Context API:** Có sẵn trong React, nhưng không có sẵn middleware lưu trữ, mỗi lần cập nhật state giỏ hàng sẽ kích hoạt re-render toàn bộ cây component con.
2. **Redux Toolkit:** Rất mạnh mẽ nhưng cồng kềnh, cấu hình phức tạp, tạo nhiều mã boilerplate thừa thãi cho một ứng dụng mobile nhỏ gọn.
3. **Zustand:** Thư viện quản lý state hiện đại, siêu nhẹ, không cần bọc Provider Component.

---

## 2. Quyết Định (Decision)
Nhóm quyết định chọn **Zustand** kết hợp middleware **`persist`** để quản lý toàn bộ Client State của phân hệ Frontend (`useCartStore` và `useAuthStore`).

---

## 3. Hệ Quả (Consequences)

### Tích cực (Ưu điểm):
* **Kích thước cực nhỏ:** Thư viện chỉ nặng xấp xỉ ~1KB, giảm tối đa dung lượng tải trang cho thiết bị di động.
* **Tối ưu hóa Re-render:** Hỗ trợ cơ chế chọn lọc state (Selector-based), component chỉ re-render khi giá trị nó theo dõi thực sự thay đổi.
* **Tự động lưu trữ (Persistence):** Middleware `persist` tự động đồng bộ state với `localStorage` mà không cần viết thêm mã `useEffect` thủ công.
* **Không cần Provider:** Có thể truy xuất và cập nhật state ở bất kỳ đâu (kể cả bên trong các hàm helper thông thường).

### Tiêu cực (Hạn chế & Trade-off):
* Hệ sinh thái DevTools không trực quan bằng Redux DevTools khi cần tua lại lịch sử state phức tạp (Time-travel debugging).
* Cần chú ý xử lý Hydration khi render phía server trên Next.js để tránh cảnh báo lệch mã HTML ban đầu giữa server và client.