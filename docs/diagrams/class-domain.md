# Đặc Tả Sơ Đồ Lớp Miền Nghiệp Vụ — Class Domain (Task 2.3)

> **Dự án:** Ứng dụng đặt cà phê không tiền mặt BrewLite  
> **Môn học:** Công nghệ phần mềm — Học kỳ 1, Năm học 2026–2027  
> **Mã sơ đồ:** `Class-01` | **Mã Issue:** `[D2.3] #40` (Phụ trách Issue Backlog `#03` — Task 2.3)  
> **Người thực hiện:** **Trần Quốc Tài (`TaiTran263`)**  
> **Người duyệt:** **Nguyễn Thành Long (`Longcodepro`)**  
> **Tài liệu tham chiếu:** `docs/requirements/context-and-scope.md`, `docs/requirements/requirements-web.md`, `docs/requirements/requirements-api.md`, `docs/requirements/use-case-checkout.md`, `docs/diagrams/usecase-overview.puml`

---

## 1. Mục Tiêu Thiết Kế & Sự Tương Thích Kiến Trúc

Sơ đồ lớp miền (**Domain Class Diagram**) thể hiện cấu trúc tĩnh của hệ thống BrewLite ở mức phân tích nghiệp vụ (Analysis/Domain Model). Sơ đồ đáp ứng trọn vẹn yêu cầu **Task 2.3 trong đề bài Assignment 2**:
- Tối thiểu **7 thực thể cốt lõi**: `User`, `Product`, `Order`, `OrderItem`, `Payment`, `Promotion`, `LoyaltyTransaction`.
- Thể hiện đầy đủ thuộc tính chính, kiểu dữ liệu, các quan hệ (Association, Aggregation, Composition), chỉ số bội (Multiplicity) và các bộ Enum trạng thái.
- Đảm bảo **tính nhất quán 100%** với Sơ đồ Use-case (21 UC), Sơ đồ Activity End-to-End (`Activity-01`) và Đặc tả Use-case Checkout (`UC-05`).

---

## 2. Danh Mục 7 Thực Thể Miền Nghiệp Vụ (Domain Entities)

### A. Nhóm Thực Thể Cốt Lõi (Core Entities)

1. **`User` (Người dùng hệ thống):**
   - Đại diện cho các tác nhân tương tác với hệ thống.
   - Định danh bằng **Số điện thoại**, là **khóa chính (`phone: String [PK]`)** của bảng `User` — không có cột `id` riêng, định dạng 10 chữ số chuẩn Việt Nam theo `FR-04`.
   - Phân quyền theo cơ chế RBAC (`role: Role`) gồm 4 vai trò: `CUSTOMER`, `BARISTA`, `CASHIER`, `MANAGER`.
   - Lưu trữ số dư điểm tích lũy thành viên (`loyaltyPoints: Int`) theo quy tắc tích điểm 1 điểm / 1.000đ (`UC-20` / `FR-10`).
   - Mật khẩu băm an toàn (`passwordHash: String`) bằng thuật toán `bcryptjs`.

2. **`Category` (Danh mục đồ uống):**
   - Phân loại món trên thực đơn (Cà phê phin, Espresso, Trà trái cây...).
   - Định danh: `id: Int [PK]`, `name: String`.

3. **`Product` (Món đồ uống & Sản phẩm):**
   - Quản lý danh mục thực đơn đồ uống (`categoryId: Int [FK]`, `name`, `price` niêm yết theo Size S, `imageUrl`).
   - Cờ trạng thái phục vụ: **`isAvailable: Boolean = true`** (Đánh dấu món còn hàng hay tạm hết hàng/hết nguyên liệu). Khi `isAvailable = false`, giao diện vô hiệu hóa nút đặt và hệ thống từ chối tạo đơn (`FR-01`, Activity Diagram).

4. **`Order` (Đơn hàng tổng thể):**
   - Quản lý toàn bộ vòng đời của một đơn hàng đặt qua ứng dụng.
   - Hỗ trợ cơ chế **Khóa lạc quan (`version: Int = 0`)** để ngăn chặn xung đột dữ liệu đồng thời (Optimistic Concurrency Control).
   - Lưu trữ khóa chống trùng lặp **`idempotencyKey: String?`** (UUID v4 do Client gửi lên theo `FR-09`).
   - **`pickupCode: String?`** *(Sprint 3, Planned)*: Mã nhận đồ uống 6 chữ số ngẫu nhiên duy nhất (ví dụ `839201`), cấp phát khi đơn chuyển trạng thái `READY` (sau khi pha chế xong) để khách nhận đồ tại quầy (`UC-07` / `UC-12`). Không áp dụng ở MVP Sprint 1-2.
   - **`total: Int`**: Tổng tiền thực trả do máy chủ tính toán độc quyền (**Server-side Pricing** theo `FR-05`).

5. **`OrderItem` (Chi tiết ly nước trong đơn):**
   - Mỗi bản ghi đại diện cho một dòng ly nước đã cấu hình trong giỏ hàng.
   - Thuộc tính cấu hình: kích cỡ (`size: Size`), mảng topping tùy chọn (`toppings: String[]`), số lượng (`quantity: 1..99`).
   - **`unitPrice: Int`**: Đơn giá sau khi đã cộng phụ thu size và toppings, đảm bảo tính bất biến của lịch sử giá tại thời điểm đặt.

6. **`Payment` (Giao dịch thanh toán):**
   - Ghi nhận chi tiết kết quả thẩm định và thanh toán mô phỏng.
   - Phương thức thanh toán: `method: PaymentMethod` (`CARD`, `WALLET`).
   - Trạng thái thanh toán: `status: PaymentStatus` (`SUCCESS`, `FAILED`).
   - Lưu nguyên nhân từ chối (`failureReason: String?`), khóa chống gửi trùng (`idempotencyKey: String?`) và số điểm thưởng được cấp phát (`pointsEarned: Int`).

---

### B. Nhóm Thực Thể Mở Rộng Nghiệp Vụ (Domain Extensions)

7. **`Promotion` (Chương trình khuyến mại & Voucher)** *(Sprint 3, Planned — chưa hiện thực ở MVP)*:
   - Quản lý mã giảm giá ưu đãi (`code: String [Unique]`, ví dụ: `BREW20`, `BANMOI`).
   - Hình thức giảm: `discountType: DiscountType` (`PERCENT` - giảm theo %, `FIXED` - giảm số tiền cố định).
   - Ràng buộc: giá trị đơn hàng tối thiểu (`minOrderAmount: Int`), trạng thái kích hoạt (`isActive: Boolean`) và thời hạn sử dụng (`expiryDate`).

8. **`LoyaltyTransaction` (Nhật ký giao dịch điểm thưởng):**
   - Quản lý lịch sử chi tiết mọi biến động điểm thưởng của người dùng (`EARN` - cộng điểm sau khi đơn `PAID`; đổi điểm lấy quà hoặc giảm giá thuộc Won't Have 7 nên không có loại `REDEEM`; hủy đơn đã `PAID` ở Sprint 3 sẽ trừ lại điểm).
   - Ghi nhận số dư sau giao dịch (`balanceAfter: Int`) và liên kết chặt chẽ với mã đơn hàng (`orderId`).
   - **Lưu ý triển khai MVP:** theo quyết định đã chốt (`context-and-scope.md` mục 6.6), ở Sprint 2 lịch sử điểm được **suy ra trực tiếp từ các lần thanh toán thành công trong bảng `Payment`**, không cần bảng sổ điểm riêng. Lớp `LoyaltyTransaction` được biểu diễn ở mức domain để đáp ứng yêu cầu tối thiểu của đề bài (Task 2.3), chưa chắc là một bảng vật lý riêng trong Sprint 2.

---

## 3. Danh Mục Các Bộ Enum Nghiệp Vụ (Enums)

| Tên Enum | Giá trị liệt kê | Ý nghĩa nghiệp vụ |
|---|---|---|
| **`Role`** | `CUSTOMER`, `BARISTA`, `CASHIER`, `MANAGER` | Phân quyền vai trò người dùng trong hệ thống theo RBAC |
| **`OrderStatus`** | `PENDING`, `PAID`, `PAYMENT_FAILED` (MVP, Sprint 2); `PREPARING`, `READY`, `COMPLETED`, `CANCELLED` (Sprint 3, Planned) | 7 trạng thái phản ánh đầy đủ vòng đời xử lý đơn hàng; `schema.prisma` hiện chỉ có 3 trạng thái đầu |
| **`Size`** | `S`, `M`, `L` | Kích cỡ đồ uống (Size S giá gốc, Size M/L có phụ thu) |
| **`PaymentMethod`** | `CARD`, `WALLET` | Các kênh thanh toán không tiền mặt được hỗ trợ |
| **`PaymentStatus`** | `SUCCESS`, `FAILED` | Trạng thái phê duyệt của cổng thanh toán mô phỏng |
| **`DiscountType`** | `FIXED`, `PERCENT` | Loại chiết khấu của voucher khuyến mãi |

---

## 4. Bảng Ma Trận Quan Hệ & Bội Số (Relationships & Multiplicities)

| Lớp nguồn | Quan hệ (UML Relationship) | Lớp đích | Multiplicity | Diễn giải nghiệp vụ |
|---|:---:|---|:---:|---|
| **`User`** | Composition (`*--`) | **`Order`** | `1` đến `0..*` | Một người dùng có thể đặt nhiều đơn hàng; mỗi đơn hàng thuộc sở hữu của duy nhất một người dùng. |
| **`Order`** | Composition (`*--`) | **`OrderItem`** | `1` đến `1..*` | Một đơn hàng bắt buộc phải chứa ít nhất 1 ly nước (`1..*`); khi đơn bị hủy hoặc xóa thì các dòng item đi kèm cũng bị xóa. |
| **`OrderItem`** | Association (`-->`) | **`Product`** | `0..*` đến `1` | Mỗi chi tiết món tham chiếu đến đúng 1 sản phẩm gốc trong menu để lấy công thức và định giá. |
| **`Product`** | Association (`-->`) | **`Category`** | `0..*` đến `1` | Mỗi sản phẩm thuộc về một danh mục đồ uống để hỗ trợ lọc menu trên giao diện. |
| **`Order`** | Composition (`*--`) | **`Payment`** | `1` đến `0..*` | Một đơn hàng có thể có một hoặc nhiều lần giao dịch thanh toán (ví dụ: lần đầu thất bại do thẻ 0000, lần sau thành công). |
| **`Order`** | Aggregation (`o--`) | **`Promotion`** | `0..*` đến `0..1` | *(Sprint 3, Planned)* Mỗi đơn hàng có thể áp dụng tối đa 1 mã giảm giá; voucher tồn tại độc lập không phụ thuộc vào đơn hàng. |
| **`User`** | Composition (`*--`) | **`LoyaltyTransaction`** | `1` đến `0..*` | Một người dùng sở hữu lịch sử điểm thưởng riêng biệt. |
| **`LoyaltyTransaction`** | Association (`-->`) | **`Order`** | `0..*` đến `0..1` | Mỗi giao dịch cộng điểm liên kết trực tiếp với 1 đơn hàng cụ thể. |

---

## 5. Sơ Đồ Lớp Trực Quan (Class Diagram)

![Sơ đồ Class Domain](./class-domain.svg)

* **Tệp nguồn PlantUML:** [`class-domain.puml`](./class-domain.puml)
* **Tệp ảnh vector SVG:** [`class-domain.svg`](./class-domain.svg)
