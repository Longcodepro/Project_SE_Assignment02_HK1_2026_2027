# Bối cảnh, stakeholder và phạm vi hệ thống (Task 1.1)

> **Dự án:** Ứng dụng đặt cà phê không tiền mặt BrewLite
> **Môn học:** Công nghệ phần mềm — Học kỳ 1, năm học 2026–2027
> **Nhóm thực hiện:**
> - **Nguyễn Thành Long (`Longcodepro`)** — Backend, Scrum Master, DevOps, kiến trúc
> - **Trần Quốc Tài (`TaiTran263`)** — Frontend UI/UX, quản trị trạng thái client, QA
>
> **Tạo phẩm của Issue #33.** Tài liệu liên quan: `srs.md` (yêu cầu chức năng và phi chức năng), `../architecture/api-contract.md` (hợp đồng API), `../traceability-matrix.md` (ma trận truy vết).

---

## 1. Bối cảnh và vấn đề nghiệp vụ cần giải quyết

### 1.1. Thực trạng vận hành truyền thống

Tại các quán cà phê vừa và nhỏ hiện nay, quy trình phục vụ diễn ra thủ công tại quầy thu ngân: khách xếp hàng, gọi món với nhân viên, trả tiền, nhận máy rung rồi chờ gọi. Khách tự chọn chỗ ngồi, quán không quản lý chỗ ngồi. Cách làm này phát sinh bốn vấn đề:

| Mã | Vấn đề | Hệ quả |
|:---:|---|---|
| **P1** | **Ùn tắc giờ cao điểm.** Khách phải xếp hàng dài chờ tới lượt gọi món | Khách khó chịu, giảm trải nghiệm; nhân viên bận nhập đơn thay vì phục vụ |
| **P2** | **Thanh toán tiền mặt chậm và dễ sai.** Nhận tiền, đếm lại, thối tiền tốn thời gian; khách chuyển khoản còn phải chờ nhân viên đối chiếu giao dịch mới được ghi đơn | Dễ nhầm lẫn và thất thoát doanh thu; nhân viên vừa nhận tiền vừa pha chế nên tiềm ẩn rủi ro vệ sinh an toàn thực phẩm |
| **P3** | **Sai sót khi tiếp nhận yêu cầu.** Khách có nhiều lựa chọn khác nhau (size, topping, mức đường, mức đá, nóng hoặc lạnh, yêu cầu riêng). Nhân viên ghi tay hoặc truyền miệng | Pha nhầm món, sai định lượng, phải làm lại |
| **P4** | **Không kiểm soát được nguyên liệu.** Quán không có công cụ biết tức thời còn pha được bao nhiêu ly | Nhận đơn của khách rồi mới phát hiện hết nguyên liệu và phải hủy; không có số liệu tồn kho và lịch sử nhập |

### 1.2. Giải pháp hệ thống BrewLite

**BrewLite** là ứng dụng web theo hướng **mobile-first**, giải quyết bài toán đặt món và thanh toán không tiền mặt:

* **Tự phục vụ tiện lợi:** khách quét mã QR tại bàn hoặc mở ứng dụng trên điện thoại để duyệt menu, chọn món kèm tùy chọn (size, topping, mức đường, mức đá, nóng hoặc lạnh, yêu cầu riêng), thêm vào giỏ và đặt món mà không cần tới quầy $\rightarrow$ Giải quyết vấn đề P1 và P3.
* **Thanh toán không tiền mặt tức thì:** tích hợp cơ chế thanh toán mô phỏng (ví điện tử, thẻ ngân hàng, chuyển khoản), tự động xác nhận đơn ngay khi giao dịch thành công, không chờ nhân viên xác minh $\rightarrow$ Giải quyết vấn đề P2.
* **Kiểm soát nguyên liệu theo công thức:** mỗi món có công thức theo từng size. Khi thanh toán thành công, hệ thống tự trừ nguyên liệu và ghi lịch sử; thiếu nguyên liệu thì chặn ngay trước khi thu tiền $\rightarrow$ Giải quyết vấn đề P4.
* **Số hóa quy trình đơn hàng:** đơn sau khi thanh toán vào thẳng hàng đợi của pha chế. Khách theo dõi trạng thái đơn trên điện thoại và nhận món bằng mã nhận hàng 6 số, thay cho máy rung.

### 1.3. Mục tiêu hệ thống

| Mã | Mục tiêu | Giải quyết vấn đề |
|:---:|---|:---:|
| **G1** | Khách tự gọi món và thanh toán trên điện thoại, không phải xếp hàng tại quầy, tùy chọn được ghi chính xác theo đúng ý khách | P1, P2, P3 |
| **G2** | Hệ thống tự kiểm tra và trừ nguyên liệu theo công thức mỗi khi bán, có lịch sử nhập kho và cảnh báo sắp hết | P4 |
| **G3** | Khách theo dõi trạng thái đơn và nhận món tại quầy bằng mã nhận hàng, thay cho máy rung | P1 |

### 1.4. Luồng nghiệp vụ chính

Khách ngồi vào bàn, quét QR mở ứng dụng → xem menu → chọn size, topping, mức đường, mức đá (và nóng hoặc lạnh) → thêm vào giỏ → chọn mang về hoặc tại quán → đăng nhập bằng số điện thoại và mật khẩu → thanh toán mô phỏng → hệ thống kiểm tra và trừ nguyên liệu, tạo đơn `PAID` → pha chế làm món (`PREPARING`, rồi `READY`) → khách nhận mã 6 số khi món sẵn sàng, đến quầy đọc mã → nhân viên giao món (`COMPLETED`).

Hệ thống không lưu chỗ ngồi: khách muốn ngồi đâu thì ngồi.

---

## 2. Bảng phân tích các bên liên quan (Stakeholder analysis)

Đề bài nêu 6 nhóm stakeholder. Nhóm tách **nhân viên quầy** thành hai vai trò riêng là **pha chế** và **nhân viên giao món**, vì ở quán thật đây là hai người với hai mối quan tâm khác nhau, và hệ thống cũng phân quyền riêng cho từng vai trò. Vì vậy bảng có 7 nhóm.

| STT | Stakeholder | Vai trò trong hệ thống | Mục tiêu chính | Kỳ vọng đối với phần mềm |
|:---:|---|---|---|---|
| **1** | **Khách hàng**<br>*(Customer)* | Người dùng cuối mua và thưởng thức đồ uống | Đặt đồ uống nhanh, chính xác theo ý muốn, không phải xếp hàng chờ đợi | • Giao diện trên điện thoại mượt, dễ chọn món.<br>• Tùy chọn size, topping, mức đường, mức đá trực quan, thấy ngay tổng tiền.<br>• Thanh toán không tiền mặt an toàn, không bị trừ tiền hai lần.<br>• Đã bị trừ tiền thì chắc chắn có đơn; thất bại thì giỏ còn nguyên để thử lại.<br>• Tra cứu được lịch sử đơn của mình. |
| **2** | **Pha chế**<br>*(Barista)* | Làm món theo đơn đã thanh toán và nhập nguyên liệu vào kho | Làm món đúng thứ tự, không bị thiếu nguyên liệu giữa buổi | • Hàng đợi hiện đơn cũ nhất trước.<br>• Thông tin món rõ ràng: size, danh sách topping, mức đường, mức đá, yêu cầu riêng.<br>• Chỉ nhận đơn đã thanh toán thành công (`PAID`).<br>• Nhập kho nhanh, thấy cảnh báo nguyên liệu sắp hết. |
| **3** | **Nhân viên giao món**<br>*(Counter staff)* | Giao đồ uống cho khách và xử lý hủy đơn | Giao đúng món cho đúng khách, giảm áp lực nhận order thủ công | • Nhập mã nhận hàng là biết ngay đơn nào.<br>• Không phải đối chiếu chuyển khoản thủ công.<br>• Không phải xử lý tiền mặt và tiền lẻ thối.<br>• Hủy đơn có ghi lý do, rõ ràng, không gây tranh cãi với khách. |
| **4** | **Quản lý cửa hàng**<br>*(Store manager)* | Quản trị vận hành, danh mục sản phẩm, nguyên liệu và tài khoản | Nâng cao hiệu suất phục vụ giờ cao điểm; kiểm soát nguyên liệu và doanh thu | • Cấu hình được món, giá từng size, các tùy chọn và giá trị mặc định.<br>• Khai công thức theo size, đặt ngưỡng cảnh báo tồn kho.<br>• Biết nguyên liệu sắp hết; có lịch sử nhập kèm người thực hiện.<br>• Tạo và khóa được tài khoản nhân viên.<br>• Dữ liệu đơn hàng minh bạch, không thất thoát doanh thu. |
| **5** | **Đơn vị thanh toán**<br>*(Payment provider)* | Cổng trung gian cung cấp hạ tầng thanh toán số. Trong MVP là dịch vụ mô phỏng nội bộ | Đảm bảo tính toàn vẹn, bảo mật và chính xác của giao dịch | • Nhận yêu cầu đúng định dạng, không bị gửi trùng nhờ header `Idempotency-Key`.<br>• Phản hồi trạng thái rõ ràng: thành công hoặc từ chối.<br>• Hệ thống gọi theo hợp đồng ổn định để sau này thay bằng cổng thật. |
| **6** | **Nhóm phát triển**<br>*(Development team)* | Xây dựng, kiểm thử, triển khai và bảo trì hệ thống | Tạo sản phẩm đạt chuẩn kiến trúc, dễ mở rộng, kiểm thử tự động | • Cấu trúc monorepo phân tách rõ `apps/web` và `apps/api`.<br>• Hợp đồng API chốt sớm để hai người làm song song không lệch nhau.<br>• Pipeline CI/CD tự phát hiện lỗi và đóng gói container.<br>• Phạm vi vừa sức 2 người trong 2 sprint.<br>• Code sạch, có migration và tài liệu kỹ thuật đồng bộ. |
| **7** | **Giảng viên nghiệm thu**<br>*(Evaluator / Client)* | Đánh giá chất lượng dự án và nghiệm thu sản phẩm | Thẩm định năng lực kỹ thuật và quy trình công nghệ phần mềm của nhóm | • Tuân thủ quy trình từ yêu cầu, thiết kế, CI/CD đến deployment.<br>• Ma trận truy vết đầy đủ từ mã yêu cầu tới sơ đồ, code và test.<br>• Có phiên bản chạy trực tiếp trên Internet, truy cập được qua HTTPS. |

---

## 3. Phạm vi sản phẩm (Product scope)

### 3.1. Phạm vi trong MVP (In-scope — thực hiện trong Sprint 1 và 2)

Các hạng mục được chia hai mức ưu tiên. **Ưu tiên 1** là luồng khách end-to-end mà đề bắt buộc; **ưu tiên 2** làm sau khi luồng khách đã chạy.

#### Ưu tiên 1 — luồng khách end-to-end

* **Menu và chi tiết món:**
  * Xem danh sách đồ uống phân theo danh mục (cà phê pha phin, espresso, cold brew, trà sữa và các danh mục khác).
  * Hiển thị chi tiết từng món: tên, mô tả, ảnh, giá khởi điểm, tình trạng còn bán.
  * Chọn kích cỡ S, M, L với **giá do quản lý nhập riêng cho từng món** (không dùng phụ thu cố định, vì chênh lệch giá giữa các size khác nhau theo từng loại đồ uống).
  * Chọn topping, mức đường, mức đá và nhiệt độ theo đúng cấu hình của món đó. Món chỉ bán nóng thì không hiện lựa chọn lạnh và không hiện mức đá.
  * Nhập yêu cầu riêng dạng chữ cho từng món.
* **Giỏ hàng phía client (Zustand và LocalStorage):**
  * Thêm món kèm toàn bộ tùy chọn; tăng, giảm số ly; xóa dòng.
  * Hai dòng giống nhau hoàn toàn thì gộp thành một dòng, số ly cộng dồn.
  * **Mỗi đơn tối đa 99 ly** tính trên tổng mọi dòng.
  * Tự động tính tổng tiền tạm tính theo thời gian thực.
  * Khách chưa đăng nhập vẫn thêm được vào giỏ; giỏ lưu trên trình duyệt.
* **Xác thực và phân quyền:**
  * Đăng ký và đăng nhập bằng **số điện thoại Việt Nam và mật khẩu**; email không bắt buộc. Dùng số điện thoại vì đây là thông tin khách quán cà phê luôn có và nhớ, còn email thì nhiều người không dùng thường xuyên.
  * Băm mật khẩu bằng `bcryptjs`.
  * Cấp và quản lý phiên bằng `JSON Web Token`, hết hạn sau 24 giờ, thu hồi khi đăng xuất.
  * Bảo vệ các endpoint đặt hàng và thanh toán bằng `JwtAuthGuard` và kiểm tra vai trò.
  * Bốn vai trò: khách hàng, pha chế, nhân viên giao món, quản lý.
* **Đặt đơn và thanh toán mô phỏng (gộp một bước checkout):**
  * Khách chọn **mang về hoặc tại quán** cho cả đơn.
  * Server tự tính lại tổng tiền từ cơ sở dữ liệu để chống gian lận giá từ client.
  * Ba hình thức: **ví điện tử**, **thẻ ngân hàng**, **chuyển khoản**. Quy tắc mô phỏng: ví và chuyển khoản luôn thành công; thẻ có hai số cuối là `99` thì giao dịch bị từ chối.
  * Thanh toán thành công thì mới tạo đơn, ở trạng thái `PAID`.
  * Thanh toán thất bại thì không tạo đơn, không trừ nguyên liệu, giỏ hàng còn nguyên để khách đổi hình thức và thử lại.
  * Chống trừ tiền trùng lặp bằng **`Idempotency-Key`** bắt buộc.
  * Xem hóa đơn ngay trong ứng dụng sau khi thanh toán.
* **Theo dõi và lịch sử đơn:**
  * Khách tra cứu danh sách đơn của chính mình, mới nhất trước.
  * Trạng thái tự làm mới khi đơn chưa kết thúc.
  * Mã nhận hàng 6 số hiện khi đơn sang `READY`, ở dạng số và dạng QR.

#### Ưu tiên 2 — vận hành trong quán

* **Xử lý đơn:** vòng đời `PAID` → `PREPARING` → `READY` → `COMPLETED`, thêm nhánh `CANCELLED`. Pha chế chuyển hai bước đầu, nhân viên giao món nhập mã nhận hàng để hoàn tất. Hàng đợi xếp đơn cũ nhất trước.
* **Kho nguyên liệu và công thức:** tạo nguyên liệu (tên, đơn vị `g`, `ml`, `cái`, ngưỡng cảnh báo); nhập kho có lưu lịch sử kèm tài khoản thực hiện; công thức theo từng size; trừ kho trong cùng giao dịch với việc tạo đơn; thiếu nguyên liệu thì chặn và gợi ý cách xử lý cho khách. Bao bì cũng tính là nguyên liệu: mang về trừ ly, nắp, ống hút và một túi mỗi đơn; tại quán dùng ly sành nên chỉ trừ ống hút.
* **Hủy đơn:** khách hoặc nhân viên hủy được khi đơn còn `PAID`, có ghi lý do, hoàn đúng lượng nguyên liệu đã trừ và ghi nhận hoàn tiền mô phỏng.
* **Gợi ý lựa chọn phổ biến và nhãn bán chạy:** thống kê 30 ngày gần nhất để gợi ý mức đường, mức đá, nhiệt độ và topping được chọn nhiều nhất cho từng món, kèm nhãn "Bán chạy" trên menu.
* **Quản trị:** quản lý cấu hình món, công thức, ngưỡng cảnh báo; tạo và khóa tài khoản nhân viên.

#### Hạ tầng và vận hành

* Đóng gói toàn bộ hệ thống bằng Docker và Docker Compose.
* Pipeline CI/CD tự kiểm tra lint, test, build và đóng gói container image lên GHCR.
* Triển khai môi trường production truy cập công khai qua HTTPS, có health check.
* Giao diện **mobile-first**: tối ưu cho điện thoại trước, vì khách quét QR là mở ngay trong trình duyệt.

#### Phương án dự phòng

Nếu thiếu thời gian, kho nguyên liệu được lùi về cách đơn giản hơn: nhân viên tự khóa những món đã hết hàng. Luồng khách ưu tiên 1 vẫn phải hoàn chỉnh.

---

### 3.2. Phạm vi mở rộng tương lai (Future scope — hậu Sprint 2)

Các tính năng đã quy hoạch trong product backlog, triển khai ở giai đoạn sau nếu còn thời gian:

* **Khuyến mãi và voucher (`Promotion`):** nhập mã giảm giá theo số tiền cố định hoặc theo phần trăm khi thanh toán.
* **Tích điểm khách hàng thân thiết (`LoyaltyTransaction`):** tích điểm theo giá trị đơn đã thanh toán. Để ngoài MVP vì không phục vụ bốn vấn đề P1 đến P4, nhưng lớp dữ liệu vẫn xuất hiện trong class diagram theo yêu cầu của đề, kèm ghi chú chưa hiện thực.
* **Progressive Web App đầy đủ:** manifest, service worker, cài được vào màn hình chính, chạy được khi mất mạng. MVP chỉ làm mobile-first.
* **Đánh giá dịch vụ:** khách gửi đánh giá 1 đến 5 sao và bình luận sau khi hoàn thành đơn.
* **Báo cáo thống kê:** bảng điều khiển cho quản lý xem doanh thu, số đơn theo ngày và tuần, top món bán chạy.
* **Thông báo trong ứng dụng** khi đơn chuyển trạng thái.
* **Xác thực OTP bằng mã giả**, không tốn phí tin nhắn.
* **Xử lý món lỗi giữa chừng:** hoàn tiền từng món khi pha chế không làm được một món trong đơn.

---

### 3.3. Các nội dung không thực hiện (Out-of-scope — Won't have)

Để đảm bảo tính khả thi và tập trung vào luồng cốt lõi trong 2 sprint của nhóm 2 người, các nội dung sau **chính thức nằm ngoài phạm vi**:

1. **Ví nạp và rút tiền ngân hàng thật:** không xây dựng hệ thống quản lý số dư ví nội bộ, không nạp tiền từ tài khoản ngân hàng, không rút tiền về tài khoản thực tế. Hủy đơn chỉ ghi nhận hoàn tiền mô phỏng.
2. **Quản lý nhân sự và chấm công:** không xếp ca, không chấm công, không bảng lương.
3. **Kho nguyên liệu nâng cao:** không đặt hàng nhà cung cấp, không theo dõi hạn sử dụng, không kiểm kê định kỳ, không tính hao hụt. Kho trong MVP chỉ gồm nguyên liệu, công thức, nhập kho và trừ khi bán.
4. **Hạ tầng SMS brandname viễn thông:** không tích hợp tổng đài gửi OTP qua tin nhắn. Xác thực dựa hoàn toàn vào mật khẩu đã băm và JWT.
5. **Thanh toán thật qua cổng ngân hàng:** chỉ dùng dịch vụ mô phỏng nội bộ, không phát sinh giao dịch và chi phí thật.
6. **Quản lý chỗ ngồi:** khách muốn ngồi đâu thì ngồi, hệ thống không lưu.
7. **Ứng dụng di động gốc, đa chi nhánh và giao hàng tận nơi.**

---

## 4. Giả định và ràng buộc (Assumptions & Constraints)

### 4.1. Giả định ban đầu

* **Người dùng cuối:** có điện thoại thông minh hoặc máy tính với trình duyệt web hiện đại (Chrome, Safari, Edge) và kết nối Internet ổn định.
* **Khách hàng:** có số điện thoại Việt Nam; email không bắt buộc.
* **Cổng thanh toán:** là dịch vụ mô phỏng nội bộ, tuân thủ đúng đặc tả lỗi nghiệp vụ (thẻ hai số cuối `99` bị từ chối) để phục vụ kiểm thử tự động mà không phát sinh chi phí giao dịch thật.
* **Kho:** mỗi quán có một kho; lượng nguyên liệu là số nguyên theo đơn vị `g`, `ml` hoặc `cái`.
* **Bao bì:** món tại quán dùng ly sành nên chỉ trừ ống hút; món mang về trừ thêm ly, nắp và túi.
* **Dữ liệu ban đầu:** danh mục, món, giá từng size, topping, nguyên liệu và công thức mẫu được thiết lập qua kịch bản khởi tạo dữ liệu (*database seed*).

### 4.2. Ràng buộc kỹ thuật và quy trình

* **Công nghệ bắt buộc theo đề bài:**
  * **Frontend:** `Next.js`, hướng mobile-first.
  * **Backend:** `NestJS` với kiến trúc module hóa.
  * **Cơ sở dữ liệu:** `PostgreSQL` kèm cơ chế migration.
  * **Đóng gói:** có `docker-compose.yml` để chạy toàn bộ hệ thống ở máy local.
* **Quy trình phần mềm:**
  * Tài liệu Task 1 đến 3 phải có trong lịch sử git **trước** khi viết code. Task sau chỉ được nghiệm thu khi tạo phẩm của task trước đã có commit rõ ràng.
  * Mọi thay đổi mã nguồn qua Pull Request, vượt cổng kiểm soát chất lượng (CI: install, lint, unit test, build) và được thành viên còn lại review.
  * Duy trì ma trận truy vết `../traceability-matrix.md` xuyên suốt từ yêu cầu đến mã nguồn và kiểm thử.
  * Đổi hợp đồng API phải báo thành viên còn lại trước khi sửa.
* **Tài nguyên:** nhóm 2 thành viên, thời gian gói gọn trong 2 sprint của học kỳ.

---

## 5. Rủi ro ban đầu và biện pháp giảm thiểu (Initial risks & mitigation)

| Mã rủi ro | Mô tả rủi ro | Mức độ | Biện pháp phòng ngừa và xử lý |
|:---:|---|:---:|---|
| **RSK-01** | **Trừ kho sai khi nhiều khách thanh toán cùng lúc:** hai khách cùng đặt món dùng chung nguyên liệu gần hết | Cao | Đặt việc kiểm kho, trừ kho và tạo đơn trong **cùng một database transaction**; trừ bằng lệnh có điều kiện tồn lớn hơn hoặc bằng lượng cần nên tồn kho không thể âm; có test mô phỏng nhiều yêu cầu đồng thời |
| **RSK-02** | **Trừ tiền lặp lại do lỗi mạng:** khách bấm nút thanh toán liên tiếp nhiều lần | Cao | Client sinh UUID đính kèm header **`Idempotency-Key`**; backend ghi nhận key để chỉ xử lý đúng một giao dịch tài chính duy nhất, gửi lại thì trả kết quả lần đầu |
| **RSK-03** | **Gian lận sửa giá từ client:** người dùng sửa dữ liệu giỏ hàng trên trình duyệt để gửi giá sai về máy chủ | Cao | Backend **tuyệt đối không tin giá từ client**; server truy vấn bảng giá trong cơ sở dữ liệu để tính lại tổng tiền trước khi tạo đơn, lệch thì từ chối |
| **RSK-04** | **Lộ mật khẩu hoặc token** | Cao | Băm mật khẩu có salt; JWT hết hạn 24 giờ và bị thu hồi khi đăng xuất; không có giá trị mặc định cho khóa ký JWT; không commit secret hay chuỗi kết nối vào git |
| **RSK-05** | **Lệch pha giữa frontend và backend:** hai thành viên phát triển độc lập dẫn đến không khớp dữ liệu gọi API | Trung bình | Chốt và tuân thủ hợp đồng API tại `../architecture/api-contract.md`; tích hợp Swagger UI tại `/docs`; đổi hợp đồng phải báo người kia |
| **RSK-06** | **Áp lực tiến độ 2 sprint:** khối lượng công việc nhiều dẫn đến trễ hạn | Trung bình | Áp dụng **MoSCoW**, hoàn thành 100% hạng mục Must trước; ưu tiên 2 có thể lùi; các tính năng Could và Won't đưa về backlog hậu Sprint 2 |
| **RSK-07** | **Công thức thiếu hoặc sai làm trừ kho sai số** | Trung bình | Bắt buộc khai công thức cho từng size khi tạo món, thiếu thì không lưu được; mọi lần trừ và hoàn kho đều ghi vào lịch sử để đối chiếu |
| **RSK-08** | **Thiếu thời gian cho kho nguyên liệu** | Trung bình | Có phương án dự phòng ở mục 3.1: lùi về cách nhân viên tự khóa món hết hàng, giữ nguyên luồng khách ưu tiên 1 |
| **RSK-09** | **Mất bản nháp tài liệu vì để ngoài git** | Trung bình | Giữ tài liệu trong `docs/` và commit sớm, không để ở thư mục bị `.gitignore` bỏ qua |
| **RSK-10** | **Với cổng thanh toán thật, kiểm kho và trừ tiền cách nhau một khoảng chờ bên ngoài** | Thấp trong MVP | Ghi lại là giới hạn đã biết của thiết kế mô phỏng; khi tích hợp cổng thật phải chuyển sang cơ chế giữ chỗ nguyên liệu có thời hạn thay vì trừ ngay trong transaction |
