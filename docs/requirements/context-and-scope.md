# Bối cảnh, Stakeholder và Phạm vi Hệ thống BrewLite (Task 1.1)

> **Dự án:** Ứng dụng đặt cà phê không tiền mặt BrewLite  
> **Môn học:** Công nghệ phần mềm — Học kỳ 1, Năm học 2026–2027  
> **Nhóm sinh viên thực hiện:**
> - **Nguyễn Thành Long (`Longcodepro`)** — Backend, Scrum Master, DevOps, Kiến trúc
> - **Trần Quốc Tài (`TaiTran263`)** — Frontend UI/UX, Quản trị trạng thái Client, QA
>
> **Đường dẫn tạo phẩm:** `docs/requirements/context-and-scope.md` (Liên kết: Issue `[D1.1]`, số issue ghi sau khi tạo ở repo Assignment 2)  
> **Tài liệu đối chiếu:** `Assignment2-BrewLite.pdf` (Task 1.1), `docs/architecture/api-contract.md`, `docs/traceability-matrix.md`

## 0. Hướng dẫn đọc

- File này là tạo phẩm **Task 1.1** của đề Assignment 2, đặt tại `docs/requirements/context-and-scope.md`.
- File này là **nguồn sự thật chuẩn (Single Source of Truth)** của cả hệ thống. Danh mục mã `CN-xx`, `UC-xx`, `FR-xx`, `NFR-xx` và bảng chuyển trạng thái đơn nằm ở **mục 6**. Các tài liệu khác (SRS, sơ đồ, kiến trúc, ma trận truy vết) phải khớp mục 6; nếu lệch thì theo file này và báo Long hoặc Tài để sửa tài liệu kia.
- Mã định nghĩa trong file này: `P1` đến `P4` (vấn đề nghiệp vụ), `G1` đến `G4` (mục tiêu hệ thống), `RSK-01` đến `RSK-08` (rủi ro), và toàn bộ `CN`, `UC`, `FR`, `NFR` ở mục 6.
- Tên trong dấu `backtick` (enum, header, endpoint, cột CSDL) là tên đúng trong mã nguồn; dùng nguyên văn. Không tự thêm chức năng ngoài phạm vi đã ghi; thiếu thông tin thì hỏi lại, không đoán.
- Bố cục theo yêu cầu Task 1.1 của đề: bối cảnh và vấn đề (mục 1), bảng stakeholder (mục 2), in-scope và phạm vi mở rộng (3.1, 3.2), out-of-scope (3.3), giả định và ràng buộc (mục 4), rủi ro ban đầu (mục 5), danh mục thống nhất CN/UC/FR/NFR và vòng đời đơn (mục 6).
- Phần Sprint 3 và 4 (mục 3.2) ở trạng thái **Planned**: chỉ có tài liệu và sơ đồ, không đòi mã nguồn và kiểm thử.

---

## 1. Bối Cảnh Nghiệp Vụ và Vấn Đề Cần Giải Quyết

### 1.1. Thực trạng vận hành quán cà phê truyền thống

Tại các cửa hàng cà phê vừa và nhỏ hiện nay, quy trình phục vụ chủ yếu diễn ra thủ công tại quầy thu ngân: khách hàng phải xếp hàng chờ gọi món, thanh toán bằng tiền mặt hoặc chuyển khoản thủ công, nhận thẻ rung và tự tìm chỗ ngồi. Cách thức vận hành này phát sinh 4 vấn đề nghiệp vụ nhức nhối:

| Mã | Vấn đề thực tế | Hệ quả nghiệp vụ |
|:---:|---|---|
| **P1** | **Ùn tắc giờ cao điểm tại quầy:** Khách phải xếp hàng dài chờ tới lượt gọi món, nhân viên thu ngân quá tải trong việc nhập đơn thủ công. | Giảm trải nghiệm khách hàng; tăng thời gian chờ đợi; nguy cơ mất khách trong khung giờ cao điểm (sáng, trưa). |
| **P2** | **Thanh toán tiền mặt chậm và rủi ro:** Nhận tiền mặt, kiểm đếm và thối tiền lẻ tốn thời gian; khách chuyển khoản thì nhân viên phải chờ thông báo biến động số dư để đối soát. | Dễ nhầm lẫn, thất thoát doanh thu; rủi ro mất vệ sinh an toàn thực phẩm khi nhân viên vừa nhận tiền vừa pha chế. |
| **P3** | **Sai sót thông tin order do truyền miệng:** Khách có nhiều tùy biến chi tiết (kích cỡ ly, topping, mức đường, mức đá...). Nhân viên ghi giấy hoặc truyền miệng dễ nhầm lẫn. | Pha chế nhầm món, sai định lượng, phải pha lại gây lãng phí nguyên liệu và làm khách hàng không hài lòng. |
| **P4** | **Thiếu công cụ kiểm soát nguyên vật liệu tức thì:** Quán không theo dõi được lượng nguyên liệu thực tế còn lại pha được bao nhiêu ly trong ca làm việc. | Nhận đơn thu tiền của khách rồi mới phát hiện hết nguyên liệu (hết sữa, hết đá...), buộc phải hủy đơn và xin lỗi khách. |

### 1.2. Giải pháp chuyển đổi số từ hệ thống BrewLite

**BrewLite** là ứng dụng web hiện đại xây dựng theo triết lý **Mobile-First**, giải quyết 4 vấn đề trên. P1 đến P3 được giải quyết ngay ở MVP (Sprint 1–2); P4 chỉ được giải quyết đầy đủ ở Sprint 4, còn MVP dùng cờ `isAvailable` làm phương án tạm:

* **Tự phục vụ tiện lợi (Self-ordering):** Khách hàng quét mã QR (chỉ mở đường dẫn web, không gắn với bàn) hoặc mở trình duyệt di động để duyệt menu, tùy biến kích cỡ (Size S/M/L) và topping, kiểm tra giỏ hàng và đặt món mà không cần xếp hàng tại quầy → *Giải quyết P1 và P3*.
* **Thanh toán không tiền mặt tức thời (Cashless Payment):** Tích hợp giải pháp thanh toán số mô phỏng (Thẻ ngân hàng, Ví điện tử); hệ thống tự động xác nhận đơn ngay khi giao dịch thành công trong cùng một giao dịch (Transaction) → *Giải quyết P2*.
* **Số hóa quy trình đơn hàng & Nhận món bằng mã 6 số (theo dõi đơn: MVP Sprint 2; hàng đợi pha chế và mã 6 số: Sprint 3, Planned):** Đơn sau khi thanh toán thành công tự động vào thẳng hàng đợi pha chế. Khách theo dõi tiến độ trên điện thoại (màn hình tự cập nhật bằng polling khoảng 5 giây) và nhận món tại quầy bằng mã nhận hàng 6 số (thay thế thẻ rung truyền thống) → *Giải quyết P1*.
* **Quản lý nguyên liệu & Định lượng (Sprint 4, Planned):** Kho nguyên liệu thực tế có công thức pha chế, kiểm tra đủ nguyên liệu khi tạo đơn, tự trừ kho khi thanh toán và cảnh báo tồn kho sắp hết → *Giải quyết P4*. Ở MVP chỉ có cờ `isAvailable`.

### 1.3. Mục tiêu hệ thống (System Goals)

| Mã | Mục tiêu hệ thống | Vấn đề giải quyết |
|:---:|---|:---:|
| **G1** | Khách hàng tự gọi món và thanh toán trực tiếp trên điện thoại di động, **loại bỏ hoàn toàn việc xếp hàng tại quầy**; mỗi thao tác của hệ thống (thêm vào giỏ, chuyển trang, xác nhận thanh toán) phản hồi nhanh, không gây chờ đợi do hệ thống (đo cụ thể ở `NFR-05`). | P1, P2, P3 |
| **G2** | Tự động hóa 100% khâu định giá và kiểm tra tính hợp lệ của đơn hàng tại máy chủ (Server-side Pricing), bảo vệ an toàn giao dịch tài chính. | P2, P3 |
| **G3** | Cung cấp cơ chế theo dõi trạng thái đơn hàng, cập nhật định kỳ khoảng 5 giây (polling), trên giao diện web di động (MVP Sprint 2); mã nhận hàng 6 số thay thế thẻ rung truyền thống khi triển khai hàng đợi pha chế (Sprint 3, Planned). | P1 |
| **G4** | Không nhận tiền cho đơn không đủ nguyên liệu: kiểm tra tồn kho khi tạo đơn, tự trừ kho khi thanh toán (Sprint 4, Planned; MVP dùng `isAvailable`). | P4 |

### 1.4. Luồng người dùng cốt lõi (Core User Journey MVP)

Thứ tự các bước (khớp luồng tối thiểu của đề):

1. Khách quét QR hoặc mở web.
2. Duyệt menu đồ uống (CN-02).
3. Chọn size và topping (CN-03).
4. Thêm vào giỏ hàng (CN-04).
5. Đăng nhập bằng SĐT khi đặt hàng (CN-05); giỏ hàng giữ nguyên.
6. Thanh toán bằng Thẻ hoặc Ví (CN-06); đơn chuyển sang `PAID`.
7. Theo dõi đơn, xem điểm thưởng (CN-07).

---

## 2. Bảng Phân Tích Các Bên Liên Quan (Stakeholder Analysis)

Đề bài Assignment 2 quy định 6 nhóm stakeholder chính tham gia vào vòng đời hệ thống:

| STT | Stakeholder | Vai trò trong hệ thống | Mục tiêu chính | Kỳ vọng đối với phần mềm BrewLite |
|:---:|---|---|---|---|
| **1** | **Khách hàng** *(Customer)* | Người dùng cuối mua và thưởng thức đồ uống tại quán | Đặt đồ uống nhanh, chính xác theo ý muốn, không phải chờ đợi tại quầy | (1) Giao diện di động mượt mà, trực quan, dễ thao tác. (2) Tùy chọn size và topping thấy ngay giá tạm tính theo thời gian thực. (3) Đăng ký/đăng nhập đơn giản bằng số điện thoại. (4) Thanh toán không tiền mặt an toàn, không bị trừ tiền 2 lần. (5) Tra cứu được lịch sử đơn hàng và số dư điểm tích lũy. |
| **2** | **Nhân viên quầy & Pha chế** *(Counter Staff & Barista)* | Tiếp nhận đơn, pha chế đồ uống và giao món cho khách | Chuẩn bị đồ uống chính xác, giảm thiểu sai sót và áp lực giờ cao điểm | (1) Hàng đợi pha chế hiển thị đơn theo thứ tự thời gian. (2) Thông tin món rõ ràng: tên món, size ly, danh sách topping. (3) Chỉ tiếp nhận những đơn đã thanh toán thành công (`PAID`). (4) Đối chiếu mã nhận hàng 6 số nhanh chóng để giao đúng khách. |
| **3** | **Quản lý cửa hàng** *(Store Manager)* | Quản trị vận hành, danh mục món, nguyên liệu và doanh thu | Nâng cao hiệu suất bán hàng, kiểm soát doanh thu minh bạch và chống thất thoát | (1) Cấu hình được danh mục, giá món theo từng size và topping. (2) Kiểm soát được tình trạng còn bán / hết hàng của từng món. (3) Báo cáo thống kê doanh thu thực tế, số đơn thành công theo ngày. (4) Quản lý và phân quyền tài khoản cho nhân sự vận hành. |
| **4** | **Đơn vị thanh toán** *(Payment Provider)* | Cổng thanh toán trung gian (hệ thống mô phỏng nội bộ) | Đảm bảo tính toàn vẹn, bảo mật và chính xác của giao dịch | (1) Nhận yêu cầu giao dịch chuẩn định dạng API. (2) Hỗ trợ cơ chế chống gửi trùng (`Idempotency-Key`). (3) Phản hồi trạng thái giao dịch rõ ràng (thành công hoặc từ chối). |
| **5** | **Nhóm phát triển** *(Development Team)* | Xây dựng, kiểm thử, tích hợp CI/CD và vận hành hệ thống | Tạo ra sản phẩm đạt chuẩn kiến trúc, kiểm thử tự động và bàn giao đúng hạn | (1) Cấu trúc Monorepo phân tách rõ `apps/web` và `apps/api`. (2) Hợp đồng API Contract rõ ràng để Frontend và Backend phát triển song song. (3) Pipeline CI/CD tự động phát hiện lỗi và đóng gói container. (4) Phạm vi vừa sức 2 người trong 2 Sprint theo mô hình MoSCoW. |
| **6** | **Giảng viên nghiệm thu** *(Evaluator / Client)* | Đánh giá chất lượng kỹ thuật phần mềm và nghiệm thu đồ án | Thẩm định năng lực kỹ thuật, quy trình công nghệ phần mềm và tính thực thi | (1) Tuân thủ quy trình: từ Yêu cầu → Thiết kế UML → Kiến trúc → Code → Test → Deploy. (2) Ma trận truy vết (`traceability-matrix.md`) đầy đủ, không đứt đoạn. (3) Ứng dụng có phiên bản Production chạy trực tiếp trên Internet qua HTTPS. |

---

## 3. Phạm Vi Sản Phẩm (Product Scope)

Để đảm bảo chất lượng kỹ thuật cao nhất trong khung thời gian 2 Sprint của nhóm 2 người, phạm vi hệ thống được quy hoạch chặt chẽ theo mô hình **MoSCoW** và phân kỳ theo lộ trình phát hành:

### 3.1. Phạm vi trong MVP (In-Scope — Sprint 1 & Sprint 2)

Đây là **phạm vi bắt buộc hoàn thành (Must Have & Should Have)**, có mã nguồn chạy thật, có bộ kiểm thử tự động và được triển khai trực tiếp lên môi trường Production:

#### A. Phân hệ Giao diện Khách hàng (Frontend — `apps/web`)
1. **Duyệt Menu đồ uống (Mobile-first)** (CN-02, Sprint 1):
   - Danh sách món cà phê phân chia theo tab danh mục trực quan.
   - Hiển thị ảnh đại diện, tên đồ uống, giá cơ bản (Size S).
   - Xử lý mượt mà 3 trạng thái giao diện: Đang tải (*Skeleton Loading*), Danh sách rỗng (*Empty State*), Lỗi mạng (*Error & Retry*).
2. **Modal Chi tiết & Tùy biến món** (CN-03, Sprint 2):
   - Chọn duy nhất 1 trong 3 kích cỡ: **Size S** (+0 đ), **Size M** (+5.000 đ), **Size L** (+10.000 đ).
   - Tick chọn nhiều topping cùng lúc: **Trân châu đen** (+8.000 đ), **Kem cheese** (+10.000 đ), **Thạch cà phê** (+6.000 đ).
   - Đơn giá tạm tính tự động cập nhật theo thời gian thực trên Modal.
3. **Quản lý Giỏ hàng Client Store (Zustand & LocalStorage)** (CN-04, Sprint 2):
   - Lưu trữ bền vững phía trình duyệt, khách chưa đăng nhập vẫn thêm được vào giỏ.
   - Tăng, giảm số lượng (từ 1 đến 99 ly), xóa từng món hoặc xóa toàn bộ giỏ.
   - Badge đếm số ly trên thanh điều hướng cập nhật tức thì.
4. **Xác thực tài khoản Khách hàng** (CN-05, Sprint 2):
   - Đăng ký và đăng nhập bằng **Số điện thoại** Việt Nam và Mật khẩu (Email là trường tùy chọn).
   - Quản lý phiên làm việc bằng JSON Web Token (JWT), lưu an toàn phía client và tự động đính kèm header `Authorization: Bearer <token>`.
   - Tài khoản có vai trò (`CUSTOMER`, `BARISTA`, `CASHIER`, `MANAGER`); đăng ký mặc định là `CUSTOMER`.
5. **Màn hình Lịch sử & theo dõi đơn hàng** (CN-07, Sprint 2):
   - Xem danh sách các đơn đã đặt của chính mình, sắp xếp mới nhất lên đầu.
   - Hiển thị chi tiết từng món (size, topping) và Badge trạng thái trực quan: `PENDING` (Vàng), `PAID` (Xanh lá), `PAYMENT_FAILED` (Đỏ).
   - Trạng thái đơn tự cập nhật bằng polling khoảng 5 giây (không dùng WebSocket).
   - Hiển thị số dư **Điểm tích lũy thành viên** và lịch sử điểm (mỗi lần thanh toán thành công một dòng).

#### B. Phân hệ Máy chủ & Dịch vụ API (Backend — `apps/api`)

Ngoài các mục dưới đây, API sản phẩm `GET /products` và `GET /products/:id` thuộc Sprint 1 (CN-02).

1. **Định giá độc quyền tại Server (Server-side Pricing)** (CN-06, Sprint 2):
   - Client tuyệt đối không gửi giá tiền lên Backend; hệ thống đọc giá gốc từ CSDL và tự động tính toán tổng tiền chính xác, ngăn chặn triệt để gian lận sửa giá (*Parameter Tampering*).
2. **Xử lý giao dịch thanh toán mô phỏng (Simulated Payment)** (CN-06, Sprint 2):
   - Hỗ trợ 2 phương thức: Thẻ ngân hàng (`CARD`) và Ví điện tử (`WALLET`).
   - Quy tắc kiểm thử mô phỏng: Thẻ có 4 số cuối `0000` bị từ chối; Ví điện tử từ chối đơn hàng >500.000 đ; các trường hợp hợp lệ khác thành công 100%.
   - Bảo mật: Tuyệt đối không lưu trữ chuỗi số thẻ thô (`cardNumber`) vào cơ sở dữ liệu.
3. **Quản lý vòng đời trạng thái đơn hàng (Order State Machine)** (CN-06, Sprint 2):
   - Kiểm soát nghiêm ngặt bước chuyển: `PENDING` → `PAID` hoặc `PAYMENT_FAILED`; `PAYMENT_FAILED` → `PAID` (cho phép thanh toán lại).
   - Chặn đứng mọi nỗ lực thanh toán lại đơn hàng đã ở trạng thái `PAID` (báo lỗi `409 Conflict`).
4. **Chống gửi trùng yêu cầu giao dịch (Idempotency Control)** (CN-06, Sprint 2):
   - Áp dụng header `Idempotency-Key` (UUID) cho API tạo đơn và thanh toán, ngăn chặn trừ tiền 2 lần khi khách bấm nút liên tục hoặc lỗi mạng gửi lại request.
5. **Khóa lạc quan chống xung đột đồng thời (Optimistic Locking)** (CN-06, Sprint 2):
   - Quản lý qua cột `version: Int @default(0)` trong bảng `Order`, đảm bảo an toàn dữ liệu khi có nhiều tiến trình cập nhật đơn hàng cùng lúc.
6. **Tích lũy điểm thưởng thành viên (Loyalty Points)** (CN-07, Sprint 2):
   - Tự động cộng **1 điểm cho mỗi 1.000 đ** số tiền thực trả của đơn hàng thanh toán thành công (`PAID`). Điểm chỉ tích lũy, chưa có chức năng đổi điểm.

#### C. Hạ tầng kỹ thuật, DevOps & Đóng gói
* Đóng gói toàn bộ hệ thống bằng **Docker và Docker Compose** (chạy đồng bộ Web, API và PostgreSQL tại local).
* **Sprint 1:** pipeline **Continuous Integration (CI GitHub Actions)** kiểm tra tự động 4 bước bắt buộc trên mọi Pull Request: `Install` → `Lint (oxlint)` → `Unit Test (Vitest)` → `TypeScript Build`.
* **Sprint 2:** pipeline **Continuous Delivery (CD)** tự động đóng gói Docker Image lên GitHub Packages (GHCR).
* **Sprint 2:** triển khai môi trường **Production thực tế truy cập qua Internet**: Frontend trên Vercel, API trên Render, Database PostgreSQL trên Neon Cloud, có chứng chỉ bảo mật HTTPS và endpoint giám sát sức khỏe `GET /health`. Khi cần demo trực tiếp trên điện thoại, có thể phát API chạy ở máy cá nhân qua Cloudflare Tunnel (`scripts/start-tunnel.sh`) như phương án dự phòng.
* **Kiểm thử và dữ liệu (theo đề, mục 7.2):** unit test cho nghiệp vụ quan trọng; integration test cho API tạo đơn và thanh toán; ít nhất một end-to-end test từ menu đến xác nhận đơn; migration và seed tái tạo được CSDL.
* **Phương án dự phòng cho Kho hàng ở MVP:** Sử dụng cờ tình trạng món `isAvailable` (còn bán / hết hàng) để hiển thị nhãn và khóa chọn món, đảm bảo luồng đặt hàng chạy thông suốt.

---

### 3.2. Phạm vi mở rộng tương lai (Future Scope — Sprint 3 & Sprint 4)

Các tính năng nâng cao đã được quy hoạch trong Product Backlog và sẽ được hiện thực hóa ở các Sprint tiếp theo sau khi hoàn thành nghiệm thu MVP. Trong Assignment 2 chúng ở trạng thái **Planned** (có trong tài liệu và sơ đồ, không đòi mã nguồn và kiểm thử). Danh mục FR/NFR và bảng chuyển trạng thái đơn nằm ở mục 6.

#### A. Sprint 3 — Vận hành quầy & Tương tác khách hàng
* **Màn hình Pha chế KDS (Kitchen Display System):** Cho phép Barista tiếp nhận đơn hàng `PAID`, cập nhật tiến độ chuyển trạng thái sang `PREPARING` (Đang pha chế) và `READY` (Món đã sẵn sàng).
* **Màn hình Giao nhận quầy & Mã nhận hàng 6 số:** Đơn hàng khi chuyển sang `READY` sẽ sinh mã 6 số ngẫu nhiên (`pickupCode`); nhân viên quầy nhập mã này để đối chiếu và chuyển đơn sang `COMPLETED` (Hoàn tất giao món).
* **Áp dụng mã khuyến mãi (`Promotion`):** Khách hàng nhập mã voucher để được giảm trừ trực tiếp theo số tiền cố định (`FIXED`) hoặc tỷ lệ phần trăm (`PERCENT`). Voucher ở Sprint 3 được seed sẵn trong CSDL.
* **Hủy đơn hàng trước khi pha chế:** Cho phép khách hàng hoặc nhân viên quầy hủy đơn khi quán chưa bắt đầu làm món (chưa sang `PREPARING`), ghi nhận lý do hủy đơn; đơn đã `PAID` được hoàn tiền mô phỏng.
* **Phân quyền nhân viên:** Tài khoản Barista/Cashier được seed sẵn ở Sprint 3, phân quyền theo vai trò.
* **Đánh giá chất lượng dịch vụ:** Khách hàng chấm điểm 1–5 sao kèm nhận xét sau khi nhận đồ uống.

#### B. Sprint 4 — Cổng Quản lý Admin & Kho nguyên liệu thực tế
* **Cổng quản trị danh mục món (Admin Portal):** Quản lý thực hiện thêm món mới, cập nhật hình ảnh, sửa giá bán theo size, bật/tắt bán topping.
* **Phân hệ Kho nguyên liệu thực tế & Công thức pha chế (Recipe):** Thay thế hoàn toàn cơ chế đếm số ly cũ bằng việc quản lý định lượng nguyên liệu thực tế (gam cà phê, ml sữa, siro, ly sành, ly nhựa, ống hút); khai báo công thức theo từng size món, gồm cả nguyên liệu của topping; kiểm tra đủ nguyên liệu khi tạo đơn, tự động trừ tồn kho khi đơn thanh toán thành công (hoàn kho khi hủy) và gửi cảnh báo khi nguyên liệu chạm ngưỡng tối thiểu.
* **Quản lý tài khoản nhân sự và voucher:** Quản lý tạo tài khoản, cấp quyền Barista hoặc Cashier, khóa/mở khóa tài khoản nhân viên; tạo và quản lý voucher.
* **Báo cáo thống kê kinh doanh:** Biểu đồ tổng quan doanh thu thực thu theo ngày/tuần/tháng, số đơn hoàn tất (`COMPLETED`), tỷ lệ hủy và Top 5 món bán chạy nhất.

---

### 3.3. Các nội dung không thực hiện (Out-of-Scope — Won't Have)

Để đảm bảo tính khả thi tuyệt đối và không làm phân tán nguồn lực của nhóm 2 người trong 2 Sprint, 7 nội dung sau **chính thức được loại trừ khỏi phạm vi đồ án**:

| STT | Tính năng loại trừ (Won't Have) | Lý do kỹ thuật và nghiệp vụ giải trình |
|:---:|---|---|
| **1** | **Ví tiền hoàn tiền nội bộ (Wallet Refund) & Rút tiền về ngân hàng** | Đồ án áp dụng thanh toán mô phỏng (*Simulated Payment*). Việc xây dựng ví điện tử nạp/rút tiền thật đòi hỏi quy trình đối soát giao dịch liên ngân hàng, xử lý tranh chấp bồi hoàn và chứng chỉ bảo mật tài chính PCI-DSS, vượt quá mục tiêu môn học. |
| **2** | **Hạ tầng SMS Brandname viễn thông / Gửi OTP trả phí** | Đòi hỏi chi phí đăng ký với các nhà mạng viễn thông và phí duy trì đầu số hàng tháng. Nhóm thay thế bằng xác thực mật khẩu băm bảo mật và đối chiếu nhận món bằng mã đơn hàng 6 số trực tiếp trên ứng dụng. |
| **3** | **Quản lý nhân sự, chấm công và tính lương** | Đây là nghiệp vụ quản trị nội bộ (ERP/HRM) riêng biệt, không tác động trực tiếp đến luồng giá trị cốt lõi của ứng dụng đặt cà phê. |
| **4** | **Quản lý đặt và giữ chỗ ngồi tại bàn** | Quán vận hành theo mô hình tự phục vụ linh hoạt, khách hàng tự do lựa chọn chỗ ngồi sau khi gọi món; hệ thống không lưu sơ đồ bàn ghế. |
| **5** | **Ứng dụng di động gốc (Native iOS/Android) & Giao hàng tận nơi** | Nhóm tập trung tối ưu hóa giao diện Web Mobile-First mở trực tiếp qua trình duyệt di động khi quét mã QR, phục vụ khách hàng mua tại quán hoặc mang đi. |
| **6** | **Xử lý món không làm được giữa chừng (Item Issue)** | Tình huống hiếm, thêm nhiều trạng thái và màn hình xử lý. Thay bằng hủy cả đơn (CN-10) hoặc nhân viên đổi món tương đương tại quầy, nằm ngoài hệ thống. |
| **7** | **Đổi điểm thưởng lấy quà hoặc giảm giá** | Điểm thưởng chỉ tích lũy và hiển thị (CN-07); đổi điểm kéo theo quy tắc quy đổi, hạn dùng và đối soát điểm, vượt phạm vi 2 Sprint MVP. |

---

## 4. Giả Định và Ràng Buộc Hệ Thống (Assumptions & Constraints)

### 4.1. Giả định ban đầu (Assumptions)
* **Thiết bị người dùng cuối:** Khách hàng sở hữu điện thoại thông minh có kết nối Internet ổn định (4G/Wi-Fi) và trình duyệt web hiện đại (Google Chrome, Apple Safari, Microsoft Edge).
* **Định danh khách hàng:** Khách hàng sử dụng số điện thoại di động hợp lệ tại Việt Nam (10 chữ số) để đăng ký tài khoản.
* **Cổng thanh toán:** Là dịch vụ mô phỏng nội bộ tuân thủ đúng giao thức REST API, phản ánh trung thực kết quả thành công và thất bại để phục vụ kiểm thử tự động mà không phát sinh chi phí giao dịch thật.

### 4.2. Ràng buộc kỹ thuật và quy trình (Constraints)
* **Công nghệ bắt buộc theo đề tài:**
  - Frontend: `Next.js 16` (hướng Mobile-First, Zustand, Axios, Tailwind CSS).
  - Backend: `NestJS 12` (kiến trúc Modular Monolith, TypeScript ESM, Prisma ORM 7).
  - Cơ sở dữ liệu: `PostgreSQL 16` kèm cơ chế Migration có phiên bản.
  - Ảo hóa: `Docker` và `docker-compose.yml` khởi chạy trọn vẹn toàn bộ ngăn xếp.
* **Quy trình công nghệ phần mềm:**
  - Tài liệu kỹ thuật (Task 1 đến Task 3) phải được commit vào lịch sử Git **trước** khi viết mã nguồn hiện thực.
  - Tuân thủ quy ước Git: Mỗi tính năng một nhánh (`<tên>/task-N-...`), commit message tiếng Việt có dấu theo chuẩn Conventional Commits.
  - Toàn bộ Pull Request phải vượt qua Quality Gate của CI (Install, Lint, Vitest, Build) mới được phép merge vào `main`.
  - Duy trì ma trận truy vết `traceability-matrix.md` xuyên suốt từ yêu cầu đến thiết kế, mã nguồn và kiểm thử.

---

## 5. Rủi Ro Ban Đầu và Biện Pháp Giảm Thiểu (Risks & Mitigation)

| Mã | Mô tả rủi ro kỹ thuật | Mức độ | Biện pháp phòng ngừa và xử lý kỹ thuật |
|:---:|---|:---:|---|
| **RSK-01** | **Gian lận sửa giá từ phía Client:** Người dùng can thiệp dữ liệu giỏ hàng trên trình duyệt để gửi tổng tiền sai lệch về máy chủ | **Cao** | Backend **tuyệt đối không tin tưởng giá từ client**; Server tự động đọc giá gốc trong DB và tính lại toàn bộ đơn giá, phụ thu size, topping trước khi tạo đơn (`Server-side Pricing`). |
| **RSK-02** | **Trừ tiền lặp lại do lỗi mạng hoặc bấm liên tục:** Khách bấm nút thanh toán nhiều lần khi mạng chậm | **Cao** | Client sinh UUID đính kèm header **`Idempotency-Key`**; Backend kiểm tra ràng buộc duy nhất trong CSDL để đảm bảo chỉ xử lý nghiệp vụ tài chính đúng 1 lần duy nhất. |
| **RSK-03** | **Xung đột trạng thái đơn hàng đồng thời:** Hai request cùng lúc thay đổi trạng thái của một đơn hàng | **Cao** | Áp dụng cơ chế **Khóa lạc quan (Optimistic Locking)** qua trường `version` trong bảng `Order`; câu lệnh UPDATE kiểm tra đúng version, nếu sai lập tức chặn lại và trả mã lỗi `409 Conflict`. |
| **RSK-04** | **Lộ lọt thông tin xác thực và mật khẩu:** Mật khẩu bị lộ trong log hoặc cơ sở dữ liệu | **Cao** | 100% mật khẩu được băm một chiều bằng thuật toán `bcryptjs` với salt round = 10; JWT có thời hạn 24 giờ; không đặt giá trị fallback cho `JWT_SECRET`; không commit file `.env` chứa secret vào Git. |
| **RSK-05** | **Lệch pha giữa Frontend và Backend:** Hai thành viên làm việc độc lập dẫn đến không khớp dữ liệu gọi API | **Trung bình** | Thống nhất và tuân thủ hợp đồng API tại `docs/architecture/api-contract.md`; tích hợp Swagger UI tự động tại `/docs`; mọi thay đổi hợp đồng phải được trao đổi và duyệt trước. |
| **RSK-06** | **Áp lực tiến độ 2 Sprint:** Khối lượng công việc lớn dẫn đến nguy cơ trễ hạn bàn giao | **Trung bình** | Áp dụng nghiêm ngặt mô hình **MoSCoW**: Hoàn thành 100% các hạng mục Must Have của MVP trước; các tính năng mở rộng được phân kỳ rõ ràng sang Sprint 3 và Sprint 4. |
| **RSK-07** | **Đăng ký bằng SĐT không có OTP:** Có thể đăng ký bằng số điện thoại của người khác vì hệ thống không xác minh quyền sở hữu số | **Thấp** | Chấp nhận như giới hạn đã biết của đồ án (OTP/SMS thuộc mục Won't Have); ghi rõ trong SRS. Mật khẩu băm và JWT vẫn bảo vệ phiên làm việc. |
| **RSK-08** | **Khởi động chậm của dịch vụ gói miễn phí:** API trên Render gói miễn phí có thể mất vài chục giây cho lần gọi đầu, ảnh hưởng mục tiêu G1 và buổi demo | **Trung bình** | Gọi `GET /health` làm nóng API trước khi demo hoặc nghiệm thu; độ trễ khởi động lần đầu (cold start) của dịch vụ miễn phí không tính vào NFR hiệu năng phản hồi của G1, chỉ đo sau khi dịch vụ đã khởi động xong. |

---

## 6. Danh Mục Thống Nhất: Chức Năng, Use Case, Yêu Cầu và Vòng Đời Đơn

Đây là phần định nghĩa chuẩn của các mã dùng xuyên suốt tài liệu. Mọi SRS, sơ đồ, issue và `docs/traceability-matrix.md` phải dùng đúng các mã dưới đây. MoSCoW: `Must` và `Should` thuộc MVP, bắt buộc hiện thực; `Could` là **Planned** (chỉ có tài liệu và sơ đồ).

### 6.1. 13 chức năng lớn (CN)

| Mã | Tên chức năng | Sprint | MoSCoW | Phụ trách | FR | UC |
|:---:|---|:---:|:---:|:---:|---|---|
| `CN-01` | Nền tảng kỹ thuật và CI/CD tự động | 1 và 2 | Must | Long | (thuộc NFR-02, NFR-03) | — |
| `CN-02` | Xem menu đồ uống Mobile-first | 1 | Must | Tài | FR-01 | UC-01 |
| `CN-03` | Modal chi tiết và tùy chọn món | 2 | Must | Tài | FR-02 | UC-02 |
| `CN-04` | Quản lý giỏ hàng (client store) | 2 | Must | Tài | FR-03 | UC-03 |
| `CN-05` | Xác thực tài khoản bằng số điện thoại | 2 | Must | Long | FR-04 | UC-04 |
| `CN-06` | Đặt hàng và thanh toán không tiền mặt | 2 | Must | Long và Tài | FR-05, FR-06, FR-08, FR-09 | UC-05 |
| `CN-07` | Lịch sử, theo dõi đơn và tích điểm | 2 | Must (FR-07), Should (FR-10) | Long và Tài | FR-07, FR-10 | UC-06, UC-20 |
| `CN-08` | Màn hình pha chế KDS cho Barista | 3 | Could | Long và Tài | FR-20 | UC-11 |
| `CN-09` | Giao nhận quầy và mã 6 số | 3 | Could | Long và Tài | FR-21 | UC-07, UC-12 |
| `CN-10` | Tiện ích khách: voucher, hủy đơn, đánh giá | 3 | Could | Long và Tài | FR-11 (phía khách), FR-12, FR-13 | UC-10, UC-08, UC-13, UC-09 |
| `CN-11` | Quản lý menu, danh mục, topping (CRUD) | 4 | Could | Long và Tài | FR-18 | UC-15 |
| `CN-12` | Kho nguyên liệu và công thức pha chế | 4 | Could | Long và Tài | FR-15, FR-16, FR-17 | UC-14, UC-16, UC-17 |
| `CN-13` | Quản trị nhân sự, voucher và báo cáo | 4 | Could | Long và Tài | FR-11 (phía Manager), FR-14, FR-19 | UC-18, UC-21, UC-19 |

### 6.2. 21 use case (UC)

| Mã | Tên use case | Tác nhân chính | Quan hệ | Sprint | FR |
|:---:|---|---|---|:---:|---|
| `UC-01` | Xem menu sản phẩm | Khách hàng | — | 1 | FR-01 |
| `UC-02` | Xem chi tiết và tùy chọn món | Khách hàng | — | 2 | FR-02 |
| `UC-03` | Quản lý giỏ hàng | Khách hàng | — | 2 | FR-03 |
| `UC-04` | Đăng ký / Đăng nhập tài khoản | Khách hàng | — | 2 | FR-04 |
| `UC-05` | Đặt hàng và thanh toán | Khách hàng, Cổng thanh toán (mô phỏng) | `<<include>>` UC-04; `<<extend>>` UC-10 | 2 | FR-05, FR-06, FR-08, FR-09 |
| `UC-06` | Xem lịch sử và theo dõi đơn hàng | Khách hàng | — | 2 | FR-07 |
| `UC-20` | Xem điểm tích lũy và lịch sử thưởng | Khách hàng | — | 2 | FR-10 |
| `UC-11` | Pha chế và cập nhật tiến độ | Barista | — | 3 | FR-20 |
| `UC-07` | Nhận đồ uống bằng mã 6 số | Khách hàng | — | 3 | FR-21 |
| `UC-12` | Xác nhận mã 6 số và giao món | Cashier | — | 3 | FR-21 |
| `UC-10` | Áp dụng mã khuyến mãi | Khách hàng | `<<extend>>` UC-05 | 3 | FR-11 |
| `UC-08` | Hủy đơn hàng khi chưa pha | Khách hàng | `<<extend>>` UC-06 | 3 | FR-12 |
| `UC-13` | Xử lý hủy đơn tại quầy | Cashier | — | 3 | FR-12 |
| `UC-09` | Đánh giá và gửi phản hồi | Khách hàng | `<<extend>>` UC-06 | 3 | FR-13 |
| `UC-15` | Quản lý danh mục và món đồ uống | Quản lý | — | 4 | FR-18 |
| `UC-16` | Quản lý công thức pha chế | Quản lý | — | 4 | FR-16 |
| `UC-14` | Nhập kho nguyên liệu thực tế | Barista, Manager | — | 4 | FR-15 |
| `UC-17` | Quản lý tồn kho và cảnh báo nguyên liệu | Quản lý | — | 4 | FR-15, FR-17 |
| `UC-18` | Quản lý tài khoản nhân viên | Quản lý | — | 4 | FR-19 |
| `UC-21` | Quản lý mã khuyến mãi (tạo voucher) | Quản lý | — | 4 | FR-11 |
| `UC-19` | Báo cáo thống kê doanh thu và sản lượng | Quản lý | — | 4 | FR-14 |

### 6.3. 21 yêu cầu chức năng (FR)

| Mã | Yêu cầu | Chức năng | Sprint | MoSCoW |
|:---:|---|:---:|:---:|:---:|
| `FR-01` | Xem menu theo danh mục, tìm kiếm/lọc, nhãn Sold out theo `isAvailable` | CN-02 | 1 | Must |
| `FR-02` | Chọn size, topping, xem giá tạm tính | CN-03 | 2 | Must |
| `FR-03` | Quản lý giỏ hàng phía client (thêm/sửa/xóa, lưu `localStorage`) | CN-04 | 2 | Must |
| `FR-04` | Đăng ký, đăng nhập bằng SĐT, cấp và kiểm tra JWT, gán vai trò | CN-05 | 2 | Must |
| `FR-05` | Tạo đơn, server tự tính tổng tiền từ CSDL (Server-side Pricing) | CN-06 | 2 | Must |
| `FR-06` | Thanh toán mô phỏng Thẻ/Ví, không lưu số thẻ thô | CN-06 | 2 | Must |
| `FR-07` | Xem lịch sử đơn của mình và theo dõi trạng thái (polling) | CN-07 | 2 | Must |
| `FR-08` | Vòng đời đơn theo bảng chuyển trạng thái, khóa lạc quan `version` | CN-06 | 2 | Must |
| `FR-09` | Chống gửi trùng bằng `Idempotency-Key` (tạo đơn, thanh toán) | CN-06 | 2 | Must |
| `FR-10` | Tích điểm 1 điểm/1.000đ khi `PAID`, xem số dư và lịch sử điểm | CN-07 | 2 | Should |
| `FR-11` | Voucher: áp mã khi checkout (khách) và tạo/quản lý mã (Manager) | CN-10, CN-13 | 3, 4 | Could |
| `FR-12` | Hủy đơn trước khi pha chế, ghi lý do, hoàn tiền/kho/điểm | CN-10 | 3 | Could |
| `FR-13` | Đánh giá 1–5 sao kèm nhận xét cho đơn `COMPLETED` | CN-10 | 3 | Could |
| `FR-14` | Báo cáo doanh thu, số đơn, tỷ lệ hủy, Top 5 món | CN-13 | 4 | Could |
| `FR-15` | Kho nguyên liệu: nhập kho có lưu vết, theo dõi tồn, trừ/hoàn kho tự động | CN-12 | 4 | Could |
| `FR-16` | Công thức pha chế theo món, size và topping | CN-12 | 4 | Could |
| `FR-17` | Cảnh báo khi nguyên liệu chạm ngưỡng tối thiểu | CN-12 | 4 | Could |
| `FR-18` | Quản lý danh mục, món, topping, phụ thu size (CRUD) | CN-11 | 4 | Could |
| `FR-19` | Quản lý tài khoản nhân viên: tạo, gán vai trò, khóa/mở khóa | CN-13 | 4 | Could |
| `FR-20` | Màn hình KDS cho Barista: nhận đơn `PAID`, chuyển `PREPARING`, `READY` | CN-08 | 3 | Could |
| `FR-21` | Sinh `pickupCode` khi `READY`; Cashier đối chiếu mã và hoàn tất `COMPLETED` | CN-09 | 3 | Could |

### 6.4. 5 yêu cầu phi chức năng (NFR)

| Mã | Nhóm | Nội dung |
|:---:|---|---|
| `NFR-01` | Bảo mật | Không tin giá từ client; mật khẩu băm `bcryptjs`; JWT 24 giờ, không có giá trị mặc định cho `JWT_SECRET`; không lưu số thẻ thô; không commit secret |
| `NFR-02` | Độ tin cậy và sẵn sàng | Không đặt ngưỡng tốc độ vì phụ thuộc hạ tầng và mạng. Production qua HTTPS, có `GET /health`; kết quả đúng khi gửi trùng hoặc đồng thời (`Idempotency-Key`, `version`); lỗi trả đúng mã, không lộ chi tiết nội bộ; môi trường tái tạo được bằng Docker Compose, migration và seed (xem RSK-08 về khởi động chậm) |
| `NFR-03` | Chất lượng và bảo trì | Mọi PR qua CI (Install, Lint, Test, Build); API theo `docs/architecture/api-contract.md`, có Swagger tại `/docs`; migration có phiên bản |
| `NFR-04` | Khả dụng (usability) | Mobile-first; menu có đủ 3 trạng thái Loading, Empty, Error và Retry |
| `NFR-05` | Hiệu năng giao diện | Chỉ đo sau khi API đã khởi động xong (không tính cold start, xem RSK-08): FCP không quá 1,5 giây trên 4G, TBT không quá 200 ms, đổi size/topping cập nhật giá trong 50 ms, luồng từ duyệt menu đến thanh toán xong trong 60 giây (mục tiêu G1) |

### 6.5. Vòng đời đơn hàng

Trạng thái: `PENDING`, `PAID`, `PAYMENT_FAILED`, `PREPARING`, `READY`, `COMPLETED`, `CANCELLED`. Mọi lần chuyển đều kiểm tra `version` (khóa lạc quan), sai thì trả 409. **Ở MVP (Sprint 2) chỉ có 3 trạng thái đầu**; 4 trạng thái sau thuộc Sprint 3, Planned.

| Từ | Sang | Ai thực hiện | Sprint | Ghi chú |
|---|---|---|:---:|---|
| `PENDING` | `PAID` | Khách (thanh toán) | 2 | Cộng điểm; trừ kho (từ Sprint 4) |
| `PENDING` | `PAYMENT_FAILED` | Hệ thống | 2 | Thẻ `0000`, ví trên 500.000đ |
| `PAYMENT_FAILED` | `PAID` | Khách (thanh toán lại) | 2 | |
| `PENDING`, `PAYMENT_FAILED` | `CANCELLED` | Khách | 3 | Chưa trả tiền nên không hoàn tiền |
| `PAID` | `PREPARING` | Barista | 3 | |
| `PAID` | `CANCELLED` | Khách hoặc Cashier | 3 | Hoàn tiền mô phỏng, trừ lại điểm; hoàn kho từ Sprint 4 |
| `PREPARING` | `READY` | Barista | 3 | Sinh `pickupCode` |
| `READY` | `COMPLETED` | Cashier | 3 | Nhập đúng `pickupCode` |

Không có đường hủy từ `PREPARING`, `READY`, `COMPLETED`. `PAID` sang `PAID` bị chặn (409). Tình huống Barista bấm `PREPARING` đúng lúc khách bấm hủy được giải quyết bằng `version`: bên đến sau nhận 409.

### 6.6. Các quyết định đã chốt

1. **Kho (Sprint 4):** kiểm tra đủ nguyên liệu (cả topping) khi tạo đơn, từ chối nếu thiếu; trừ kho có điều kiện (`tồn >= cần`) trong cùng transaction với việc chuyển `PAID`; hủy đơn đã `PAID` thì hoàn kho. Trước đó dùng cờ `isAvailable`.
2. **Theo dõi đơn:** polling khoảng 5 giây cho cả app khách và KDS, không dùng WebSocket.
3. **Tài khoản nhân viên và voucher ở Sprint 3:** seed sẵn trong CSDL, kèm phân quyền theo vai trò; giao diện quản lý làm ở Sprint 4.
4. **Hủy đơn:** theo bảng 6.5. Hoàn tiền mô phỏng chỉ ghi nhận thời điểm hoàn và lý do hủy, không thêm trạng thái mới.
5. **Voucher:** một mã mỗi đơn; điều kiện gồm hạn dùng, đơn tối thiểu, tổng lượt dùng tối đa; server tính giảm giá. Điểm thưởng tính trên số tiền thực trả (sau giảm).
6. **Điểm thưởng:** chỉ tích, chưa đổi. Lịch sử điểm suy ra từ các lần thanh toán thành công, không cần sổ điểm riêng. Hủy đơn đã `PAID` thì trừ lại điểm.
7. **Định nghĩa báo cáo:** doanh thu thực thu là tổng tiền các đơn `PAID`, `PREPARING`, `READY`, `COMPLETED`; đơn hoàn tất là `COMPLETED`; tỷ lệ hủy là số `CANCELLED` chia tổng đơn tạo trong kỳ.
8. **Mã nhận hàng:** `pickupCode` duy nhất trong số đơn đang `READY`, dùng để đối chiếu, không phải bí mật bảo mật.
9. **Topping và phụ thu size:** Sprint 2 dùng bảng giá cố định (Size S +0đ, M +5.000đ, L +10.000đ; Trân châu đen 8.000đ, Kem cheese 10.000đ, Thạch cà phê 6.000đ). Sprint 4 chuyển sang CSDL; đơn lưu giá tại thời điểm đặt nên đổi giá không ảnh hưởng lịch sử.
10. **QR tại bàn:** QR chỉ mở đường dẫn web, không gắn với bàn.
11. **Giới hạn đã biết:** xác thực bằng SĐT và mật khẩu, không có OTP (xem RSK-07).
