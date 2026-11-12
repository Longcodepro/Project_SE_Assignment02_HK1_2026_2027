# SRS phần Giao diện Web — BrewLite (Task 1.2, frontend)

> **Mã tài liệu:** `REQ-WEB` · **Phụ trách:** Trần Quốc Tài (`TaiTran263`)  
> **Phạm vi mã nguồn:** `apps/web` (Next.js 16, TypeScript, Tailwind CSS, Zustand, Mobile-first/PWA)  
> **Đường dẫn đích:** `docs/requirements/requirements-web.md`  
> **Tham chiếu:** `docs/requirements/context-and-scope.md` mục 6 (nguồn sự thật chuẩn, Task 1.1), `docs/requirements/requirements-api.md` (Task 1.2 backend), `docs/architecture/api-contract.md`

**Hướng dẫn đọc:** mã `CN-xx`, `UC-xx`, `FR-xx`, `NFR-xx` là mã thống nhất của toàn bộ hệ thống BrewLite. Tài liệu này đặc tả chi tiết **phần Giao diện Web khách hàng (Frontend — `apps/web`)**; phần API và CSDL do Long phụ trách tại `docs/requirements/requirements-api.md`. Tên định danh, enum, endpoint và header đặt trong dấu `backtick` là tên đúng trong mã nguồn. Mọi quy chuẩn tiền tệ hiển thị bằng số nguyên VND có phân cách hàng nghìn (ví dụ: `29.000 đ`).

---

## 1. Tổng hợp yêu cầu chức năng phần Web

| Mã FR | Yêu cầu nghiệp vụ giao diện | Màn hình / Component | Chức năng lớn | Sprint | MoSCoW | Use Case liên kết |
|:---:|---|---|:---:|:---:|:---:|:---:|
| `FR-01` | Duyệt menu đồ uống Mobile-first, tìm kiếm, lọc, nhãn Sold out | Trang chủ `/` (`ProductCard`, Tabs) | CN-02 | 1 | Must | UC-01 |
| `FR-02` | Modal chi tiết & tùy biến món (Size S/M/L, Topping) | Modal `ProductDetailModal` trên `/` | CN-03 | 2 | Must | UC-02 |
| `FR-03` | Quản lý giỏ hàng phía Client Store (Zustand, `localStorage`) | Trang `/cart`, Navbar Cart Badge | CN-04 | 2 | Must | UC-03 |
| `FR-04` | Đăng ký, đăng nhập tài khoản bằng SĐT Việt Nam (10 số) | Modal `AuthModal` | CN-05 | 2 | Must | UC-04 |
| `FR-05` | Xác nhận đơn hàng & Server-side Pricing (không gửi giá lên) | Màn hình Checkout `/checkout` | CN-06 | 2 | Must | UC-05 |
| `FR-06` | Thanh toán không tiền mặt mô phỏng (Thẻ `CARD`, Ví `WALLET`) | Màn hình Checkout `/checkout` | CN-06 | 2 | Must | UC-05 |
| `FR-07` | Lịch sử đơn hàng và theo dõi tiến độ tự động (Polling 5s) | Trang `/orders`, `/order-success` | CN-07 | 2 | Must | UC-06 |
| `FR-10` | Xem số dư điểm tích lũy & lịch sử thưởng thành viên | Header Navbar, Trang `/orders` | CN-07 | 2 | Should | UC-20 |

### Bảng giá niêm yết tùy chọn (Đồng bộ tuyệt đối với Backend)

| Phân loại | Tùy chọn hiển thị | Mã API (`size` / `toppings`) | Phụ thu niêm yết | Quy tắc giao diện |
|---|---|:---:|:---:|---|
| **Kích cỡ ly**<br>*(Size)* | **Size S** (Nhỏ) | `S` | `+0 đ` | Mặc định chọn khi mở Modal |
| | **Size M** (Vừa) | `M` | `+5.000 đ` | Radio button, chỉ chọn duy nhất 1 size |
| | **Size L** (Lớn) | `L` | `+10.000 đ` | Radio button, chỉ chọn duy nhất 1 size |
| **Topping thêm**<br>*(Toppings)* | **Trân châu đen** | `tran-chau` | `+8.000 đ` | Checkbox, cho phép tick chọn nhiều topping |
| | **Kem cheese** | `kem-cheese` | `+10.000 đ` | Checkbox, cho phép tick chọn nhiều topping |
| | **Thạch cà phê** | `thach-cafe` | `+6.000 đ` | Checkbox, cho phép tick chọn nhiều topping |

**Công thức tính giá tạm tính phía Client (Preview Price):**
- **Đơn giá 1 ly (Unit Price):**
  $$\text{Unit Price} = \text{Giá gốc món (Size S)} + \text{Phụ thu Size} + \sum (\text{Giá các Topping đã tick})$$
- **Tổng tiền tạm tính giỏ hàng (Estimated Cart Total):**
  $$\text{Estimated Total} = \sum_{i=1}^{n} (\text{Unit Price}_i \times \text{Quantity}_i)$$
*(Lưu ý bảo mật: Tổng tiền này chỉ hiển thị cho khách xem trước; khi bấm Đặt hàng, Client KHÔNG gửi trường tổng tiền lên server).*

---

## 2. Đặc tả chi tiết yêu cầu chức năng (Core MVP — Sprint 1 & 2)

### FR-01. Duyệt menu đồ uống Mobile-first (Sprint 1, Must, CN-02)

- **Màn hình hiển thị:** Trang chủ `/`.
- **Bố cục giao diện:** Thiết kế theo triết lý Mobile-first, danh sách món bố trí dạng lưới 1 cột (trên di động) hoặc 2–3 cột (trên tablet/desktop).
- **Thanh tab danh mục:** Tự động tổng hợp danh mục từ thuộc tính `category` của các món trả về từ API `GET /products` (ví dụ: *Tất cả, Cà phê phin, Espresso, Trà trái cây, Cold Brew*). Thao tác chuyển tab lọc tức thì không cần tải lại trang.
- **Thanh tìm kiếm:** Ô nhập từ khóa theo tên món, lọc real-time (debounce 300ms), không phân biệt hoa thường.
- **Xử lý 3 trạng thái giao diện bắt buộc (NFR-04):**
  1. *Skeleton Loading:* Hiển thị 4 thẻ khung xương nhấp nháy trong lúc chờ API phản hồi, tuyệt đối không để màn hình trắng.
  2. *Empty State:* Khi danh mục không có món hoặc từ khóa tìm kiếm không khớp, hiển thị hình vẽ thân thiện kèm thông điệp *"Không tìm thấy món phù hợp"* và nút *"Xem tất cả món"*.
  3. *Error & Retry:* Khi mạng mất kết nối hoặc API trả lỗi (5xx), hiển thị thông báo lỗi rõ ràng kèm nút *"Thử lại"* để kích hoạt gọi lại API.
- **Xử lý món hết hàng (Sold out):** Đọc cờ `isAvailable` từ API:
  - Nếu `isAvailable: false`: Phủ lớp mờ (*opacity 60%*) trên thẻ món, hiển thị huy hiệu nổi bật **"Hết hàng"** (màu đỏ/xám), vô hiệu hóa thao tác click mở modal hoặc thêm vào giỏ.

**Tiêu chí chấp nhận (Acceptance Criteria):**
1. Gọi API `GET /products` khi vào trang, render đúng danh sách món với tên, ảnh, danh mục và giá cơ bản (Size S).
2. Thao tác lọc tab và tìm kiếm hoạt động mượt mà, phản hồi ngay lập tức dưới 50ms.
3. Khi API đang tải, người dùng nhìn thấy Skeleton Card; khi mất mạng nhìn thấy nút Retry.
4. Món có `isAvailable: false` hiển thị nhãn "Hết hàng", người dùng không thể bấm chọn đặt món.

---

### FR-02. Modal chi tiết & tùy biến món (Sprint 2, Must, CN-03)

- **Kích hoạt:** Mở Modal popup/bottom-sheet khi người dùng click vào một thẻ món còn hàng (`isAvailable: true`).
- **Chọn Kích cỡ (Size):**
  - Hiển thị 3 lựa chọn radio: **Size S** (+0 đ), **Size M** (+5.000 đ), **Size L** (+10.000 đ).
  - Mặc định khi mở Modal luôn chọn sẵn **Size S**.
  - Người dùng chỉ được chọn duy nhất 1 kích cỡ tại một thời điểm.
- **Chọn Topping thêm:**
  - Hiển thị danh sách checkbox gồm: *Trân châu đen (+8.000 đ)*, *Kem cheese (+10.000 đ)*, *Thạch cà phê (+6.000 đ)*.
  - Cho phép người dùng tick chọn không giới hạn: 0, 1 hoặc cả 3 loại topping.
- **Hiển thị đơn giá thời gian thực:**
  - Tại thanh chân Modal (Footer Bar), đơn giá tạm tính tự động cập nhật ngay lập tức ($\le 50\text{ ms}$) theo công thức niêm yết mỗi khi người dùng thay đổi Size hoặc tick/bỏ tick Topping.
- **Thao tác Thêm vào giỏ:**
  - Nút *"Thêm vào giỏ hàng"* gom toàn bộ lựa chọn (`product`, `size`, `toppings`, `unitPrice`) đẩy vào Zustand store.
  - Sau khi thêm thành công: Tự động đóng Modal, hiển thị Toast thông báo *"Đã thêm vào giỏ hàng"*, và cập nhật số đếm trên Navbar.

**Tiêu chí chấp nhận:**
1. Mở Modal hiển thị đúng tên món, ảnh và đơn giá Size S mặc định.
2. Đổi sang Size M $\rightarrow$ giá tạm tính tăng đúng 5.000 đ; đổi sang Size L $\rightarrow$ giá tạm tính tăng đúng 10.000 đ.
3. Tick chọn Trân châu đen (+8.000 đ) và Kem cheese (+10.000 đ) $\rightarrow$ giá tạm tính tăng thêm đúng 18.000 đ.
4. Bấm "Thêm vào giỏ hàng" đóng modal và giỏ hàng nhận đúng dữ liệu.

---

### FR-03. Quản lý giỏ hàng Client Store (Sprint 2, Must, CN-04)

- **Quản lý trạng thái:** Sử dụng thư viện **Zustand**, đồng bộ tự động và bền vững với trình duyệt qua `localStorage` (key: `brewlite-cart-storage`).
- **Hỗ trợ khách vãng lai:** Khách hàng chưa đăng nhập tài khoản vẫn thêm món, chỉnh sửa giỏ hàng bình thường. Khi chuyển sang bước đăng nhập, toàn bộ giỏ hàng phải được **giữ nguyên vẹn**.
- **Quy tắc phân định dòng món trong giỏ:**
  - Nếu thêm món cùng `productId`, cùng `size` và cùng danh sách `toppings`: Tự động tăng `quantity` của dòng đó lên 1.
  - Nếu cùng `productId` nhưng khác `size` hoặc khác `toppings`: Bắt buộc tạo thành một dòng riêng biệt trong giỏ hàng.
- **Thao tác trên giỏ hàng:**
  - Nút `+` và `-`: Tăng hoặc giảm số lượng từng ly (giới hạn từ 1 đến 99 ly). Khi giảm từ 1 xuống 0, hiển thị hộp thoại xác nhận hoặc xóa dòng món đó.
  - Nút biểu tượng thùng rác: Xóa ngay dòng món được chọn.
  - Nút *"Xóa toàn bộ"* giỏ hàng: Xóa sạch các món sau khi người dùng xác nhận.
- **Huy hiệu số lượng (Cart Badge):** Trên thanh Header/Bottom Nav hiển thị số tổng cộng tất cả các ly trong giỏ hàng. Số này tự động cập nhật đồng bộ ở mọi màn hình.
- **Màn hình Giỏ hàng `/cart`:**
  - Hiển thị danh sách các món đã chọn, từng dòng ghi rõ size và các topping đi kèm.
  - Bảng tổng tiền tạm tính.
  - Nút *"Tiến hành đặt hàng"*: Kiểm tra đăng nhập. Nếu chưa đăng nhập $\rightarrow$ mở Modal Auth; nếu đã đăng nhập $\rightarrow$ chuyển hướng sang `/checkout`.
  - Trạng thái giỏ rỗng (*Empty State*): Hiển thị icon giỏ hàng rỗng, thông điệp mời gọi và nút *"Khám phá menu ngay"*.

**Tiêu chí chấp nhận:**
1. Thêm 2 ly cùng loại nhưng 1 ly Size S và 1 ly Size M $\rightarrow$ Giỏ hàng hiển thị 2 dòng riêng biệt.
2. Tắt trình duyệt hoặc tải lại trang $\rightarrow$ Giỏ hàng vẫn giữ nguyên dữ liệu đã chọn.
3. Tăng/giảm số lượng ly cập nhật đúng tổng tiền hiển thị trên trang giỏ hàng.
4. Xóa hết món trong giỏ $\rightarrow$ Chuyển sang Empty State.

---

### FR-04. Đăng ký & Đăng nhập bằng SĐT (Sprint 2, Must, CN-05)

- **Giao diện xác thực:** Cửa sổ Modal `AuthModal` gồm 2 tab chuyển đổi: "Đăng nhập" và "Đăng ký".
- **Form Đăng ký:**
  - Số điện thoại (`phone`): Trường bắt buộc. Validate theo chuẩn số di động Việt Nam gồm **10 chữ số** bắt đầu bằng `03`, `05`, `07`, `08` hoặc `09` (`/^(?:03|05|07|08|09)\d{8}$/`, bỏ khoảng trắng trước khi kiểm tra). API còn chấp nhận đầu số `+84` và chuẩn hóa về 10 số, nhưng giao diện chỉ nhận dạng 10 số. Nếu nhập sai định dạng, hiển thị thông báo lỗi màu đỏ ngay dưới ô nhập.
  - Mật khẩu (`password`): Trường bắt buộc, giới hạn từ 6 đến 72 ký tự. Có nút icon con mắt ẩn/hiện mật khẩu.
  - Họ và tên (`name`): Trường tùy chọn (optional).
  - Email (`email`): Trường tùy chọn (optional), nếu nhập thì phải đúng định dạng email.
- **Form Đăng nhập:**
  - Ô nhập Số điện thoại (`phone`) và Mật khẩu (`password`).
  - Nút tiện ích **"Tài khoản mẫu (Demo)"**: Click 1 chạm tự động điền SĐT mẫu (`0912345678`) và mật khẩu mẫu (`matkhau123`) vào form. Nút chỉ điền sẵn giúp nhập nhanh; tài khoản này **chưa có sẵn trong CSDL** (seed chỉ tạo danh mục và món), nên lần đầu phải bấm "Đăng ký" với đúng SĐT và mật khẩu đó rồi mới đăng nhập được.
- **Quản lý Token phía Client:**
  - Khi đăng nhập thành công: Lưu `accessToken` vào `useAuthStore` (đồng bộ `localStorage`), tự động giải mã JWT để lấy thông tin `phone` (khóa chính của tài khoản) và `role` (`CUSTOMER`).
  - Gắn header `Authorization: Bearer <accessToken>` vào tất cả các request API yêu cầu xác thực (`POST /orders`, `POST /payments`, `GET /orders/me`, `GET /loyalty/me`).
- **Xử lý đăng xuất:** Xóa sạch token khỏi store, đưa người dùng về trạng thái khách vãng lai, nhưng giữ nguyên các món đang có trong giỏ hàng.

**Tiêu chí chấp nhận:**
1. Nhập SĐT không đủ 10 số hoặc chứa chữ $\rightarrow$ Nút submit bị chặn hoặc báo lỗi định dạng.
2. Đăng nhập sai mật khẩu $\rightarrow$ Hiển thị thông báo lỗi 401 thân thiện từ API: *"Số điện thoại hoặc mật khẩu không chính xác"*.
3. Đăng nhập thành công $\rightarrow$ Modal đóng lại, thanh Navbar đổi sang hiển thị tên/SĐT khách hàng và số dư điểm.

---

### FR-05. Xác nhận đơn hàng & Server-side Pricing (Sprint 2, Must, CN-06)

- **Màn hình hiển thị:** Màn hình thanh toán `/checkout`. Yêu cầu bắt buộc đã đăng nhập (nếu chưa, tự động bật Modal Auth).
- **Tóm tắt đơn hàng:** Hiển thị danh sách các ly sắp đặt (tên món, size, topping, số lượng).
- **Bảo mật Server-side Pricing (NFR-01):**
  - Giao diện **chỉ gửi cấu trúc món** lên API `POST /orders`, gồm danh sách `items`: `[{ productId, quantity, size, toppings }]`.
  - **Tuyệt đối không gửi trường `total`, `price` hay `unitPrice` lên server.** Tổng tiền thanh toán do server tự đọc CSDL và tính toán.
- **Chống gửi trùng (`Idempotency-Key`):**
  - Khi người dùng vào trang Checkout, client tự động sinh một mã `Idempotency-Key` duy nhất (1–128 ký tự `A-Za-z0-9_-`, ví dụ `ord_<thời gian>_<ngẫu nhiên>`; không bắt buộc UUID).
  - Truyền mã này vào header `Idempotency-Key` khi gọi `POST /orders`.
  - Trong lúc API đang xử lý: Vô hiệu hóa nút *"Đặt hàng"*, hiển thị vòng xoay Loading để ngăn chặn người dùng bấm liên tiếp.
- **Xử lý phản hồi:**
  - Nhận HTTP 201 Created kèm dữ liệu đơn `{ id, status: "PENDING", total, version }` $\rightarrow$ Chuyển sang bước thanh toán.
  - Nếu API trả lỗi 409 (do có món bị hết hàng giữa chừng `isAvailable: false`): Hiển thị cảnh báo *"Có món trong giỏ vừa hết hàng, vui lòng cập nhật lại giỏ!"*.

**Tiêu chí chấp nhận:**
1. Payload gửi lên `POST /orders` chỉ chứa `items` (không chứa trường giá tiền). Request header có `Idempotency-Key` hợp lệ (1–128 ký tự `A-Za-z0-9_-`).
2. Nhấn nút "Đặt hàng" 1 lần $\rightarrow$ Nút bị vô hiệu hóa ngay, không thể click lần 2.
3. Nhận mã đơn hàng từ server và hiển thị đúng số tiền do server tính.

---

### FR-06. Thanh toán không tiền mặt mô phỏng (Sprint 2, Must, CN-06)

- **Màn hình hiển thị:** Tích hợp trực tiếp tại `/checkout` sau khi đơn hàng được tạo (`PENDING`).
- **Chọn phương thức thanh toán:**
  - **Thẻ ngân hàng (`CARD`):** Hiển thị ô nhập số thẻ mô phỏng. Không lưu số thẻ thô vào bộ nhớ lâu dài.
    - *Kịch bản lỗi kiểm thử:* Nếu 4 số cuối của thẻ là `0000`, hệ thống mô phỏng từ chối thanh toán.
  - **Ví điện tử (`WALLET`):** Mô phỏng thanh toán ví.
    - *Kịch bản lỗi kiểm thử:* Nếu tổng tiền đơn $> 500.000\text{ đ}$, hệ thống mô phỏng báo lỗi vượt hạn mức ví.
- **Gửi yêu cầu thanh toán:**
  - Gọi API `POST /payments` với body: `{ orderId, method }` (thêm `cardNumber` 13 đến 19 chữ số khi `method` là `CARD`; thiếu thì API trả 400) và header `Idempotency-Key`.
- **Xử lý kết quả giao dịch:**
  - **Thành công (`status: "PAID"`):** Xóa sạch giỏ hàng trong Zustand store, chuyển hướng khách sang màn hình `/order-success?orderId=...`, kích hoạt thông báo thành công.
  - **Thất bại (`status: "PAYMENT_FAILED"`):** Giữ nguyên đơn hàng trên giao diện, hiển thị thông báo lỗi rõ ràng giải thích nguyên nhân (thẻ bị từ chối hoặc ví vượt hạn mức), hiển thị nút *"Thanh toán lại"* hoặc cho phép đổi phương thức khác.

**Tiêu chí chấp nhận:**
1. Chọn Thẻ nhập đuôi `0000` $\rightarrow$ Giao diện báo lỗi thanh toán thất bại, đơn chuyển sang `PAYMENT_FAILED`, có nút thử lại.
2. Chọn Ví với đơn trên 500.000 đ $\rightarrow$ Giao diện báo lỗi vượt hạn mức 500.000 đ.
3. Thanh toán hợp lệ $\rightarrow$ Giỏ hàng được làm sạch, chuyển đến trang `/order-success` hiển thị trạng thái `PAID`.

---

### FR-07. Lịch sử đơn hàng & Theo dõi tự động (Sprint 2, Must, CN-07)

- **Màn hình hiển thị:** Trang `/orders` (Lịch sử đơn) và `/order-success` (Theo dõi đơn vừa đặt).
- **Trang Lịch sử `/orders`:**
  - Gọi API `GET /orders/me` kèm token, hiển thị danh sách tất cả các đơn của tài khoản, sắp xếp đơn mới nhất lên đầu.
  - Từng thẻ đơn hiển thị: Mã đơn, ngày giờ đặt, tổng tiền thực tế, chi tiết từng ly (size, topping).
- **Cơ chế Polling tự động định kỳ 5 giây:**
  - Thiết lập hook `setInterval` tự động gọi lại API mỗi **5 giây/lần** để làm mới trạng thái đơn hàng mà khách hàng không cần bấm F5 hay thao tác tay.
  - Tự động dừng (clear) interval khi chuyển trang hoặc khi tab trình duyệt bị ẩn (*Page Visibility API*).
  - Vẫn giữ nút bấm thủ công *"Làm mới"* (có cooldown 3 giây chống spam) cho người dùng chủ động.
- **Hệ thống Badge màu trạng thái trực quan:**
  - `PENDING`: Màu vàng cam — Chờ thanh toán.
  - `PAID`: Màu xanh lá — Đã thanh toán, chuyển pha chế.
  - `PAYMENT_FAILED`: Màu đỏ — Thanh toán thất bại (kèm nút Thanh toán lại).
  - `PREPARING`: Màu cam đậm — Đang pha chế (Sprint 3).
  - `READY`: Màu tím — Món đã sẵn sàng nhận (Sprint 3).
  - `COMPLETED`: Màu xanh lá cây — Đã hoàn tất (Sprint 3).
  - `CANCELLED`: Màu xám — Đơn đã hủy (Sprint 3).
- **Xử lý xung đột khóa lạc quan (`409 Conflict`):**
  - Khi thao tác trên đơn nếu nhận mã lỗi 409 từ API (do sai `version`), giao diện hiển thị Toast: *"Thông tin đơn hàng vừa được cập nhật từ hệ thống, đang làm mới..."* và tự động fetch lại dữ liệu mới nhất.

**Tiêu chí chấp nhận:**
1. Màn hình `/orders` hiển thị danh sách đơn của đúng tài khoản đang đăng nhập.
2. Đơn hàng tự động đổi trạng thái hiển thị trên màn hình sau khoảng 5 giây khi Backend có thay đổi dữ liệu mà không cần F5.
3. Badge trạng thái đổi đúng màu sắc và nhãn tương ứng.

---

### FR-10. Điểm tích lũy & Lịch sử thưởng (Sprint 2, Should, CN-07)

- **Vị trí hiển thị:** Trên thanh điều hướng Navbar (cạnh tên người dùng) và trong mục thông tin tài khoản tại trang `/orders`.
- **Tỷ lệ tích điểm:** Mỗi 1.000 đ thực trả của đơn hàng ở trạng thái `PAID` được cộng **1 điểm thưởng**.
- **Hiển thị số dư & Lịch sử:**
  - Gọi API `GET /loyalty/me` lấy số dư khả dụng (`balance`) và lịch sử các lần cộng điểm (`history`).
  - Mỗi dòng lịch sử thể hiện: Mã đơn hàng, ngày giờ thanh toán, số tiền trả và số điểm nhận được (ví dụ: *+84 điểm*).
- **Giới hạn nghiệp vụ:** Giao diện ghi rõ dòng chú thích: *"Điểm thành viên dùng để xếp hạng và nhận ưu đãi, hiện tại chưa áp dụng đổi voucher/tiền mặt"* (tuân thủ mục Won't Have 7).

**Tiêu chí chấp nhận:**
1. Sau khi thanh toán đơn 84.000 đ thành công, số dư điểm của tài khoản tăng thêm đúng 84 điểm.
2. Lịch sử điểm hiển thị đúng dòng giao dịch tương ứng với mã đơn vừa thanh toán.

---

## 3. Danh mục yêu cầu Planned (Sprint 3 và Sprint 4, Could)

Các chức năng thuộc Giai đoạn 2 và 3 chỉ phục vụ thiết kế kiến trúc, vẽ sơ đồ và đặc tả tài liệu trong đồ án Assignment 2 (không yêu cầu kiểm thử hay hiện thực mã nguồn ở Sprint 1 & 2):

| Mã FR | Tên chức năng Planned phía Frontend | Phân hệ giao diện | Sprint |
|:---:|---|---|:---:|
| `FR-11` | Ô nhập mã Voucher tại `/checkout`, hiển thị số tiền giảm và cảnh báo điều kiện | Khách hàng | 3 |
| `FR-12` | Nút "Hủy đơn hàng" (kèm popup chọn lý do hủy) cho đơn chưa pha chế | Khách hàng / Quầy | 3 |
| `FR-13` | Popup chấm sao đánh giá (1 đến 5 sao) và nhận xét cho đơn `COMPLETED` | Khách hàng | 3 |
| `FR-20` | Màn hình KDS (Kitchen Display System) cho Barista: nhận đơn, chuyển `PREPARING`, `READY` (Polling 5s) | Barista Portal | 3 |
| `FR-21` | Hiển thị mã nhận hàng 6 số (`pickupCode`) to rõ trên app khách; ô nhập đối chiếu mã của Cashier | Khách / Cashier | 3 |
| `FR-14` | Dashboard báo cáo thống kê doanh thu thực thu, số đơn hoàn tất, tỷ lệ hủy, biểu đồ Top 5 món | Manager Portal | 4 |
| `FR-15` | Màn hình Quản lý kho: danh sách nguyên liệu, lịch sử nhập kho có lưu vết nhân viên | Manager / Barista | 4 |
| `FR-16` | Giao diện cấu hình định lượng công thức pha chế theo món, kích cỡ và topping | Manager Portal | 4 |
| `FR-17` | Bảng hiển thị cảnh báo đỏ khi nguyên liệu trong kho chạm ngưỡng tồn tối thiểu | Manager Portal | 4 |
| `FR-18` | Bộ công cụ CRUD danh mục, món đồ uống, phụ thu size và giá topping lưu trữ CSDL | Manager Portal | 4 |
| `FR-19` | Giao diện quản lý nhân sự: tạo tài khoản nhân viên, gán vai trò (Barista/Cashier), khóa tài khoản | Manager Portal | 4 |

---

## 4. Yêu cầu phi chức năng (phần Giao diện Web)

| Mã | Phân nhóm | Tiêu chuẩn kỹ thuật | Ngưỡng kiểm chứng đo lường cụ thể |
|:---:|---|---|---|
| `NFR-01` | **Bảo mật Client**<br>*(Security)* | Đảm bảo an toàn dữ liệu, chống gian lận giá và bảo vệ phiên làm việc của khách hàng. | 1. **Zero Client Trust:** Không gửi bất kỳ trường giá tiền nào lên API tạo đơn; cấm người dùng sửa đổi giá ở DevTools.<br>2. **Không lưu số thẻ:** Tuyệt đối không lưu số thẻ tín dụng/ngân hàng thô vào `localStorage` hay Redux/Zustand store.<br>3. **Bảo vệ Token:** Token JWT chỉ lưu trong store client có mã hóa phiên, gắn tự động qua `Authorization` header.<br>4. **Không lộ Secret:** Không cấu hình bất kỳ secret backend hay API key nhạy cảm nào trong mã nguồn web (`NEXT_PUBLIC_*`). |
| `NFR-03` | **Chất lượng Mã nguồn**<br>*(Maintainability)* | Tuân thủ tiêu chuẩn kỹ thuật phần mềm, sẵn sàng cho CI/CD tự động. | 1. **TypeScript Strict:** Kiểm tra toàn bộ codebase không có lỗi biên dịch TypeScript (`tsc --noEmit`).<br>2. **Linting sạch:** Vượt qua bộ kiểm tra cú pháp và quy chuẩn `oxlint` / `eslint` không có lỗi nghiêm trọng.<br>3. **CI Pipeline:** Mọi Pull Request vào nhánh `main` phải vượt qua các bước kiểm tra tự động trước khi được phép merge. |
| `NFR-04` | **Khả dụng & Mobile-First**<br>*(Usability & Accessibility)* | Thiết kế tối ưu hàng đầu cho màn hình điện thoại thông minh và hỗ trợ đa trạng thái. | 1. **Độ phân giải di động:** Giao diện hiển thị hoàn hảo trên kích thước màn hình từ $360\text{px}$ đến $430\text{px}$ (iPhone SE đến iPhone Pro Max), không phát sinh thanh cuộn ngang (*Horizontal Scroll*).<br>2. **Chuẩn 3 trạng thái giao diện:** Mọi màn hình đọc dữ liệu từ server (Menu, Đơn hàng) đều phải cài đặt đủ: *Skeleton Loading*, *Empty State*, và *Error & Retry*.<br>3. **Kích thước vùng bấm (Touch Target):** Các nút bấm chính, radio, checkbox có diện tích tiếp xúc tối thiểu $44 \times 44\text{ px}$ theo khuyến nghị Apple HIG / Android Material.<br>4. **Tương phản màu sắc:** Tỷ lệ tương phản chữ và nền đạt chuẩn tối thiểu WCAG 2.1 AA ($\ge 4.5:1$). |
| `NFR-05` | **Hiệu năng Giao diện**<br>*(Performance)* | Tối ưu thời gian tải trang và tốc độ phản hồi thao tác mượt mà trên môi trường di động. | 1. **First Contentful Paint (FCP):** $\le 1.5\text{ giây}$ trên đường truyền mạng di động 4G chuẩn.<br>2. **Total Blocking Time (TBT):** $\le 200\text{ ms}$ đảm bảo trang không bị đơ giật.<br>3. **Phản hồi tương tác:** Thao tác đổi size/topping trên Modal cập nhật giá tức thì $\le 50\text{ ms}$.<br>4. **Thời gian hoàn tất luồng:** Khách thao tác từ duyệt menu đến đặt và thanh toán xong trong vòng $\le 60\text{ giây}$ khi API đã sẵn sàng (Mục tiêu `G1`); không tính thời gian khởi động chậm của gói miễn phí (xem `RSK-08`). |

---

## 5. Kế hoạch kiểm thử Frontend (Testing Criteria)

Tài liệu này là căn cứ trực tiếp để QA (`TaiTran263`) thiết lập bộ kiểm thử tự động phục vụ nghiệm thu đồ án Assignment 2 (mục 7.2):

### 5.1. Unit Test & Store Test (Vitest / React Testing Library)
1. **Kiểm thử Zustand Cart Store:**
   - Thêm 1 ly Cà phê phin Size S $\rightarrow$ Giỏ hàng có 1 phần tử, `quantity = 1`.
   - Thêm tiếp 1 ly Cà phê phin Size S $\rightarrow$ Giỏ hàng vẫn có 1 phần tử, `quantity = 2`.
   - Thêm 1 ly Cà phê phin Size M $\rightarrow$ Giỏ hàng tách thành 2 phần tử riêng biệt.
   - Thử nghiệm tăng/giảm số lượng và xóa món khỏi giỏ hàng.
2. **Kiểm thử logic tính giá tạm tính:**
   - Hàm tính đơn giá với base price 29.000 đ, Size M (+5.000 đ), Topping Trân châu (+8.000 đ) $\rightarrow$ Trả về chính xác 42.000 đ.
3. **Kiểm thử Validation Regex SĐT:**
   - Chuỗi `0901234567` $\rightarrow$ Hợp lệ (`true`).
   - Chuỗi `012345678` (9 số) $\rightarrow$ Không hợp lệ (`false`).
   - Chuỗi `090123456a` (chứa chữ) $\rightarrow$ Không hợp lệ (`false`).

### 5.2. Component Test
1. **ProductCard:** Kiểm tra khi truyền `isAvailable: false` $\rightarrow$ DOM xuất hiện nhãn text "Hết hàng" và nút thêm bị vô hiệu hóa.
2. **ProductDetailModal:** Kiểm tra mở modal render đúng Size S mặc định, click checkbox Topping kích hoạt cập nhật text tổng tiền.
3. **Empty & Error State:** Mock API trả lỗi $\rightarrow$ Màn hình hiển thị đúng banner báo lỗi và nút Retry.

### 5.3. End-to-End Test (Playwright / Cypress)
Kịch bản tự động hóa luồng nghiệp vụ khách hàng từ đầu đến cuối (*End-to-End User Flow*):
1. Truy cập trang chủ `/` $\rightarrow$ Kiểm tra danh sách món xuất hiện.
2. Click vào món cà phê đầu tiên $\rightarrow$ Modal mở ra.
3. Chọn Size M, tick Topping Trân châu đen $\rightarrow$ Nhấn "Thêm vào giỏ hàng".
4. Mở trang Giỏ hàng `/cart` $\rightarrow$ Kiểm tra đúng món, size, topping và tổng tiền tạm tính.
5. Nhấn "Tiến hành đặt hàng" $\rightarrow$ Modal Auth xuất hiện.
6. Bấm nút Demo điền tài khoản mẫu $\rightarrow$ Đăng nhập thành công, chuyển hướng đến `/checkout`.
7. Tại `/checkout`, chọn phương thức Thẻ ngân hàng, nhấn "Thanh toán ngay".
8. Kiểm tra chuyển hướng thành công đến trang `/order-success` với mã đơn hàng và trạng thái `PAID`.
