# Bối Cảnh, Stakeholder và Phạm Vi Hệ Thống (Task 1.1)

> **Dự án:** Ứng dụng đặt cà phê không tiền mặt BrewLite  
> **Môn học:** Công nghệ phần mềm — Học kỳ 1, Năm học 2026–2027  
> **Nhóm thực hiện:**
> - **Nguyễn Thành Long (`Longcodepro`)** — Backend, Scrum Master, DevOps, Kiến trúc
> - **Trần Quốc Tài (`TaiTran263`)** — Frontend UI/UX, Quản trị trạng thái Client, QA
> - **Đường dẫn bắt buộc:** `docs/requirements/context-and-scope.md`

---

## 1. Bối Cảnh và Vấn Đề Nghiệp Vụ Cần Giải Quyết

### 1.1. Thực trạng vận hành truyền thống
Tại các quán cà phê vừa và nhỏ hiện nay, quy trình phục vụ khách hàng chủ yếu diễn ra thủ công tại quầy thu ngân:
1. **Ùn tắc giờ cao điểm:** Vào các khung giờ cao điểm, khách hàng phải xếp hàng dài chờ đợi tới lượt gọi món, gây tâm lý khó chịu và làm giảm trải nghiệm mua hàng.
2. **Khó khăn khi thanh toán tiền mặt:** Việc nhận tiền mặt, đếm lại, thối tiền tốn nhiều thời gian, dễ gây nhầm lẫn thất thoát doanh thu, đồng thời tiềm ẩn rủi ro vệ sinh an toàn thực phẩm khi nhân viên quầy vừa nhận tiền vừa phục vụ đồ uống.
3. **Sai sót trong tiếp nhận yêu cầu:** Khách hàng thường có những lựa chọn khác nhau (đổi size S/M/L, thêm các loại topping như trân châu, kem cheese...). Việc nhân viên ghi chép tay hoặc truyền đạt qua miệng dễ dẫn đến tình trạng pha nhầm món, sai định lượng.
4. **Khó kiểm soát tồn kho trong ngày:** Cửa hàng không có công cụ kiểm soát tức thời số lượng ly đồ uống có thể phục vụ trong ngày, dẫn đến việc nhận đơn của khách nhưng sau đó phải hủy vì hết nguyên liệu pha chế.

### 1.2. Giải pháp hệ thống BrewLite
**BrewLite** là giải pháp phần mềm web ứng dụng định hướng di động (*Mobile-First / Progressive Web App - PWA*), giải quyết bài toán đặt món và thanh toán không tiền mặt với các tiện ích:
* **Tự phục vụ tiện lợi:** Khách hàng chủ động quét mã QR tại bàn hoặc truy cập ứng dụng trên điện thoại để duyệt menu, chọn món và tùy chọn options cho món đó (size, topping), thêm vào giỏ hàng, đặt làm món uống mà không cần tới tận quầy order.
* **Thanh toán không tiền mặt tức thì:** Tích hợp cơ chế thanh toán mô phỏng an toàn (Ví điện tử hoặc Thẻ ngân hàng), tự động xác nhận đơn ngay khi giao dịch thành công mà không cần chờ nhân viên xác minh.
* **Số hóa quy trình đơn hàng:** Đơn hàng sau khi thanh toán được chuyển thẳng vào hệ thống theo thời gian thực; khách hàng theo dõi được trạng thái đơn và tích lũy điểm thưởng thành viên.

---

## 2. Bảng Phân Tích Các Bên Liên Quan (Stakeholder Analysis)

Hệ thống BrewLite xác định 6 nhóm Stakeholder chính theo đúng yêu cầu đề bài:

| STT | Stakeholder | Vai trò trong hệ thống | Mục tiêu chính | Kỳ vọng đối với phần mềm |
|:---:|---|---|---|---|
| **1** | **Khách hàng**<br>*(Customer)* | Người dùng cuối mua và thưởng thức đồ uống. | Đặt đồ uống nhanh chóng, chính xác theo ý muốn mà không phải xếp hàng chờ đợi. | • Giao diện mobile mượt mà, dễ chọn món.<br>• Tùy chọn size và topping trực quan, thấy ngay tổng tiền.<br>• Thanh toán không tiền mặt bảo mật, không bị trừ tiền 2 lần.<br>• Tra cứu được lịch sử đơn và điểm tích lũy thành viên. |

| **2** | **Nhân viên quầy**<br>*(Barista / Staff)* | Tiếp nhận đơn, pha chế và giao đồ uống cho khách. | Giảm thiểu áp lực nhận order thủ công tại quầy; hạn chế tối đa sai sót. | • Thông tin món trong đơn rõ ràng (size, danh sách topping chi tiết).<br>• Đơn hiển thị trên hệ thống là đơn đã thanh toán thành công (`PAID`).<br>• Không phải xử lý tiền mặt và tiền lẻ thối. |
| **3** | **Quản lý cửa hàng**<br>*(Store Manager)* | Quản trị vận hành kinh doanh và danh mục sản phẩm. | Nâng cao hiệu suất phục vụ giờ cao điểm; kiểm soát lượng đồ uống bán ra. | • Quản lý được giới hạn sản lượng phục vụ trong ngày.<br>• Dữ liệu đơn hàng minh bạch, không thất thoát doanh thu.<br>• Hệ thống vận hành ổn định, sẵn sàng hoạt động liên tục. |
| **4** | **Giảng viên / Nghiệm thu**<br>*(Evaluator / Client)* | Đánh giá chất lượng dự án và nghiệm thu sản phẩm. | Thẩm định năng lực kỹ thuật và quy trình công nghệ phần mềm của nhóm. | • Tuân thủ chuẩn mực quy trình từ Yêu cầu $\rightarrow$ Thiết kế $\rightarrow$ CI/CD $\rightarrow$ Deployment.<br>• Có ma trận truy vết  đầy đủ 1-1.<br>• Có phiên bản chạy trực tiếp trên Internet truy cập được qua HTTPS. |
| **5** | **Nhóm phát triển**<br>*(Development Team)* | Xây dựng, kiểm thử, triển khai và bảo trì hệ thống. | Tạo ra sản phẩm đạt chuẩn kiến trúc, dễ mở rộng, kiểm thử tự động toàn diện. | • Cấu trúc Monorepo phân tách rõ `apps/web` và `apps/api`.<br>• Pipeline CI/CD tự động phát hiện lỗi và đóng gói container.<br>• Code sạch, có migration dữ liệu và tài liệu kỹ thuật đồng bộ. |
| **6** | **Đơn vị thanh toán**<br>*(Payment Provider)* | Cổng trung gian cung cấp hạ tầng thanh toán số. | Đảm bảo tính toàn vẹn, bảo mật và chính xác của giao dịch tài chính. | • Hỗ trợ cơ chế Idempotency qua header `Idempotency-Key` để tránh giao dịch trùng.<br>• Xác thực giao dịch an toàn, phản hồi trạng thái rõ ràng (thành công / từ chối). |

---

## 3. Phạm Vi Sản Phẩm (Product Scope)

### 3.1. Phạm vi trong MVP (In-Scope — Thực hiện trong Sprint 1 & 2)
Toàn bộ các tính năng cốt lõi bắt buộc để hoàn thành trọn vẹn luồng nghiệp vụ tối thiểu:

* **Quản lý sản phẩm & Menu đồ uống:**
  * Xem danh sách đồ uống phân theo danh mục (Cà phê pha phin, Espresso, Cold Brew, Trà sữa,...).
  * Hiển thị chi tiết từng món: tên, mô tả, ảnh, giá bán cơ bản, trạng thái còn/hết hàng.
  * Hỗ trợ chọn biến thể kích cỡ: Size S (+0đ), Size M (+5.000đ), Size L (+10.000đ).
  * Hỗ trợ chọn topping đi kèm: Trân châu (+8.000đ), Kem cheese (+10.000đ), Thạch cafe (+6.000đ).
* **Quản lý giỏ hàng phía Client (Zustand + LocalStorage):**
  * Thêm món vào giỏ hàng kèm size và topping riêng biệt.
  * Tăng / giảm số lượng từng ly, xóa món khỏi giỏ hàng.
  * Tự động tính toán tổng tiền tạm tính theo thời gian thực.
* **Xác thực và phân quyền (Authentication & Authorization):**
  * Đăng ký tài khoản mới và đăng nhập bằng email / mật khẩu.
  * Mã hóa mật khẩu bảo mật bằng thư viện `bcryptjs`.
  * Cấp phát và quản lý phiên người dùng bằng `JSON Web Token (JWT)`.
  * Bảo vệ các endpoint nghiệp vụ đặt hàng và thanh toán bằng `JwtAuthGuard`.
* **Quy trình Đặt hàng (Order Flow):**
  * Tạo đơn hàng mới từ giỏ hàng ở trạng thái ban đầu `PENDING`.
  * Máy chủ Backend thanh toán tự động tính tổng tiền dựa trên cơ sở dữ liệu để chống gian lận giá từ client.
  * Kiểm soát sản lượng bán trong ngày (`dailyQuota`), chặn đặt hàng khi món đã hết suất bán.
* **Quy trình Thanh toán không tiền mặt mô phỏng (Payment Flow):**
  * Hỗ trợ hai phương thức: **Thẻ ngân hàng (`CARD`)** và **Ví điện tử (`WALLET`)**.
  * Quy tắc mô phỏng nghiệp vụ:
    * Thẻ có 4 số cuối là `0000` $\rightarrow$ Mô phỏng lỗi giao dịch thẻ, trả về thất bại.
    * Đơn hàng thanh toán qua Ví có giá trị $> 500.000$đ $\rightarrow$ Mô phỏng vượt hạn mức ví, từ chối giao dịch.
  * Thanh toán thành công: Đơn hàng chuyển sang trạng thái `PAID`.
  * Thanh toán thất bại: Đơn hàng chuyển sang `PAYMENT_FAILED`, cho phép khách đổi phương thức để thanh toán lại.
  * Chống trừ tiền trùng lặp bằng cơ chế **`Idempotency-Key`**.
* **Lịch sử đơn & Khách hàng thân thiết (Loyalty):**
  * Khách hàng tra cứu danh sách lịch sử đơn hàng của chính mình (`GET /orders/me`).
  * Tự động tích lũy điểm thưởng thành viên: $1$ điểm cho mỗi $1.000$đ giá trị đơn hàng đã thanh toán thành công.
* **Hạ tầng & Vận hành:**
  * Đóng gói toàn bộ hệ thống bằng Docker và Docker Compose.
  * Pipeline CI/CD tự động kiểm tra Lint, Test, Build và đóng gói Container Image lên GHCR.
  * Triển khai môi trường Production có HTTPS truy cập được công khai.

---

### 3.2. Phạm vi mở rộng tương lai (Future Scope — Post Sprint 2 / Could Have)
Các tính năng nâng cao đã được quy hoạch trong Product Backlog nhưng sẽ triển khai ở giai đoạn tiếp theo nếu còn thời gian:
* **Khuyến mãi & Voucher (`Promotion`):** Nhập mã giảm giá theo số tiền cố định (`FIXED`) hoặc phần trăm (`PERCENT`) khi thanh toán đơn hàng.
* **Hủy đơn hàng:** Cho phép khách hàng hoặc nhân viên quầy hủy đơn trước khi quán tiến hành pha chế, có ghi nhận lý do hủy đơn.
* **Đánh giá dịch vụ:** Khách hàng gửi đánh giá 1–5 sao và bình luận sau khi hoàn thành đơn.
* **Báo cáo thống kê:** Bảng điều khiển dành cho Quản lý thống kê doanh thu, số lượng đơn theo ngày/tuần và top các món bán chạy nhất.

---

### 3.3. Các nội dung không thực hiện (Out-of-Scope — Won't Have)
Để đảm bảo tính khả thi, chất lượng mã nguồn và sự tập trung cao nhất vào luồng cốt lõi trong thời gian 2 Sprint của nhóm 2 người, các nội dung sau **chính thức nằm ngoài phạm vi thực hiện**:
1. **Ví nạp/rút tiền ngân hàng thật:** Không xây dựng hệ thống quản lý số dư ví nội bộ, không hỗ trợ chức năng nạp tiền từ tài khoản ngân hàng hoặc rút tiền về tài khoản thực tế.
2. **Quản lý nhân sự và chấm công:** Không hỗ trợ xếp ca làm việc, chấm công vân tay, bảng lương nhân viên quầy.
3. **Quản lý kho nguyên vật liệu chi tiết:** Không theo dõi định mức hao hụt nguyên liệu thô theo gram cà phê, mililit sữa tươi, siro đường. Việc quản lý kho chỉ dừng ở mức kiểm soát số lượng ly đồ uống hoàn chỉnh bán ra trong ngày (`dailyQuota`).
4. **Hạ tầng SMS Brandname viễn thông:** Không tích hợp tổng đài gửi mã OTP qua tin nhắn SMS điện thoại (xác thực hoàn toàn dựa trên JWT và mật khẩu đã băm).

---

## 4. Giả Định và Ràng Buộc (Assumptions & Constraints)

### 4.1. Giả định ban đầu (Assumptions)
* **Người dùng cuối:** Sở hữu thiết bị di động thông minh (smartphone) hoặc máy tính cá nhân có cài đặt trình duyệt web hiện đại (Google Chrome, Safari, Microsoft Edge) và có kết nối Internet ổn định.
* **Cổng thanh toán:** Là dịch vụ mô phỏng nội bộ (*Mock Payment Service*) tuân thủ đúng các đặc tả lỗi nghiệp vụ (thẻ đuôi `0000`, hạn mức ví) nhằm phục vụ công tác kiểm thử tự động mà không phát sinh chi phí giao dịch ngân hàng thật.
* **Danh mục đồ uống:** Dữ liệu ban đầu về các món cà phê, giá bán, size và topping được thiết lập sẵn thông qua kịch bản khởi tạo dữ liệu mẫu (*Database Seed*).

### 4.2. Ràng buộc kỹ thuật & Quy trình (Constraints)
* **Ràng buộc công nghệ bắt buộc theo đề bài:**
  * **Frontend:** Bắt buộc sử dụng `Next.js` theo hướng Mobile-first / PWA.
  * **Backend:** Bắt buộc sử dụng `NestJS` với kiến trúc module hóa.
  * **Cơ sở dữ liệu:** Bắt buộc sử dụng hệ quản trị `PostgreSQL` kèm cơ chế migration.
  * **Đóng gói & Chạy thử:** Bắt buộc có cấu hình `docker-compose.yml` để chạy toàn bộ hệ thống ở máy local.
* **Ràng buộc quy trình phần mềm:**
  * Quy tắc thực hiện tuần tự: Task sau chỉ được bắt đầu nghiệm thu khi các tạo phẩm của task trước đã được đẩy lên kho mã nguồn với commit rõ ràng.
  * Mọi thay đổi mã nguồn phải thông qua Pull Request, vượt qua cổng kiểm soát chất lượng (*CI Quality Gate: Install $\rightarrow$ Lint $\rightarrow$ Unit Test $\rightarrow$ Build*) và có sự phê duyệt (*Review*) từ thành viên còn lại của nhóm.
  * Bắt buộc duy trì ma trận truy vết (`docs/traceability-matrix.md`) xuyên suốt từ yêu cầu đến mã nguồn và kiểm thử.
* **Ràng buộc tài nguyên:** Nhóm gồm 02 thành viên, thời gian thực hiện gói gọn trong 02 Sprint của học kỳ.

---

## 5. Rủi Ro Ban Đầu và Biện Pháp Giảm Thiểu (Initial Risks & Mitigation)

| Mã rủi ro | Mô tả rủi ro | Mức độ | Biện pháp phòng ngừa và xử lý |
|:---:|---|:---:|---|
| **RSK-01** | **Xung đột đơn hàng khi hết sản lượng trong ngày:** Nhiều khách cùng bấm đặt món cuối cùng cùng một thời điểm. | Cao | Sử dụng **Database Transaction (ACID)** kết hợp khóa lạc quan (*Optimistic Locking* với trường `version`) để đảm bảo không bị bán vượt định mức tồn kho. |
| **RSK-02** | **Trừ tiền lặp lại do lỗi mạng:** Khách hàng gặp mạng lag nên bấm nút "Thanh toán" liên tiếp nhiều lần. | Cao | Bắt buộc client sinh UUID đính kèm vào header **`Idempotency-Key`**; backend ghi nhận key để chỉ xử lý đúng 1 giao dịch tài chính duy nhất. |
| **RSK-03** | **Gian lận sửa giá từ phía Client:** Người dùng cố tình sửa dữ liệu giỏ hàng trên trình duyệt để gửi giá tiền sai lệch về máy chủ. | Cao | Backend **tuyệt đối không tin tưởng giá từ client**; server tự truy vấn bảng giá niêm yết trong cơ sở dữ liệu để tính toán lại tổng tiền trước khi tạo đơn. |
| **RSK-04** | **Lệch pha giữa Frontend và Backend:** Hai thành viên phát triển độc lập dẫn đến không khớp dữ liệu gọi API. | Trung bình | Thống nhất và tuân thủ chặt chẽ Hợp đồng API (*API Contract*) tại `docs/architecture/api-contract.md`; tích hợp tài liệu Swagger UI tự động tại `/docs`. |
| **RSK-05** | **Áp lực tiến độ 2 Sprint:** Khối lượng công việc nhiều dẫn đến trễ hạn nộp bài. | Trung bình | Áp dụng triệt để mô hình **MoSCoW**; tập trung hoàn thành 100% các hạng mục **Must Have** trước, các tính năng Could/Won't đưa về backlog hậu Sprint 2. |
