# Đặc tả Use-Case trọng tâm: Đặt hàng và thanh toán không dùng tiền mặt (Task 1.3)

> **Dự án:** Hệ thống đặt cà phê và đồ uống trực tuyến BrewLite  
> **Môn học:** Công nghệ phần mềm — Học kỳ 1, năm học 2026–2027  
> **Nhóm thực hiện:**  
> - **Nguyễn Thành Long (`Longcodepro`)** — Backend, Scrum Master, DevOps  
> - **Trần Quốc Tài (`TaiTran263`)** — Frontend UI/UX, Quản trị trạng thái Client, QA  
>  
> **Mã tạo phẩm:** `docs/requirements/use-case-checkout.md`  
> **Issue quản lý:** [D1.3] Đặc tả use-case UC-05 "Đặt hàng và thanh toán" #38  
> **Sơ đồ liên kết:** [`docs/diagrams/usecase-checkout.puml`](../diagrams/usecase-checkout.puml) (Ảnh vector: [`usecase-checkout.svg`](../diagrams/usecase-checkout.svg))  
> **Tài liệu đối chiếu:** `docs/requirements/context-and-scope.md`, `docs/requirements/requirements-web.md`, `docs/traceability-matrix.md`

---

## 1. Thông tin tổng quan Use-Case

| Thuộc tính | Chi tiết đặc tả |
|---|---|
| **Tên Use-Case** | **Đặt hàng và thanh toán không dùng tiền mặt** *(Checkout & Cashless Payment)* |
| **Mã định danh** | **UC-05** *(Theo danh mục 21 UC SSOT; tương ứng với Use-case trọng tâm Task 1.3 của đề bài)* |
| **Mức độ ưu tiên** | **MUST HAVE** *(Theo chuẩn MoSCoW — Nghiệp vụ sống còn của MVP)* |
| **Phân hệ** | Phân hệ Bán hàng & Xử lý Giao dịch *(Order & Payment Subsystem)* |
| **Mục tiêu nghiệp vụ** | Cho phép khách hàng xem lại giỏ hàng, chọn phương thức thanh toán điện tử (Thẻ / Ví); hệ thống tính giá an toàn phía server (Server-side Pricing), trừ tiền mô phỏng và lưu vết đơn hàng mà không cần nhân viên thu ngân thủ công. |

---

## 2. Các tác nhân tham gia (Actors)

1. **Tác nhân chính (Primary Actor):**
   - **Khách hàng (Customer):** Người dùng thao tác trực tiếp trên trình duyệt Web/PWA di động, có nhu cầu đặt thức uống và thanh toán nhanh chóng bằng phương thức không tiền mặt.
2. **Tác nhân phụ / Hỗ trợ (Supporting / Secondary Actors):**
   - **Cổng thanh toán mô phỏng (Payment Gateway - Mock External System):** Hệ thống dịch vụ ngoài mô phỏng tiếp nhận yêu cầu thanh toán (Thẻ ngân hàng hoặc Ví điện tử), thực hiện phê duyệt giao dịch (`PAYMENT_SUCCESS`) hoặc từ chối giao dịch (`PAYMENT_FAILED`) theo kịch bản kiểm thử.
   - **Nhân viên Pha chế / Quầy (Barista / Cashier):** Tiếp nhận đơn hàng sau khi khách thanh toán thành công để thực hiện pha chế và bàn giao thức uống theo mã đơn hàng (hoặc mã nhận hàng 6 số ở Sprint 3 Planned).

---

## 3. Sự kiện kích hoạt (Trigger)

- Khách hàng nhấn nút **"Tiến hành Đặt hàng"** trên trang Giỏ hàng (`/cart`) hoặc nút **"Xác nhận Thanh toán"** trên màn hình Checkout (`/checkout`).

---

## 4. Tiền điều kiện (Preconditions)

1. Khách hàng đã truy cập ứng dụng Web BrewLite trên thiết bị (Mobile Browser hoặc Desktop).
2. Giỏ hàng trên Client (`Zustand Cart Store` / `localStorage`) có **ít nhất một món đồ uống hợp lệ** (số lượng $\ge 1$, đã cấu hình kích cỡ Size S/M/L).
3. Hệ thống Backend NestJS API và cơ sở dữ liệu PostgreSQL đang hoạt động bình thường (Endpoint `GET /health` trả về HTTP 200 OK).

---

## 5. Hậu điều kiện (Postconditions)

### 5.1. Khi giao dịch thành công (Success End Condition)
- Bản ghi đơn hàng mới được tạo trong bảng `Order` với trạng thái `PAID`, phiên bản `version = 1`.
- Toàn bộ danh sách ly (kèm size, topping, phụ thu) được lưu vào bảng `OrderItem`.
- Bản ghi giao dịch trong bảng `Payment` được lưu với trạng thái `SUCCESS` kèm mã giao dịch `transactionId`.
- Khách hàng được tự động **cộng điểm tích lũy thưởng** theo tỷ lệ: **1 điểm / 1.000 VNĐ thực trả** (`UC-20`).
- Giỏ hàng của khách hàng trên trình duyệt (`Zustand Store` & `localStorage`) được xóa sạch hoàn toàn.
- Khách hàng được chuyển hướng sang trang xác nhận đơn hàng thành công (`/order-success`), tự động kích hoạt tiến trình Polling 5s/lần để theo dõi trạng thái đơn (`UC-06`).

### 5.2. Khi giao dịch thất bại (Failure End Condition)
- Đơn hàng được chuyển sang trạng thái `PAYMENT_FAILED` (API trả `201` kèm `status: "PAYMENT_FAILED"`, không phải lỗi HTTP); bản ghi `Payment` trạng thái `FAILED` được lưu. Khách được thanh toán lại cùng đơn (`PAYMENT_FAILED` → `PAID`).
- Không có bất kỳ khoản tiền nào bị trừ, không có điểm tích lũy nào được cấp phát.
- **Giữ nguyên 100% giỏ hàng** của khách hàng trên trình duyệt, không làm mất danh sách món và tùy chọn đã cấu hình.
- Hiển thị thông báo giải thích nguyên nhân lỗi cụ thể và cung cấp tùy chọn cho phép khách hàng đổi phương thức thanh toán hoặc thử lại.

---

## 6. Sơ đồ Use-Case phạm vi trọng tâm (Diagram Reference)

Sơ đồ PlantUML chi tiết thể hiện đầy đủ các quan hệ phụ thuộc `<<include>>`, `<<extend>>` và hai Actor chính/phụ được lưu tại:  
👉 **Tệp nguồn:** [`docs/diagrams/usecase-checkout.puml`](../diagrams/usecase-checkout.puml)  
👉 **Ảnh vector:** [`docs/diagrams/usecase-checkout.svg`](../diagrams/usecase-checkout.svg)

```
       +-----------------------+                    +------------------------------------+
       | Khách hàng (Customer) |                    | Cổng thanh toán (Payment Gateway)  |
       +-----------+-----------+                    +-----------------+------------------+
                   |                                                  |
                   |                Hệ thống BrewLite                 |
                   |         +-----------------------------+          |
                   +-------->| UC-05: Đặt hàng & thanh toán|<---------+
                             +--------------+--------------+
                                            |
                 +--------------------------+--------------------------+
                 | <<include>>                                         | <<extend>>
                 | (khi chưa đăng nhập)                                | (Sprint 3, Planned)
                 v                                                     v
       +-------------------+                                 +--------------------+
       | UC-04: Đăng nhập  |                                 | UC-10: Áp voucher  |
       | bằng Số điện thoại|                                 | giảm giá khuyến mãi|
       +-------------------+                                 +--------------------+

  Tiếp nối sau UC-05 (không phải include):
    - UC-20: tích điểm khi thanh toán thành công
    - UC-06: theo dõi đơn bằng polling 5 giây
```

---

## 7. Luồng sự kiện chính (Main Flow - Happy Path)

| Bước | Hành động của Khách hàng (Actor) | Phản hồi của Hệ thống (BrewLite System) |
|:---:|---|---|
| **1** | Tại màn hình Giỏ hàng (`/cart`), khách hàng xem lại danh sách món, tùy chọn size/topping, số lượng và số tiền tạm tính; sau đó bấm **"Tiến hành Đặt hàng"**. | Hệ thống kiểm tra phiên đăng nhập của người dùng. |
| **2** | *(Người dùng đã đăng nhập từ trước, đã có JWT token hợp lệ trong Store).* | Hệ thống chuyển hướng khách hàng sang màn hình Thanh toán (`/checkout`). |
| **3** | Khách hàng xem lại tóm tắt giỏ hàng tại màn hình Checkout. | Hệ thống hiển thị danh mục phương thức thanh toán không tiền mặt. |
| **4** | Khách hàng lựa chọn phương thức thanh toán không tiền mặt: **Thẻ ngân hàng** (`CARD`) hoặc **Ví điện tử** (`WALLET`). | Hệ thống hiển thị các trường nhập thông tin tương ứng của phương thức đã chọn. |
| **5** | Khách hàng kiểm tra tóm tắt đơn hàng lần cuối và bấm nút **"Xác nhận Thanh toán"**. | Giao diện Next.js sinh mã UUID làm giá trị cho header `Idempotency-Key`, vô hiệu hóa nút bấm để chống gửi trùng lặp; gửi request `POST /orders` kèm payload danh sách món (chỉ gửi `productId`, `size`, `toppings`, `quantity`; **tuyệt đối không gửi giá tiền**). |
| **6** | — | **NestJS API** xác thực JWT qua `JwtAuthGuard`, kiểm tra `Idempotency-Key`. Thực hiện **Server-side Pricing**: truy vấn bảng giá gốc từ DB để tính tổng tiền chính xác. Tạo bản ghi `Order` với trạng thái `PENDING`, `version = 0`. Trả về `id` và `total` (HTTP 201 Created). |
| **7** | — | Giao diện Next.js tự động gửi tiếp request `POST /payments` chứa `orderId`, `method`, `cardNumber` (bắt buộc khi `CARD`, không được lưu lại) và header `Idempotency-Key`. |
| **8** | — | NestJS API tiếp nhận yêu cầu, gửi dữ liệu sang Cổng thanh toán mô phỏng. Cổng thanh toán kiểm tra quy tắc hợp lệ, thực hiện trừ tiền và trả về thông báo `PAYMENT_SUCCESS`. |
| **9** | — | NestJS API kích hoạt Database Transaction: cập nhật `Order` thành `PAID`, lưu bản ghi `Payment` trạng thái `SUCCESS`, cộng điểm thưởng thành viên theo tỷ lệ 1 điểm / 1.000đ (`UC-20`), sau đó COMMIT transaction. API trả về HTTP 201 Created kèm thông tin đơn hàng và điểm thưởng (`pointsEarned`). |
| **10** | Khách hàng nhìn thấy màn hình Đặt hàng thành công (`/order-success`) và bắt đầu theo dõi trạng thái đơn. | Giao diện xóa sạch giỏ hàng trong Zustand Store; thiết lập cơ chế Polling ngầm định kỳ 5 giây/lần gọi `GET /orders/me` để cập nhật trạng thái đơn hàng thời gian thực (`UC-06`). |

---

## 8. Các luồng thay thế (Alternative Flows)

### A1: Khách hàng chưa đăng nhập tài khoản (`<<include>> UC-04`)
- **Điểm rẽ:** Tại Bước 2 của Luồng chính, hệ thống phát hiện trong Auth Store chưa có JWT Access Token hợp lệ (hoặc token đã hết hạn).
- **Quy trình xử lý:**
  1. Giao diện hiển thị Modal Đăng nhập / Đăng ký tài khoản chặn giữa màn hình; giữ nguyên toàn bộ sản phẩm trong giỏ hàng.
  2. Khách hàng nhập **Số điện thoại** (định dạng 10 chữ số chuẩn Việt Nam, ví dụ `0901234567`) và Mật khẩu ($\ge 6$ ký tự).
  3. Khách hàng bấm "Đăng nhập" (hoặc chuyển sang tab "Đăng ký" nếu chưa có tài khoản).
  4. Hệ thống gọi API `POST /auth/login` (hoặc `POST /auth/register`), băm mật khẩu bằng `bcryptjs`, phát hành mã JSON Web Token (JWT) có thời hạn 24 giờ.
  5. Next.js lưu token vào Auth Store & `localStorage`, cập nhật tên người dùng lên Navbar và đóng Modal.
  6. Hệ thống tự động đưa khách hàng tiếp tục Bước 3 của Luồng chính mà không bắt khách hàng phải thao tác lại giỏ hàng.

### A2: Khách hàng áp dụng mã khuyến mãi giảm giá (`<<extend>> UC-10`) — (Sprint 3, Planned: chưa hiện thực ở MVP Sprint 1–2)
- **Điểm rẽ:** Tại Bước 3 của Luồng chính, trước khi xác nhận thanh toán.
- **Quy trình xử lý (dự kiến, tên endpoint chốt khi vào Sprint 3):**
  1. Khách hàng nhập mã khuyến mãi (ví dụ `BREW20`, `BANMOI`) vào ô nhập Voucher và bấm nút **"Áp dụng"**.
  2. Next.js gửi request kiểm tra mã khuyến mãi tới API kèm `code` và giá trị đơn hàng.
  3. NestJS API kiểm tra hạn sử dụng, số lượt dùng còn lại và giá trị đơn hàng tối thiểu.
  4. Nếu thỏa điều kiện, hệ thống trả về số tiền được khấu trừ; giao diện cập nhật hiển thị dòng: `Mã giảm giá: -X.000đ` và tự động trừ vào tổng tiền thanh toán hiển thị.
  5. Đơn hàng khi tạo ở Bước 6 sẽ được lưu kèm `voucherId` và số tiền thực trả sau giảm.

### A3: Khách hàng thay đổi phương thức thanh toán
- **Điểm rẽ:** Tại Bước 4 của Luồng chính.
- **Quy trình xử lý:** Khách hàng có thể chuyển đổi linh hoạt qua lại giữa "Thẻ ngân hàng" và "Ví điện tử". Giao diện tự động chuyển đổi giữa khung nhập thông tin số thẻ mô phỏng và số tài khoản ví mà không làm mới lại trang.

---

## 9. Các luồng ngoại lệ (Exception Flows)

### E1: Món trong giỏ hàng bị hết hàng / hết nguyên liệu (HTTP 409 Conflict)
- **Hoàn cảnh:** Tại Bước 6, trong lúc khách chuẩn bị thanh toán thì nhân viên quầy vừa đánh dấu món hết hàng (`isAvailable = false`) hoặc tồn kho nguyên liệu không đủ pha chế (kiểm tra tồn kho nguyên liệu chỉ có từ Sprint 4; ở MVP chỉ dùng cờ `isAvailable`).
- **Xử lý hệ thống:**
  1. NestJS API phát hiện sản phẩm không còn khả dụng, từ chối tạo đơn hàng và trả về mã lỗi `HTTP 409 Conflict` kèm thông báo: `Sản phẩm [Tên món] hiện đã hết hàng hoặc không đủ nguyên liệu phục vụ`.
  2. Giao diện Next.js hiển thị hộp thoại cảnh báo màu cam: *"Rất tiếc, một số món trong giỏ hàng vừa hết hàng."*
  3. **Tuyệt đối không xóa giỏ hàng.** Hệ thống đánh dấu nhãn "Hết hàng" trên món bị ảnh hưởng để khách hàng xóa hoặc đổi món khác.

### E2: Thanh toán bằng Thẻ thất bại — Quy tắc mô phỏng thẻ bị từ chối
- **Hoàn cảnh:** Tại Bước 8, khách hàng nhập thông tin thẻ mô phỏng có **4 chữ số cuối là `0000`** (kịch bản test cố định theo quy chuẩn môn học).
- **Xử lý hệ thống:**
  1. Cổng thanh toán mô phỏng nhận diện quy tắc đuôi `0000`, trả về kết quả từ chối giao dịch: `DECLINED - Insufficient Funds / Card Locked`.
  2. NestJS API cập nhật trạng thái đơn hàng thành `PAYMENT_FAILED`, lưu bản ghi Payment trạng thái `FAILED`.
  3. API trả về `201 Created` kèm `status: "PAYMENT_FAILED"` và `reason` (không phải lỗi HTTP).
  4. Next.js hiển thị thông báo lỗi màu đỏ nổi bật: *"Giao dịch thanh toán bằng thẻ không thành công. Thẻ của quý khách đã bị từ chối."*
  5. Đơn hàng được giữ ở trạng thái chờ thanh toán lại; hiển thị nút **"Thử lại"** và **"Đổi phương thức thanh toán khác"** để khách hàng thao tác tiếp mà không bị mất đơn.

### E3: Thanh toán bằng Ví điện tử vượt hạn mức giao dịch (Đơn > 500.000 VNĐ)
- **Hoàn cảnh:** Tại Bước 8, khách hàng chọn phương thức Ví điện tử nhưng tổng giá trị đơn hàng **vượt quá 500.000 VNĐ** (hạn mức tối đa một lần thanh toán qua ví mô phỏng).
- **Xử lý hệ thống:**
  1. Cổng thanh toán mô phỏng từ chối do vượt hạn mức giao dịch ví.
  2. NestJS API cập nhật trạng thái đơn hàng thành `PAYMENT_FAILED`.
  3. Giao diện hiển thị cảnh báo: *"Phương thức Ví điện tử chỉ hỗ trợ thanh toán cho đơn hàng dưới 500.000đ. Vui lòng chọn phương thức Thẻ ngân hàng."*

### E4: Client gửi trùng lặp yêu cầu do độ trễ mạng (Xử lý Idempotency-Key)
- **Hoàn cảnh:** Mạng chập chờn, khách hàng nhấn nút "Xác nhận Thanh toán" nhiều lần liên tiếp hoặc trình duyệt tự động retry request.
- **Xử lý hệ thống:**
  1. Client luôn gửi kèm header `Idempotency-Key: <UUID>` cho request tạo đơn và thanh toán. Header này **tùy chọn ở phía API** (1 đến 128 ký tự gồm chữ, số, `_`, `-`; sai định dạng trả 400; không gửi thì xử lý như bình thường). Phạm vi key: theo người dùng với `POST /orders`, theo đơn với `POST /payments`.
  2. Tại NestJS API, hệ thống tra cứu `Idempotency-Key` trong cơ sở dữ liệu (ràng buộc duy nhất):
     - Gửi lại cùng key (kể cả khi hai request đến cùng lúc): API luôn trả `201` với kết quả của lần đầu, **không thực hiện lại giao dịch trừ tiền hay tạo đơn thứ hai**. Không có lỗi 409 cho trường hợp này.
  3. Đảm bảo tính nhất quán tuyệt đối: Mỗi cú click chuột của khách chỉ sinh đúng duy nhất 1 đơn hàng và 1 giao dịch tài chính.

### E5: Xung đột dữ liệu đồng thời (Optimistic Concurrency Control)
- **Hoàn cảnh:** Trạng thái đơn hàng bị nhiều luồng tác động đồng thời (ví dụ hệ thống vừa nhận callback thanh toán thành công, trong khi khách bấm hủy đơn từ màn hình khác).
- **Xử lý hệ thống:**
  1. Bảng `Order` sử dụng trường `version: Int` để kiểm soát khóa lạc quan.
  2. Khi cập nhật trạng thái: `UPDATE "Order" SET status = 'PAID', version = version + 1 WHERE id = :id AND version = :expectedVersion`.
  3. Nếu số bản ghi cập nhật bằng 0 (xung đột version), hệ thống rollback transaction và ném lỗi `ConflictException` (HTTP 409) để đảm bảo toàn vẹn dữ liệu.

### E6: Phiên đăng nhập hết hạn giữa chừng (JWT Expired)
- **Hoàn cảnh:** Khách hàng mở sẵn giỏ hàng từ ngày hôm trước, token đăng nhập đã hết hạn 24 giờ.
- **Xử lý hệ thống:**
  1. Server từ chối request và trả về mã lỗi `HTTP 401 Unauthorized`.
  2. Bộ chặn Axios Interceptor trên Frontend bắt mã 401, xóa token cũ và tự động kích hoạt Modal Đăng nhập.
  3. Sau khi người dùng đăng nhập lại thành công, giao diện giữ nguyên giỏ hàng và tiếp tục quy trình thanh toán.

---

## 10. Các quy tắc an ninh và nghiệp vụ bắt buộc (Business Rules)

| Mã | Tên quy tắc nghiệp vụ | Diễn giải chi tiết kỹ thuật |
|:---:|---|---|
| **BR-01** | **Server-side Pricing** *(Định giá độc quyền phía máy chủ)* | Client **tuyệt đối không được gửi giá tiền** lên server. Server đọc `productId`, `size`, `toppingIds` từ database để tự tính toán tổng tiền. Chống hoàn toàn hành vi sửa đổi giá bằng DevTools hoặc Postman. |
| **BR-02** | **Cơ chế chống gửi trùng Idempotency** | Client gửi header `Idempotency-Key` cho các yêu cầu nhạy cảm (`POST /orders`, `POST /payments`); API chấp nhận header này tùy chọn. Hệ thống lưu vết key trong CSDL (ràng buộc duy nhất) để đảm bảo an toàn giao dịch tài chính theo chuẩn RFC 7231. |
| **BR-03** | **Mã nhận hàng 6 chữ số (`pickupCode`)** — (Sprint 3, Planned) | Không áp dụng ở MVP Sprint 1–2. Khi vào Sprint 3, mã được sinh lúc đơn chuyển sang `READY` (sau khi pha chế xong, không phải lúc `PAID`), duy nhất trong số các đơn đang `READY`. Khách hàng dùng mã này để đọc cho nhân viên quầy nhận đồ. |
| **BR-04** | **Quy tắc tích điểm thành viên** | Điểm tích lũy được tính theo công thức: `Points = Floor(Thực trả / 1.000)`. Điểm được ghi nhận tự động vào bảng `User` ngay khi đơn chuyển trạng thái `PAID`. |
| **BR-05** | **Bảo mật xác thực JWT & SĐT** | Định danh duy nhất của tài khoản là **Số điện thoại Việt Nam di động hợp lệ** (Regex: `/^(0|\+84)(3|5|7|8|9)\d{8}$/`; server chuẩn hóa về 10 chữ số bắt đầu bằng `0`). Mật khẩu được mã hóa an toàn bằng thuật toán `bcryptjs` với salt rounds = 10. |

---

## 11. Ma trận liên kết yêu cầu và User Story (Traceability)

Bảng đối chiếu chứng minh tính toàn vẹn và mức độ bao phủ yêu cầu của Use-Case:

| Thành phần đặc tả | Mã Yêu cầu Chức năng (FR) | Mã Yêu cầu Phi chức năng (NFR) | User Story tương ứng |
|---|:---:|:---:|:---:|
| Đăng nhập tài khoản bằng SĐT | `FR-04` | `NFR-01` (Bảo mật: JWT, bcrypt) | `US-04` |
| Tạo đơn hàng từ giỏ hàng (Server-side Pricing) | `FR-05` | `NFR-02` (Độ tin cậy & sẵn sàng) | `US-05` |
| Thanh toán Thẻ/Ví mô phỏng | `FR-06` | `NFR-01` (Bảo mật: không lưu số thẻ thô) | `US-06` |
| Theo dõi tiến độ đơn hàng (Polling 5s) | `FR-07` | `NFR-04` (Khả dụng: polling, không WebSocket) | `US-07` |
| Máy trạng thái đơn & khóa lạc quan (Optimistic Locking) | `FR-08` | `NFR-02` (Độ tin cậy: đúng khi đồng thời) | `US-08` |
| Header Idempotency-Key chống trùng đơn | `FR-09` | `NFR-02` (Độ tin cậy: đúng khi gửi trùng) | `US-09` |
| Tự động tích lũy điểm thưởng | `FR-10` | `NFR-03` (Chất lượng: có unit test) | `US-10` |
| Áp dụng mã giảm giá khuyến mãi (Sprint 3, Planned) | `FR-11` / `UC-10` | — | `US-11` |

---

## 12. Tiêu chí kiểm thử nghiệm thu (Acceptance Test Scenarios)

Các kịch bản kiểm thử theo chuẩn **Given - When - Then** để phục vụ viết Unit Test, Integration Test và E2E Test cho Task 4 và Task 5:

### Kịch bản 1: Thanh toán thẻ thành công (Happy Path)
- **Given:** Khách hàng đã đăng nhập, giỏ hàng có 1 ly "Cà phê sữa" giá gốc 29.000đ, Size M (+5.000đ) và topping "Trân châu đen" `tran-chau` (+8.000đ).
- **When:** Khách hàng chọn phương thức "Thẻ ngân hàng", nhập số thẻ hợp lệ (đuôi `1234`) và bấm "Xác nhận Thanh toán".
- **Then:**
  - Hệ thống tạo đơn hàng mới trạng thái `PAID`, tổng tiền chính xác 42.000 VNĐ (29.000 + 5.000 + 8.000).
  - Tài khoản khách hàng được cộng thêm đúng 42 điểm tích lũy.
  - Giỏ hàng client bị xóa rỗng; màn hình điều hướng tới `/order-success`.

### Kịch bản 2: Thanh toán thẻ thất bại do số thẻ đuôi `0000` (Negative Path)
- **Given:** Khách hàng ở màn hình checkout với đơn hàng trị giá 45.000đ.
- **When:** Khách hàng nhập số thẻ có 4 số cuối là `0000` và bấm "Xác nhận Thanh toán".
- **Then:**
  - Cổng thanh toán mô phỏng phản hồi từ chối giao dịch.
  - Trạng thái đơn hàng được ghi nhận là `PAYMENT_FAILED`.
  - Tài khoản không bị trừ tiền và không được cộng điểm thưởng.
  - Màn hình hiển thị cảnh báo lỗi màu đỏ; giỏ hàng của khách hàng được giữ nguyên vẹn để thử lại.

### Kịch bản 3: Chặn thanh toán ví khi đơn hàng vượt quá 500.000 VNĐ (Boundary Limit)
- **Given:** Giỏ hàng của khách hàng gồm nhiều món với tổng giá trị là 520.000 VNĐ.
- **When:** Khách hàng chọn thanh toán bằng "Ví điện tử" và bấm xác nhận.
- **Then:**
  - Hệ thống từ chối giao dịch và thông báo vượt hạn mức thanh toán ví (> 500.000đ).
  - Đơn hàng không bị trừ tiền; hướng dẫn khách hàng chuyển đổi sang phương thức Thẻ ngân hàng.

### Kịch bản 4: Chống gửi trùng lặp đơn hàng bằng Idempotency-Key (Concurrency Test)
- **Given:** Khách hàng bấm nút thanh toán và gửi request kèm header `Idempotency-Key: e827d0a4-1234-...`.
- **When:** Khách hàng cố tình nhấn nút liên tiếp 3 lần trong vòng 1 giây với cùng key trên.
- **Then:**
  - Server chỉ thực hiện ghi cơ sở dữ liệu duy nhất 1 lần cho request đầu tiên.
  - Các request tiếp theo nhận được kết quả lưu đệm của request đầu tiên mà không tạo thêm bất kỳ bản ghi đơn hàng trùng lặp nào.
