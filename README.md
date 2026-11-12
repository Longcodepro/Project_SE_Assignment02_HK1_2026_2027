# BrewLite — Ứng Dụng Đặt Cà Phê Không Tiền Mặt

> **Môn học:** Công nghệ Phần mềm — Bài tập lớn: Assignment 2 (Requirements to Deployment)  
> **Học kỳ:** I — Năm học 2026–2027 | Trường Đại học Sài Gòn  
> **Nhóm sinh viên thực hiện:**
> - **Nguyễn Thành Long (`Longcodepro`)** — Backend, Scrum Master, DevOps, Kiến trúc
> - **Trần Quốc Tài (`TaiTran263`)** — Frontend UI/UX, Quản trị trạng thái Client, QA
>
> **Công nghệ chính:** Next.js 16 (Mobile-first PWA) · NestJS 12 · PostgreSQL 16 (Neon) · Docker & Docker Compose · GitHub Actions CI/CD  
> **Luồng nghiệp vụ cốt lõi:**  
> Xem menu → Tùy biến món (Size/Topping) → Giỏ hàng → Đăng nhập SĐT → Đặt đơn (Server-side Pricing) → Thanh toán Thẻ/Ví → Theo dõi đơn & Tích điểm

---

## 1. Địa Chỉ Truy Cập Môi Trường Production (Live URLs)

Hệ thống đã được đóng gói container tự động và triển khai công khai trên nền tảng đám mây bảo mật HTTPS:

| Thành phần | Nền tảng hạ tầng | Địa chỉ truy cập Production | Ghi chú nghiệm thu |
|---|---|---|---|
| **Frontend Web App** | **Vercel Edge Network** | [https://se-as2-brewlite.vercel.app](https://se-as2-brewlite.vercel.app) | Giao diện Next.js 16 Mobile-first |
| **Backend API Service** | **Render Cloud Services** | [https://brewlite-api.onrender.com](https://brewlite-api.onrender.com) | NestJS build từ `apps/api/Dockerfile`, Render tự deploy theo kết nối Git |
| **Health Check Endpoint** | **Render Cloud** | [https://brewlite-api.onrender.com/health](https://brewlite-api.onrender.com/health) | Trả về HTTP 200 `{ "status": "ok" }` |
| **Tài liệu API (Swagger)** | **Render Cloud** | [https://brewlite-api.onrender.com/docs](https://brewlite-api.onrender.com/docs) | Giao diện tương tác OpenAPI 3.0 |
| **Cơ sở dữ liệu** | **Neon Serverless PostgreSQL** | `ep-dry-pond-xxx.ap-southeast-1.aws.neon.tech` | Đặt tại Singapore (`ap-southeast-1`), SSL Mode |
| **Demo Tunnel (Dự phòng)** | **Cloudflare Zero Trust** | [https://demo.brewlite.online](https://demo.brewlite.online) | Đường dẫn HTTPS phát trực tiếp từ máy local |

### Dữ liệu tài khoản kiểm thử nhanh (Demo Credentials):
* **Không có tài khoản được seed sẵn** (seed chỉ tạo danh mục và món). Hãy bấm **Đăng ký** trên web với SĐT di động Việt Nam 10 chữ số (đầu số `03`, `05`, `07`, `08`, `09`, ví dụ `0912345678`) và mật khẩu 6 đến 72 ký tự.
* Nút **"Tài khoản mẫu (Demo)"** ở form đăng nhập chỉ điền sẵn `0912345678` / `matkhau123`; đăng nhập được khi tài khoản này đã được đăng ký trước đó.
* **Kịch bản thanh toán thẻ mô phỏng:**
  * **Thành công:** Nhập số thẻ 13 đến 19 chữ số (ví dụ 16 số) có 4 số cuối **khác `0000`** (ví dụ: `4111 2222 3333 4444`).
  * **Thất bại:** Nhập số thẻ có 4 số cuối là **`0000`** (ví dụ: `4111 2222 3333 0000`).

---

## 2. Cấu Trúc Thư Mục Repository

```
brewlite/
|-- apps/
|   |-- web/                   # Frontend Next.js 16, Tailwind CSS, Zustand, Mobile-first/PWA
|   `-- api/                   # Backend NestJS 12, Prisma 7, PostgreSQL, Swagger, Unit/Integration test
|-- docs/
|   |-- requirements/          # Task 1: Bối cảnh, SRS rút gọn, User Stories, Đặc tả Use-case
|   |-- diagrams/              # Task 2: Activity, Sequence, Class Domain (.puml và .svg)
|   |-- architecture/          # Task 3: Kiến trúc Frontend/Backend, các bản ADR 001-005
|   |-- deployment.md          # Task 3.2: Kế hoạch triển khai Production, secrets & rollback
|   |-- traceability-matrix.md # Task 8: Ma trận truy vết yêu cầu 21 FR + 5 NFR
|   |-- release-notes.md       # Task 5.4: Bản ghi chú phát hành phiên bản v1.0.0
|   `-- sprint-retrospective.md# Task 5.4: Báo cáo Sprint Review & Sprint Retrospective
|-- scripts/                   # Tiện ích: logs.sh, start-tunnel.sh, studio-cloud.sh
|-- tests/                     # Kiểm thử E2E luồng đặt hàng (Playwright, tests/e2e)
|-- .github/workflows/         # Pipeline tự động hóa: ci.yml (Quality Gate) và cd.yml (Deploy)
|-- docker-compose.yml         # Chạy trọn gói 3 dịch vụ Web, API và DB bằng 1 câu lệnh
|-- .env.example               # Mẫu cấu hình biến môi trường chuẩn Twelve-Factor
`-- README.md                  # Hướng dẫn tổng quan, khởi chạy, kiểm thử và vận hành
```

---

## 3. Hướng Dẫn Khởi Chạy Dự Án Ở Máy Cục Bộ (Local Setup)

### Cách 1: Khởi chạy nhanh bằng Docker Compose (Khuyên dùng)
Yêu cầu: Máy đã cài đặt **Docker Desktop** và **Docker Compose**.

```bash
# 1. Sao chép file cấu hình môi trường mẫu
cp .env.example .env

# 2. Khởi động đồng thời cả 3 dịch vụ (Web, API, DB)
docker compose up --build -d
```

| Dịch vụ | URL truy cập Local | Mô tả |
|---|---|---|
| **Frontend Web** | [http://localhost:4004](http://localhost:4004) | Giao diện đặt món Next.js |
| **Backend API** | [http://localhost:4003](http://localhost:4003) | Máy chủ API NestJS |
| **API Swagger** | [http://localhost:4003/docs](http://localhost:4003/docs) | Tài liệu tương tác API |
| **PostgreSQL DB** | `localhost:4005` | CSDL PostgreSQL 16 Alpine |

*Migration và seed dữ liệu mẫu sẽ tự động thực thi khi API khởi động.*  
*Để dừng toàn bộ hệ thống:* `docker compose down` *(thêm cờ `-v` nếu muốn xóa trắng dữ liệu CSDL)*.

---

### Cách 2: Chạy trực tiếp trên máy không dùng Docker
Yêu cầu: Node.js phiên bản 22+ và một cơ sở dữ liệu PostgreSQL đang chạy.

```bash
# 1. Khởi chạy Backend API
cd apps/api
npm ci
npx prisma migrate deploy
npx prisma db seed
PORT=4003 npm run start:dev

# 2. Khởi chạy Frontend Web (Mở terminal mới)
cd apps/web
npm ci
NEXT_PUBLIC_API_URL=http://localhost:4003 npm run dev
```

---

## 4. Hướng Dẫn Kiểm Thử Tự Động (Testing)

Dự án có Unit/Integration test cho API (Vitest), Postman Collection; giao diện web kiểm tra lint, build và có E2E Playwright cho luồng đặt hàng (chưa có test đơn vị cho `apps/web`):

```bash
# 1. Kiểm thử Backend (Lint, Build, Unit/Integration test)
cd apps/api
npm run lint                  # Kiểm tra quy chuẩn mã nguồn (oxlint)
npm run build                 # Biên dịch mã nguồn TypeScript
npm test                      # Chạy toàn bộ Unit test với Vitest
npm run test:e2e              # Test mẫu của API (chỉ kiểm tra GET /), không phải E2E luồng đặt hàng

# 2. Kiểm thử kịch bản Postman tự động (Yêu cầu API đang chạy)
npm run postman

# 3. Kiểm thử Frontend Web
cd apps/web
npm run lint                  # Kiểm tra cú pháp và quy chuẩn React/Next.js
npm run build                 # Kiểm tra build tĩnh và tối ưu giao diện

# 4. Kiểm thử E2E luồng đặt hàng (Playwright; yêu cầu hệ thống đang chạy, ví dụ docker compose up -d --build)
cd tests/e2e
npm ci
npx playwright install chromium
npm test                      # Mặc định web ở :4004, API ở :4003; đổi bằng E2E_WEB_URL, E2E_API_URL
```

---

## 5. Quy Trình Khôi Phục Sự Cố Khẩn Cấp (Emergency Rollback)

Khi phiên bản mới trên Production phát sinh lỗi nghiêm trọng, nhóm thực hiện quy trình Rollback theo 3 cấp độ (chi tiết tại [`docs/deployment.md`](./docs/deployment.md)):

* **Cấp 1 — Rollback Frontend trên Vercel (Dưới 10 giây):**  
  Vào Vercel Dashboard → Chọn dự án frontend (tên miền `se-as2-brewlite.vercel.app`) → Tab **Deployments** → Chọn bản deploy ổn định gần nhất → Bấm **Instant Rollback**.
* **Cấp 2 — Rollback Backend trên Render (Dưới 2 phút):**  
  Vào Render Dashboard → Chọn `brewlite-api` → Tab **Events / Deploy History** → Chọn commit SHA an toàn trước đó → Bấm **Rollback to this deploy**.
* **Cấp 3 — Rollback Cơ sở dữ liệu:**  
  * Hoàn tác migration: `npx prisma migrate resolve --rolled-back <migration_name>`.
  * Khôi phục dữ liệu: Sử dụng tính năng Point-in-Time Recovery (PITR) trên trang quản trị Neon Cloud Console để quay về thời điểm trước sự cố.

---

## 6. Quy Ước Nhóm & Quản Lý Mã Nguồn

* **Chiến lược nhánh (Branching):**  
  Mọi tính năng phát triển trên nhánh riêng theo mẫu `<tên-thành-viên>/<tên-task>` (ví dụ: `tai/task-2.2-sequence-checkout`). Tuyệt đối không commit trực tiếp vào nhánh `main`.
* **Quy chuẩn Pull Request & CI Gate:**  
  Mỗi Pull Request mở vào `main` bắt buộc phải vượt qua toàn bộ các bước kiểm tra tự động của GitHub Actions (`ci.yml`): `Install -> Lint -> Unit Test -> Build`.
* **Quy chuẩn Commit:** Tuân thủ chuẩn Conventional Commits tiếng Việt có dấu:  
  `<loại>(<phạm-vi>): <mô tả>` (ví dụ: `feat(orders): tích hợp cơ chế server-side pricing`, `docs(task-8): hoàn thiện ma trận truy vết`).
* **Hợp đồng giao tiếp API:** Đặt tại [`docs/architecture/api-contract.md`](./docs/architecture/api-contract.md). Mọi thay đổi về cấu trúc request/response phải được thông báo và thống nhất giữa hai thành viên.
