# Bản Đặc Tả Luồng Hoạt Động End-to-End — Activity-01 (Task 2.1)

> **Dự án:** Ứng dụng đặt cà phê không tiền mặt BrewLite  
> **Môn học:** Công nghệ phần mềm — Học kỳ 1, Năm học 2026–2027  
> **Mã sơ đồ:** `Activity-01` | **Mã Issue:** `[D2.1a] #39` (Phụ trách Issue Backlog `#03` — Task 2.1)  
> **Người thực hiện:** **Trần Quốc Tài (`TaiTran263`)**  
> **Người duyệt:** **Nguyễn Thành Long (`Longcodepro`)**  
> **Tài liệu đối chiếu và tham chiếu:**
> - `docs/diagrams/usecase-overview.puml` (Sơ đồ Use Case tổng quát `UseCase-01` — Issue #37 `[D1.2d]`)
> - `docs/requirements/context-and-scope.md` (Bối cảnh, Stakeholder, Mục 3.1 Luồng khách End-to-End — Issue #33)
> - `docs/requirements/requirements-web.md` (`FR-01`, `FR-02`, `FR-03`, `FR-07`, `NFR-01`, `NFR-03`)
> - `docs/requirements/requirements-api.md` (`FR-04`, `FR-05`, `FR-06`, `FR-08`, `NFR-02`, `NFR-04`)
> - `docs/architecture/api-contract.md` (`GET /products`, `POST /auth/login`, `POST /auth/register`, `POST /orders`, `POST /payments`)

---

## 1. Mục Tiêu & Sự Tương Thích Tuyệt Đối Với Sơ Đồ Use Case

Sơ đồ **`Activity-01`** mô hình hóa toàn diện luồng nghiệp vụ **End-to-End (từ duyệt thực đơn đến thanh toán và nhận món)** của khách hàng trong hệ thống BrewLite. Sơ đồ này hiện thực hóa trực tiếp các Use Case thuộc phân hệ Khách hàng trên sơ đồ Use Case tổng quát (`UseCase-01`):

1. **`UC-01: Xem menu sản phẩm`**: Tải thực đơn từ máy chủ, hiển thị lưới thẻ sản phẩm trên giao diện di động (*Mobile-First*), hỗ trợ xử lý trạng thái chờ tải và phát hiện món hết hàng/hết nguyên liệu.
2. **`UC-02: Xem chi tiết & tùy chọn món`**: Mở Modal chi tiết cho phép khách tùy chọn kích cỡ (S/M/L với đơn giá riêng từng món theo cấu hình quản lý), chọn Topping, mức đường, mức đá, độ nóng/lạnh và nhập yêu cầu riêng. Tính toán lại đơn giá thời gian thực.
3. **`UC-03: Quản lý giỏ hàng`**: Quản lý giỏ hàng phía Client bằng Zustand Store (đồng bộ `localStorage`), hỗ trợ tăng/giảm số lượng (tối đa 99 ly/dòng), xóa món và chọn phương thức nhận (**"Mang về"** hoặc **"Tại quán"**).
4. **`UC-04: Đăng ký / Đăng nhập tài khoản`**: Khách hàng đăng ký hoặc đăng nhập bằng **Số điện thoại Việt Nam và mật khẩu**, nhận chuỗi `JWT Access Token` (hạn 24 giờ).
5. **`UC-10: Áp dụng mã khuyến mãi`**: Khách hàng có thể nhập mã giảm giá Voucher khi xác nhận đặt hàng.
6. **`UC-05: Đặt hàng & thanh toán`**:
   - Đính kèm header **`Idempotency-Key`** (chống trừ tiền lặp lại do mạng lag).
   - Server-side Pricing độc quyền tại backend (chống gian lận giá client).
   - Kiểm tra tồn kho nguyên liệu trong cùng Database Transaction (ACID).
   - Thanh toán mô phỏng qua 3 kênh: Thẻ ngân hàng (`CARD`), Ví điện tử (`WALLET`), Chuyển khoản QR (`TRANSFER`).
   - Xử lý hai nhánh:
     - **Thanh toán thất bại** (mô phỏng thẻ đuôi `99` hoặc ví không đủ số dư): Rollback, không tạo đơn, không trừ nguyên liệu, giữ nguyên giỏ hàng để khách thử lại phương thức khác.
     - **Thanh toán thành công**: Trừ nguyên liệu kho, tạo đơn hàng trạng thái `PAID`, sinh **Mã nhận đồ uống 6 chữ số** ngẫu nhiên duy nhất, xóa giỏ hàng.
7. **Tiếp nối `UC-06 & UC-07`**: Chuyển giao sang màn hình theo dõi tiến độ đơn hàng (`UC-06`) và đến quầy đọc mã 6 số để nhận đồ uống (`UC-07`).

---

## 2. Quy Ước 5 Làn Bơi (Swimlanes) Phân Định Trách Nhiệm

| STT | Swimlane | Đối tượng đại diện | Vai trò và nhiệm vụ cốt lõi trong luồng |
|:---:|---|---|---|
| **1** | **Khách hàng (Customer)** | Tác nhân chính (Actor) | Truy cập ứng dụng, chọn món, tùy biến size/topping, quản lý giỏ hàng, xác thực tài khoản SĐT, chọn hình thức thanh toán và nhận mã 6 số. |
| **2** | **Next.js Web (Client)** | Phân hệ giao diện Web | Render Skeleton loading, quản lý Modal tùy chọn, tính giá tạm tính, quản lý Zustand Store (`localStorage`), sinh `Idempotency-Key`, điều hướng giao diện. |
| **3** | **NestJS API (Server)** | Máy chủ Backend | Tiếp nhận HTTP Request, xác thực JWT Guard, tính toán lại giá độc quyền (Server-side Pricing), điều phối Database Transaction và gọi Payment Gateway. |
| **4** | **PostgreSQL (Database)** | Cơ sở dữ liệu quan hệ | Truy vấn thực đơn (`Product`), xác thực người dùng (`User`), kiểm tra và trừ tồn kho nguyên liệu (`Inventory`), lưu bản ghi `Order` và `Payment`. |
| **5** | **Cổng thanh toán (Payment Gateway)** | Hệ thống bên ngoài (Mô phỏng) | Tiếp nhận yêu cầu thanh toán mô phỏng, phản hồi kết quả thành công (`PAYMENT_SUCCESS`) hoặc thất bại (`PAYMENT_REJECTED` khi thẻ đuôi `99`). |

---

## 3. Diễn Giải Chi Tiết 5 Giai Đoạn Luồng Nghiệp Vụ

### Giai đoạn 1: UC-01 — Xem menu sản phẩm
1. Khách hàng truy cập ứng dụng web BrewLite trên trình duyệt di động hoặc máy tính.
2. `Next.js Web` khởi tạo trang chủ, hiển thị hiệu ứng khung xương nhấp nháy (*Skeleton Loading State*) nhằm đáp ứng tiêu chuẩn `NFR-03` (không để màn hình trắng khi chờ dữ liệu).
3. `Next.js Web` gửi yêu cầu HTTP `GET /products` sang backend.
4. `NestJS API` tiếp nhận request, gọi `PrismaService` truy vấn dữ liệu từ bảng `Product`.
5. `PostgreSQL` thực thi `SELECT * FROM "Product" WHERE "isAvailable" = true;` và trả về danh sách đồ uống kèm thông tin giá theo từng size và trạng thái bán.
6. `NestJS API` phản hồi `HTTP 200 OK` kèm JSON danh sách món (đáp ứng `NFR-01` thời gian phản hồi $\le 300\text{ ms}$).
7. `Next.js Web` render danh sách thành lưới các thẻ sản phẩm (*Product Card Grid* phân theo danh mục: Cà phê phin, Espresso, Cold Brew...).
8. Khách hàng duyệt menu và chọn 1 món đồ uống:
   - **Nhánh hết hàng:** Nếu món tạm ngưng phục vụ hoặc hết sản lượng/nguyên liệu, giao diện hiển thị nhãn xám "Hết hàng" (Sold Out) và vô hiệu hóa nút bấm. Khách hàng chọn món khác.
   - **Nhánh còn hàng:** Tiếp tục mở Modal chi tiết món (`UC-02`).

### Giai đoạn 2: UC-02 — Xem chi tiết & tùy chọn món
9. `Next.js Web` mở Modal Chi tiết & Tùy chọn món (mặc định chọn sẵn **Size S** và **0 topping**).
10. Khách hàng thực hiện tùy biến:
    - Chọn kích cỡ (S / M / L) với **đơn giá riêng do quán cấu hình cho từng món** (không dùng phụ thu cố định).
    - Tick chọn 0, 1 hoặc nhiều loại Topping (Trân châu đen, Kem cheese, Thạch cà phê...).
    - Chọn mức đường, mức đá, độ nóng/lạnh phù hợp cấu hình món.
    - Nhập ghi chú yêu cầu riêng (nếu có).
11. `Next.js Web` tự động tính toán lại đơn giá ly nước theo thời gian thực:
    $$\text{Đơn giá 1 ly} = \text{Giá Size đã chọn} + \sum (\text{Đơn giá các Topping đã tick})$$

### Giai đoạn 3: UC-03 — Quản lý giỏ hàng
12. Khách hàng bấm nút **"Thêm vào giỏ hàng"**.
13. `Next.js Web` nhóm các món đồng nhất hoặc tạo dòng mới trong Zustand Cart Store (đồng bộ vào `localStorage`). Khống chế tối đa 99 ly trên mỗi dòng món.
14. Badge đếm tổng số ly trên Navbar tự động cập nhật, đồng thời hiển thị thông báo Toast thêm giỏ thành công.
15. Khách hàng bấm biểu tượng Giỏ hàng trên thanh điều hướng để mở trang `/cart`.
16. `Next.js Web` hiển thị chi tiết từng món trong giỏ, số lượng, tùy chọn và tổng tiền tạm tính.
17. Khách hàng tăng/giảm số lượng nếu cần, chọn hình thức nhận hàng: **"Mang về"** hoặc **"Tại quán"**, rồi bấm **"Tiến hành Đặt hàng"**.

### Giai đoạn 4: UC-04 — Đăng ký / Đăng nhập tài khoản (UC-05 `<<include>>` UC-04)
18. `Next.js Web` kiểm tra trạng thái xác thực trong Zustand Auth Store:
    - **Nếu đã có JWT Token hợp lệ:** Bỏ qua bước đăng nhập, chuyển thẳng sang màn hình Đặt hàng & Thanh toán.
    - **Nếu chưa đăng nhập:**
      - `Next.js Web` mở Modal Đăng nhập / Đăng ký tài khoản (`UC-04`).
      - Khách hàng nhập **Số điện thoại Việt Nam (10 chữ số)** và **Mật khẩu**; bấm "Đăng nhập" (hoặc chuyển tab "Đăng ký").
      - `Next.js Web` gửi request `POST /auth/login` (hoặc `POST /auth/register`).
      - `NestJS API` kiểm tra hợp lệ DTO, truy vấn thông tin User trong `PostgreSQL`.
      - `NestJS API` xác thực mật khẩu qua `bcrypt.compare`, ký cấp chuỗi `JWT Access Token` (thời hạn 24 giờ).
      - `NestJS API` phản hồi `HTTP 200 OK` kèm `accessToken`.
      - `Next.js Web` lưu `accessToken` vào Auth Store & gắn Axios header `Authorization: Bearer <token>`, cập nhật thông tin tài khoản trên Navbar và tự động đóng Modal.

### Giai đoạn 5: UC-05 — Đặt hàng & thanh toán (Gộp một bước checkout)
19. `Next.js Web` hiển thị màn hình Xác nhận đơn hàng và chọn kênh thanh toán.
20. Khách hàng:
    - Chọn 1 trong 3 hình thức thanh toán mô phỏng: **Thẻ ngân hàng (`CARD`)**, **Ví điện tử (`WALLET`)**, hoặc **Chuyển khoản QR (`TRANSFER`)**.
    - *(Tùy chọn — `UC-10`)* Nhập mã khuyến mãi Voucher (nếu có).
    - Bấm nút **"Xác nhận Thanh toán"**.
21. `Next.js Web` sinh mã UUID duy nhất đính kèm vào header **`Idempotency-Key`** (`RSK-02`), gửi HTTP Request `POST /orders/checkout` lên máy chủ.
22. `NestJS API` tiếp nhận request:
    - Xác thực JWT Token qua `JwtAuthGuard`.
    - Kiểm tra tính duy nhất của `Idempotency-Key` (nếu trùng lặp request đang xử lý thì trả về kết quả trước đó).
    - **Server-side Pricing:** Tự động truy vấn giá từ Database để tính toán lại tổng tiền độc quyền, loại bỏ mọi trường giá từ client gửi lên (`RSK-03`).
    - Khởi tạo **Database Transaction (ACID)**.
23. `PostgreSQL` kiểm tra định mức nguyên liệu tồn kho cho tất cả các món trong đơn hàng:
    - **Nhánh thiếu nguyên liệu:**
      - `NestJS API` ROLLBACK Transaction, từ chối tạo đơn, trả về mã lỗi `HTTP 409 Conflict` ("Hết nguyên liệu pha chế").
      - `Next.js Web` hiển thị thông báo món tạm hết nguyên liệu, **giữ nguyên giỏ hàng** để khách hàng điều chỉnh lại món.
    - **Nhánh đủ nguyên liệu:** `NestJS API` tiếp tục gửi yêu cầu trừ tiền sang Cổng thanh toán mô phỏng.
24. `Cổng thanh toán (Payment Gateway)` tiếp nhận yêu cầu và xử lý theo quy tắc mô phỏng:
    - **Nhánh Thanh toán Thất bại** *(Thẻ ngân hàng có 2 số cuối là `99` hoặc Số dư ví điện tử không đủ):*
      - Cổng thanh toán trả về trạng thái từ chối `PAYMENT_REJECTED`.
      - `NestJS API` **ROLLBACK Database Transaction**; **tuyệt đối không tạo đơn hàng, không trừ nguyên liệu kho**; trả về mã `HTTP 402 Payment Required`.
      - `Next.js Web` hiển thị cảnh báo lỗi thanh toán màu đỏ; **giữ nguyên toàn bộ giỏ hàng**.
      - Khách hàng chọn đổi phương thức thanh toán khác (ví dụ: chuyển từ Thẻ sang Ví điện tử hoặc Chuyển khoản QR) và bấm thử lại thanh toán.
    - **Nhánh Thanh toán Thành công** *(Thẻ hợp lệ khác đuôi 99, Ví điện tử hoặc Chuyển khoản QR):*
      - Cổng thanh toán trả về trạng thái thành công `PAYMENT_SUCCESS`.
      - `NestJS API` trừ định mức tồn kho nguyên liệu trong Transaction.
      - `NestJS API` tạo bản ghi `Order` với trạng thái **`PAID`**, loại đơn (Mang về / Tại quán), và sinh **Mã nhận đồ uống 6 chữ số** ngẫu nhiên duy nhất (ví dụ: `839201`).
      - `NestJS API` ghi nhận bản ghi `Payment` với trạng thái `SUCCESS`.
      - `PostgreSQL` **COMMIT Database Transaction** (đảm bảo tính toàn vẹn tuyệt đối).
      - `NestJS API` phản hồi `HTTP 201 Created` kèm thông tin đơn hàng và mã 6 số.
      - `Next.js Web` **xóa sạch giỏ hàng** trong Zustand Store, chuyển hướng khách hàng sang màn hình thông báo Đặt hàng thành công, hiển thị nổi bật **Mã nhận đồ uống 6 chữ số** và mã QR đối chiếu tại quầy.
25. **Tiếp nối `UC-06` & `UC-07`:** Khách hàng theo dõi tiến độ pha chế của đơn hàng trên ứng dụng (`UC-06`); khi đồ uống sẵn sàng, khách hàng đến quầy đọc hoặc đưa mã 6 số cho nhân viên nhận món (`UC-07`). Kết thúc luồng (`stop`).

---

## 4. Bảng Phân Tích Các Điểm Rẽ Nhánh Điều Kiện (Decision Nodes)

Để thỏa mãn 100% tiêu chí chấp nhận của Task 2.1 trong Backlog, 4 nút rẽ nhánh điều kiện cốt lõi được đặc tả rõ ràng như sau:

| STT | Nút rẽ nhánh (Decision Node) | Điều kiện kiểm tra | Nhánh xử lý | Kết quả thực thi hệ thống |
|:---:|---|---|---|---|
| **1** | **Tình trạng món đồ uống**<br>*(Tại UC-01 Menu)* | `isAvailable == false` hoặc hết định mức | **Hết hàng** | Hiển thị nhãn xám "Hết hàng", vô hiệu hóa chọn món. Khách chọn món khác. |
| | | `isAvailable == true` và còn định mức | **Còn hàng** | Cho phép bấm chọn, mở Modal tùy biến size và topping (`UC-02`). |
| **2** | **Trạng thái phiên xác thực**<br>*(Tại UC-04 Auth)* | `hasAccessToken == false` | **Chưa đăng nhập** | Mở Modal Auth, yêu cầu nhập SĐT + Mật khẩu, xác thực bcrypt, cấp JWT mới được đặt hàng. |
| | | `hasAccessToken == true` | **Đã đăng nhập** | Bỏ qua bước xác thực, chuyển thẳng sang màn hình Checkout (`UC-05`). |
| **3** | **Kiểm tra tồn kho nguyên liệu**<br>*(Tại UC-05 Transaction)* | Không đủ nguyên liệu pha chế | **Thiếu nguyên liệu** | Rollback transaction, HTTP 409, giữ nguyên giỏ hàng để khách đổi món. |
| | | Đủ nguyên liệu tồn kho | **Đủ nguyên liệu** | Duy trì transaction, chuyển tiếp yêu cầu sang Cổng thanh toán mô phỏng. |
| **4** | **Kết quả thanh toán mô phỏng**<br>*(Tại UC-05 Payment)* | Thẻ có 2 số cuối `99` hoặc số dư ví thiếu | **Thanh toán thất bại** | Cổng thanh toán từ chối, Rollback transaction, **không tạo đơn, không trừ kho**, giữ nguyên giỏ hàng để khách đổi phương thức. |
| | | Thẻ hợp lệ, Ví điện tử, Chuyển khoản QR | **Thanh toán thành công** | Trừ kho, tạo đơn `PAID`, sinh mã 6 số, Commit transaction, xóa giỏ hàng, hiển thị thành công. |

---

## 5. Các Cơ Chế Kỹ Thuật & Bảo Vệ Cốt Lõi Được Tích Hợp

1. **Khóa chống gửi trùng (`Idempotency-Key`):**
   - Client tự động sinh UUID phiên bản 4 cho mỗi lần bấm "Xác nhận Thanh toán", đính kèm qua HTTP Header `Idempotency-Key`.
   - Nếu mạng lag hoặc khách bấm nhiều lần, Backend kiểm tra key và chỉ xử lý thanh toán đúng 1 lần duy nhất (`RSK-02`).
2. **Định giá độc quyền phía máy chủ (Server-side Pricing):**
   - Frontend chỉ gửi danh sách mã món (`productId`), `size`, và mảng mã topping (`toppings`).
   - Backend truy vấn trực tiếp bảng giá trong PostgreSQL để tính tổng tiền; loại bỏ mọi trường giá từ client nhằm chống triệt để gian lận sửa giá trên trình duyệt (`RSK-03`).
3. **Giao dịch nguyên tử (ACID Database Transaction):**
   - Các thao tác: Kiểm tra tồn kho nguyên liệu $\rightarrow$ Trừ tồn kho $\rightarrow$ Tạo bản ghi đơn hàng `Order` $\rightarrow$ Lưu lịch sử thanh toán `Payment` được thực thi trong cùng một transaction.
   - Bất kỳ lỗi nào (kể cả lỗi thanh toán từ chối) đều kích hoạt Rollback toàn bộ, đảm bảo không bao giờ xảy ra tình trạng "đã trừ kho nhưng đơn chưa thanh toán" hoặc ngược lại.
4. **Mã nhận đồ uống 6 chữ số (Pickup Code):**
   - Thay thế việc in hóa đơn giấy truyền thống bằng mã 6 số ngẫu nhiên duy nhất (ví dụ: `839201`), đối chiếu hai chiều giữa Khách hàng (`UC-07`) và Nhân viên quầy/Pha chế (`UC-12`).

---

## 6. Sơ Đồ Hoạt Động Trực Quan (Activity Diagram)

Sơ đồ chi tiết bằng PlantUML đã được đồng bộ hóa toàn diện với sơ đồ Use Case tổng quan:

![Sơ đồ Activity-01](./activity-01-menu-cart-auth.svg)

* **Tệp mã nguồn PlantUML:** [`activity-01-menu-cart-auth.puml`](./activity-01-menu-cart-auth.puml)
* **Tệp ảnh vector SVG:** [`activity-01-menu-cart-auth.svg`](./activity-01-menu-cart-auth.svg)
