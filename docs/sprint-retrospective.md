# Báo Cáo Tổng Kết & Hồi Tưởng Sprint — Sprint Review & Retrospective

> **Dự án:** Ứng dụng đặt cà phê không tiền mặt BrewLite  
> **Môn học:** Công nghệ phần mềm — Học kỳ 1, Năm học 2026–2027  
> **Nhóm thực hiện:**
> - **Nguyễn Thành Long (`Longcodepro`)** — Backend, Scrum Master, DevOps, Kiến trúc
> - **Trần Quốc Tài (`TaiTran263`)** — Frontend UI/UX, Quản trị trạng thái Client, QA
>
> **Mã tạo phẩm:** `DOC-SRR-01` | **Đường dẫn:** `docs/sprint-retrospective.md` (Phục vụ **Task 5.4 & Checklist 9.1** của đề bài)  
> **Mô hình phát triển:** Agile / Scrum tinh gọn (2 Sprint x 1 tuần / Sprint)  
> **Tài liệu tham chiếu:** [`docs/BACKLOG.md`](./BACKLOG.md), [`docs/release-notes.md`](./release-notes.md), [`docs/traceability-matrix.md`](./traceability-matrix.md)

---

## 1. Tổng Quan Quy Trình Phát Triển 2 Sprint

Dự án BrewLite được tổ chức thực hiện nghiêm ngặt theo khung làm việc **Agile / Scrum** thích ứng, chia làm **2 Sprint** liên tiếp nhằm đảm bảo nguyên tắc: *Task sau chỉ được triển khai khi task trước đã có tạo phẩm và lịch sử commit rõ ràng*:

```
[Khởi động] ──> [Sprint 1: Nền tảng & MVP Menu] ──> [Sprint 2: Luồng End-to-End & CD] ──> [Bàn giao v1.0.0]
```

* **Sprint 1 (Tuần 1):** Tập trung vào nền tảng kỹ thuật, đặc tả yêu cầu (Task 1), mô hình hóa UML (Task 2), thiết kế kiến trúc (Task 3), thiết lập CI và ra mắt phiên bản MVP đầu tiên (Xem Menu).
* **Sprint 2 (Tuần 2):** Hiện thực trọn vẹn luồng nghiệp vụ khách hàng từ Giỏ hàng → Thanh toán → Tích điểm (Task 5.1), kiểm thử tự động (Task 5.2), tự động hóa Continuous Delivery lên GHCR (Task 5.3), triển khai Production công khai và lập Ma trận truy vết (Task 8).

---

## 2. Sprint 1: Nền Tảng Kỹ Thuật, Tài Liệu & MVP Xem Menu

* **Thời gian thực hiện:** Tuần 1 (Từ 29/10/2026 đến 05/11/2026)
* **Sprint Goal (Mục tiêu Sprint):** Xây dựng nền tảng monorepo, tài liệu kiểm soát phiên bản Task 1–3, đường ống CI tự động và phát hành MVP đầu tiên chạy được cho luồng xem menu đồ uống.

### 2.1. Sprint 1 Review (Nghiệm thu kết quả)
* **Những gì đã hoàn thành (Done):**
  - Khởi tạo Monorepo (npm, mỗi app có `package.json` riêng) gồm `apps/web` (Next.js 16) và `apps/api` (NestJS 12).
  - Hoàn thiện tài liệu Task 1: Bối cảnh & Stakeholder (`context-and-scope.md`), SRS Giao diện & API, Danh sách User Story (`user-stories.md`), Đặc tả use-case checkout (`use-case-checkout.md`).
  - Hoàn thiện tài liệu Task 2: Activity Diagram End-to-End, Sequence Diagram, Class Diagram Domain.
  - Hoàn thiện tài liệu Task 3: Kiến trúc Frontend/Backend, các bản ADR 001–005, Deployment Diagram.
  - Xây dựng thành công Pipeline CI (`.github/workflows/ci.yml`): Tự động chặn merge nếu lỗi Lint, Test hoặc Build.
  - **MVP Sprint 1:** API `GET /products` và giao diện Menu Mobile-first hỗ trợ đầy đủ 3 trạng thái: Skeleton Loading, Empty State, Error & Retry.
* **Hạng mục chuyển tiếp sang Sprint 2:**
  - Logic tùy chọn Size/Topping được thống nhất dời sang Sprint 2 để tích hợp trực tiếp vào luồng Giỏ hàng và Tính tổng tiền Server-side.

### 2.2. Sprint 1 Retrospective (Rút kinh nghiệm)

| Khía cạnh | Nội dung đánh giá thực tế của nhóm |
|---|---|
| **Làm tốt (What went well)** | • Phân chia trách nhiệm rõ ràng: Long phụ trách Backend/DevOps, Tài phụ trách Frontend/QA.<br>• Tuân thủ nghiêm ngặt quy tắc Git flow: Mỗi task một branch riêng, commit theo chuẩn Conventional Commits.<br>• Thống nhất sớm tài liệu giúp loại bỏ xung đột về phạm vi 21 Use Case. |
| **Chưa tốt / Khó khăn (What didn't go well)** | • Ban đầu tài liệu bị lệch giữa 77 use-case của Assignment 1 cũ và yêu cầu tinh gọn của Assignment 2, mất thời gian đồng bộ lại.<br>• Cấu hình TypeScript và Vitest monorepo lúc đầu bị lỗi phân giải module ESM. |
| **Kế hoạch hành động (Action Items)** | • Viết hợp đồng API chi tiết (`docs/architecture/api-contract.md`) trước khi code Sprint 2 để 2 bên không bị lệch DTO.<br>• Luôn chạy thử `docker compose up --build` ở máy cá nhân trước khi mở Pull Request. |

---

## 3. Sprint 2: Hoàn Thiện Luồng End-to-End, CD & Bàn Giao Production

* **Thời gian thực hiện:** Tuần 2 (Từ 06/11/2026 đến 10/11/2026)
* **Sprint Goal (Mục tiêu Sprint):** Hoàn thành trọn vẹn luồng nghiệp vụ khách hàng từ Giỏ hàng đến Thanh toán, tự động hóa đóng gói Docker Image lên GHCR, triển khai hệ thống lên Production (Vercel, Render, Neon) và hoàn thành Ma trận truy vết.

### 3.1. Sprint 2 Review (Nghiệm thu kết quả)
* **Những gì đã hoàn thành (Done):**
  - **Phía Frontend (`apps/web` - Tài phụ trách):**
    - Hoàn thành Modal tùy biến Size (S/M/L) và Topping, tính giá tạm tính thời gian thực.
    - Quản lý giỏ hàng Zustand lưu bền vững qua `localStorage`, badge số ly trên Navbar.
    - Modal Đăng ký / Đăng nhập bằng số điện thoại 10 chữ số chuẩn Việt Nam.
    - Màn hình Checkout chọn phương thức Thẻ / Ví, tích hợp chống gửi trùng `Idempotency-Key`.
    - Màn hình Lịch sử đơn hàng `/orders` tự động polling cập nhật trạng thái đơn mỗi 5 giây.
  - **Phía Backend (`apps/api` - Long phụ trách):**
    - Hệ thống Auth JWT bảo vệ qua `JwtAuthGuard`, băm mật khẩu `bcryptjs`.
    - API `POST /orders` với cơ chế **Server-side Pricing** (Server tự tính tiền từ CSDL).
    - API `POST /payments` thanh toán mô phỏng Thẻ và Ví điện tử.
    - Máy trạng thái đơn hàng (`OrderStateMachine`) kết hợp **Khóa lạc quan (cột `version`)** chống ghi đè đồng thời (409 Conflict).
    - Tích lũy điểm thưởng thành viên tự động (1 điểm / 1.000đ thực trả).
  - **DevOps, Triển khai & Truy vết (Cả hai phụ trách):**
    - Pipeline CD đóng gói image lên `ghcr.io`; webhook Render và smoke test `/health` chỉ chạy khi đã cấu hình secret (hiện chưa đặt nên các bước này được bỏ qua).
    - Triển khai Production thành công: Frontend trên Vercel, Backend trên Render, CSDL trên Neon Singapore.
    - Hoàn thiện Ma trận truy vết `docs/traceability-matrix.md` cho 21 FR và 5 NFR (FR-11 đến FR-21 là Planned, chưa có mã nguồn và kiểm thử).
    - Soạn thảo Release Notes `docs/release-notes.md` và Kế hoạch vận hành/Rollback `docs/deployment.md`.
* **Mức độ hoàn thành Backlog:** hoàn thành các hạng mục **Must Have** và **Should Have** cam kết cho mốc nghiệm thu Assignment 2, trong đó kiểm thử end-to-end tự động (mục #16 của `docs/BACKLOG.md`) được bổ sung sau bản v1.0.0 bằng Playwright (`tests/e2e`).

### 3.2. Sprint 2 Retrospective (Rút kinh nghiệm)

| Khía cạnh | Nội dung đánh giá thực tế của nhóm |
|---|---|
| **Làm tốt (What went well)** | • Luồng End-to-End hoạt động mượt mà, người dùng thực tế có thể mở điện thoại đặt món và thanh toán thành công.<br>• Các cơ chế bảo mật và toàn vẹn dữ liệu (Server-side Pricing, Khóa lạc quan, Idempotency) chạy đúng thiết kế lý thuyết.<br>• Pipeline CI/CD tự động hóa giúp việc triển khai lên Production diễn ra tự động, không cần can thiệp thủ công. |
| **Chưa tốt / Khó khăn (What didn't go well)** | • Nền tảng Render gói miễn phí gặp hiện tượng Cold Start (máy chủ ngủ đông mất khoảng 30–50 giây để khởi động lại ở request đầu tiên).<br>• Phối hợp merge nhiều nhánh Pull Request về `main` đôi khi gặp xung đột file tài liệu markdown. |
| **Bài học kinh nghiệm (Lessons Learned)** | • Thêm endpoint `GET /health` và thông báo trạng thái "Máy chủ đang khởi động" trên giao diện web để cải thiện trải nghiệm người dùng khi gặp Cold Start.<br>• Chia nhỏ các commit và thường xuyên `git pull rebase origin/main` giúp giảm xung đột mã nguồn. |

---

## 4. Sprint 3: Vận Hành Tại Quầy & Tiện Ích Khách Hàng (Store Operations & Customer Utilities)

* **Thời gian thực hiện:** Tuần 3 (Từ 11/11/2026 đến 14/11/2026)
* **Sprint Goal (Mục tiêu Sprint):** Hoàn thiện quy trình vận hành khép kín tại quầy cửa hàng (màn hình KDS cho Barista, cơ chế mã nhận hàng 6 số và bàn giao món của Cashier) cùng các tiện ích khách hàng mở rộng (mã giảm giá Voucher, hủy đơn trước pha chế và đánh giá dịch vụ 5 sao).

### 4.1. Sprint 3 Review (Nghiệm thu kết quả)
* **Những gì đã hoàn thành (Done):**
  - **Màn hình pha chế KDS cho Barista (CN-08 / FR-20):**
    - Phía Backend (S3.2): API `GET /kds/orders` danh sách đơn cần pha, `PATCH /kds/orders/:id/status` chuyển trạng thái `PAID` → `PREPARING` → `READY`, phân quyền nghiêm ngặt `@Roles('BARISTA')` và kiểm tra khóa lạc quan `version`.
    - Phía Frontend (S3.3): Giao diện KDS tại `/kds`, hiển thị chi tiết size/topping, nút nhận pha và báo xong, phân loại màu theo thời gian chờ.
  - **Giao nhận tại quầy & Mã nhận hàng 6 số (CN-09 / FR-21):**
    - Phía Backend (S3.4): Tự động sinh `pickupCode` ngẫu nhiên 6 chữ số duy nhất trong số đơn đang `READY`, API `GET /cashier/orders` và `POST /cashier/orders/:id/complete` cho Cashier xác nhận mã để chuyển đơn sang `COMPLETED`.
    - Phía Frontend (S3.5): Hiển thị mã nhận hàng lớn, dễ nhìn trên trang `/orders` của khách; giao diện `/cashier` cho thu ngân nhập mã đối chiếu và bàn giao đồ uống.
  - **Tiện ích khách hàng (CN-10 / FR-11, FR-12, FR-13):**
    - **Voucher giảm giá (FR-11):** Backend (S3.6) kiểm tra mã `PERCENT` / `FIXED`, server tính tiền giảm chống gian lận; Frontend (S3.7) ô nhập mã tại `/checkout` và hiển thị số tiền tiết kiệm.
    - **Hủy đơn hàng (FR-12):** Backend (S3.8) cho phép khách hoặc Cashier hủy đơn trước khi pha chế, khóa lạc quan chống xung đột đồng thời với Barista, tự động hoàn tiền mô phỏng, hoàn điểm thưởng và hoàn lượt voucher; Frontend (S3.9) hộp thoại xác nhận hủy đơn tại `/orders` và `/cashier`.
    - **Đánh giá dịch vụ (FR-13):** Backend (S3.10) lưu đánh giá 1–5 sao kèm nhận xét cho đơn `COMPLETED`; Frontend (S3.11) popup đánh giá ngay sau khi nhận món.
  - **Kiểm thử tự động & E2E (S3.12):** Bộ kiểm thử E2E Playwright `tests/e2e/sprint3.spec.ts` kiểm chứng toàn diện 5 kịch bản luồng Sprint 3 từ pha chế, giao nhận mã 6 số, hủy đơn, voucher đến đánh giá.

### 4.2. Sprint 3 Retrospective (Rút kinh nghiệm)

| Khía cạnh | Nội dung đánh giá thực tế của nhóm |
|---|---|
| **Làm tốt (What went well)** | • Vòng đời đơn hàng khép kín từ lúc khách đặt đến lúc Barista pha xong và Cashier giao món hoạt động trơn tru.<br>• Kiểm tra khóa lạc quan `version` giải quyết triệt để xung đột khi Barista bấm nhận pha đồng thời với khách bấm hủy đơn.<br>• Phân quyền theo vai trò (`RolesGuard`) ngăn chặn truy cập trái phép vào các màn hình nhân viên. |
| **Chưa tốt / Khó khăn (What didn't go well)** | • Cơ chế sinh mã nhận hàng 6 số ngẫu nhiên cần vòng lặp thử lại (retry) để tránh trùng lặp trong các đơn cùng ở trạng thái `READY`.<br>• Đồng bộ trạng thái đa màn hình (Khách - Barista - Cashier) qua Polling 5s có độ trễ nhỏ so với WebSocket, nhưng bù lại rất ổn định và đơn giản hóa kiến trúc. |
| **Kế hoạch hành động (Action Items)** | • Tiếp tục triển khai Sprint 4: Portal quản trị Quản lý (Menu, Bảng giá, Kho nguyên liệu, Công thức và Báo cáo doanh thu). |

---

## 5. Đánh Giá Hiệu Suất & Đóng Góp Thành Viên

Mô hình nhóm 2 người đòi hỏi sự phối hợp chặt chẽ, chủ động và minh bạch thông qua các công cụ cộng tác Git/GitHub:

```
+-----------------------------------------------------------------------------------+
|                        BẢNG ĐÁNH GIÁ ĐÓNG GÓP THÀNH VIÊN                          |
+----------------------+---------------------------------------+--------------------+
| Thành viên           | Phạm vi trách nhiệm chính             | Tỷ lệ đóng góp     |
+----------------------+---------------------------------------+--------------------+
| Nguyễn Thành Long    | • Backend API (NestJS, Prisma, Auth)  |                    |
| (Longcodepro)        | • DevOps, Docker, Pipeline CI/CD      |        50%         |
|                      | • Kiến trúc Backend, ADR 002, 003, 005|                    |
+----------------------+---------------------------------------+--------------------+
| Trần Quốc Tài        | • Frontend Web (Next.js 16, Zustand)  |                    |
| (TaiTran263)         | • UI/UX Mobile-first, Modal, Cart     |        50%         |
|                      | • Traceability Matrix, Release Notes  |                    |
+----------------------+---------------------------------------+--------------------+
```

* **Đánh giá chung:** Hai thành viên hoàn thành đúng hạn các User Story được giao, tôn trọng Definition of Done (DoD), hỗ trợ chéo trong khâu kiểm thử (Tài test API qua Postman, Long review UI qua Vercel Preview) và không có bất đồng kỹ thuật lớn nào làm chậm tiến độ dự án.

---

## 6. Lộ Trình Chuyển Tiếp (Post-Assignment Roadmap — Sprint 4)

Dự án tiếp tục phát triển Sprint 4 về Quản trị & Số hóa kho (Store Management):
- **Portal quản trị cho Quản lý cửa hàng (Store Manager):** Quản lý menu món, danh mục, topping và phụ thu size (`FR-18`).
- **Quản lý định lượng kho nguyên liệu theo công thức pha chế (`FR-15`, `FR-16`, `FR-17`):** tự động trừ kho khi đơn sang `PAID`, hoàn kho khi hủy đơn, cảnh báo nguyên liệu chạm ngưỡng tối thiểu.
- **Quản trị nhân sự & voucher (`FR-19`, `FR-11` phía Manager):** tạo tài khoản nhân viên, phân quyền, khóa tài khoản, tạo và cấu hình mã giảm giá.
- **Dashboard báo cáo doanh thu (`FR-14`):** doanh thu thực tế, số lượng đơn hoàn tất, tỷ lệ hủy và Top 5 món bán chạy nhất.
