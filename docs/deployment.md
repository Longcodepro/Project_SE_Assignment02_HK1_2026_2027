# Kế Hoạch & Hướng Dẫn Triển Khai Hệ Thống — Deployment Guide (Task 3.2)

> **Dự án:** Ứng dụng đặt cà phê không tiền mặt BrewLite  
> **Môn học:** Công nghệ phần mềm — Học kỳ 1, Năm học 2026–2027  
> **Tài liệu tạo phẩm:** `docs/deployment.md` (Phục vụ Task 3.2 & Task 5.4 của đề bài)  
> **Mã Issue quản lý:** `[D3.2b] docs/deployment.md`  
> **Người thực hiện:** **Nguyễn Thành Long (`Longcodepro`)** & **Trần Quốc Tài (`TaiTran263`)**  
> **Sơ đồ đối chiếu:** [`docs/diagrams/deployment.puml`](./diagrams/deployment.puml) (Ảnh vector: [`deployment.svg`](./diagrams/deployment.svg))  
> **Tệp cấu hình liên quan:** `docker-compose.yml`, `.env.example`, `.github/workflows/ci.yml`, `.github/workflows/cd.yml`

---

## 1. Nền Tảng Hạ Tầng Thực Tế & Địa Chỉ URL Production

Hệ thống BrewLite được triển khai trên nền tảng điện toán đám mây hiện đại theo kiến trúc phân tách ranh giới, đảm bảo tính sẵn sàng cao, chứng chỉ bảo mật SSL/TLS mã hóa toàn diện (HTTPS) và chi phí tối ưu:

| Thành phần hệ thống | Nền tảng hạ tầng thực tế | URL Truy cập Production (HTTPS) | Giao thức & Cổng | Ghi chú vận hành |
|---|---|---|:---:|---|
| **Frontend Web App** | **Vercel Global Edge Network** | `https://brewlite-web.vercel.app` | HTTPS (443) | Phục vụ giao diện Next.js 16 Mobile-first qua mạng lưới CDN toàn cầu. |
| **Backend API Service** | **Render Cloud Services** | `https://brewlite-api.onrender.com` | HTTPS (443) | Chạy Container NestJS tự động triển khai từ Docker Image trên GHCR. |
| **Health Check Endpoint** | **Render Web Service** | `https://brewlite-api.onrender.com/health` | HTTPS (443) | Endpoint giám sát trạng thái sức khỏe máy chủ (trả về HTTP 200 `{ status: "ok" }`). |
| **Tài liệu API (Swagger)** | **Render Web Service** | `https://brewlite-api.onrender.com/api/docs` | HTTPS (443) | Giao diện tài liệu tương tác chuẩn OpenAPI 3.0. |
| **Database PostgreSQL** | **Neon Serverless Cloud** | `ep-dry-pond-xxx.ap-southeast-1.aws.neon.tech` | TLS / SSL (5432) | CSDL PostgreSQL 16 đặt tại Singapore (`ap-southeast-1`), lưu trữ NVMe bền vững. |
| **Demo Tunnel (Dự phòng)** | **Cloudflare Tunnel (Zero Trust)** | `https://demo.brewlite.online` | HTTPS (443) | Phát luồng HTTPS trực tiếp từ môi trường Local cho phép chấm bài trên smartphone thật. |

> 🔒 **Nguyên tắc an ninh CSDL:** Cơ sở dữ liệu Neon Production **tuyệt đối không mở cổng công khai trực tiếp** cho truy cập nặc danh; mọi kết nối từ Render API đều bắt buộc phải kích hoạt giao thức mã hóa đường truyền `sslmode=require`.

---

## 2. Quản Lý Bí Mật (Secrets) & Biến Môi Trường (Environment Variables)

Hệ thống tuân thủ nghiêm ngặt nguyên tắc **Twelve-Factor App: Tách biệt hoàn toàn cấu hình khỏi mã nguồn**. Tuyệt đối không bao giờ commit mật khẩu, khóa bí mật thật vào kho Git (Tệp `.gitignore` bảo vệ `.env`).

### 2.1. Danh mục biến môi trường tiêu chuẩn (`.env.example`)

```ini
# ==============================================================================
# BREWLITE ENVIRONMENT TEMPLATE (.env.example)
# Tuyệt đối không ghi giá trị thật vào tệp này.
# ==============================================================================

# Cấu hình CSDL PostgreSQL (Yêu cầu sslmode=require trên Production)
DATABASE_URL="postgresql://<user>:<password>@<host>:5432/<dbname>?sslmode=require"

# Bí mật ký phát JSON Web Token (JWT)
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_EXPIRES_IN="24h"

# Cổng mạng nội bộ & URL Frontend được phép gọi CORS
PORT=4003
FRONTEND_URL="https://brewlite-web.vercel.app"

# Biến môi trường Frontend (Next.js)
NEXT_PUBLIC_API_URL="https://brewlite-api.onrender.com"
```

### 2.2. Phân cấp quản lý Secrets trên từng môi trường

1. **Môi trường CI/CD (GitHub Secrets):**
   - Quản lý tập trung tại `Settings -> Secrets and variables -> Actions`:
     - `GHCR_PAT`: Personal Access Token có quyền ghi đè Docker Image lên GitHub Container Registry.
     - `RENDER_DEPLOY_HOOK_URL`: Webhook URL bí mật dùng để kích hoạt Render tự động deploy bản mới.
2. **Môi trường Backend (Render Environment):**
   - Khai báo an toàn trên trang quản trị Render: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`.
   - Các giá trị này được Render mã hóa lưu trữ và chỉ nạp vào biến môi trường (`process.env`) khi container khởi động.
3. **Môi trường Frontend (Vercel Environment Variables):**
   - Cấu hình tại Vercel Dashboard: `NEXT_PUBLIC_API_URL` trỏ về API Production của Render.

---

## 3. Quy Trình Triển Khai Tự Động (Continuous Deployment - CD Pipeline)

Toàn bộ quy trình triển khai được tự động hóa thông qua pipeline GitHub Actions (`.github/workflows/cd.yml`) mỗi khi có Pull Request được merge vào nhánh `main`:

```
[Git Push / Merge main]
          |
          v
   +--------------+
   | Quality Gate | (Install -> Lint -> Unit Test -> Build)
   +------+-------+
          |
          v (Nếu pass 100%)
   +--------------+
   | Docker Build | (Docker Buildx: Đóng gói apps/api thành Container Image)
   +------+-------+
          |
          v
   +--------------+
   | Push to GHCR | (Đẩy image lên ghcr.io/longcodepro/brewlite-api:latest & sha)
   +------+-------+
          |
          v
   +--------------+
   | Trigger CD   | (Gọi Deploy Hook kích hoạt Render kéo Image mới về)
   +------+-------+
          |
          v
   +--------------+
   |  DB Migrate  | (Chạy: npx prisma migrate deploy trước khi switch traffic)
   +------+-------+
          |
          v
   +--------------+
   |  Smoke Test  | (Gửi request GET /health kiểm tra tính sẵn sàng)
   +--------------+
```

### Chi tiết các bước thực thi tự động:
1. **Quality Gate:** Kiểm tra toàn diện linting và unit test của cả `apps/web` và `apps/api`. Nếu có bất kỳ bài test nào thất bại, pipeline dừng ngay lập tức.
2. **Đóng gói Docker:** Build Docker Image đa nền tảng (Linux amd64) từ `apps/api/Dockerfile`, gắn nhãn (tag) bằng commit SHA ngắn (ví dụ: `:a59c85b`) và tag `:latest`.
3. **Phát hành lên Container Registry:** Push image bảo mật vào GitHub Packages Container Registry (`ghcr.io`).
4. **Cập nhật Render:** Kích hoạt Render Deploy Hook. Render tự động kéo image mới về, nạp các secret đã cấu hình và khởi động container.
5. **Chạy Migration an toàn:** Render chạy lệnh tiền triển khai (Pre-deploy Command):
   ```bash
   npx prisma migrate deploy
   ```
   Đảm bảo schema CSDL được nâng cấp trước khi container mới tiếp nhận lượt truy cập của người dùng.
6. **Kiểm thử khói (Smoke Test):** Pipeline CI/CD tự động gọi `GET https://brewlite-api.onrender.com/health`. Nếu trả về HTTP 200 OK thì đánh dấu triển khai thành công.

---

## 4. Cơ Chế Giám Sát, Nhật Ký (Logs) & Kiểm Tra Sức Khỏe (Health Check)

### 4.1. Endpoint Health Check
- **Địa chỉ:** `GET /health`
- **Thời gian phản hồi:** Dưới $50\text{ms}$.
- **Cấu trúc phản hồi JSON:**
  ```json
  {
    "status": "ok",
    "timestamp": "2026-11-07T15:30:00.000Z"
  }
  ```
- **Ứng dụng:** Được Render cấu hình làm **Health Check Path**. Nếu container gặp sự cố không phản hồi HTTP 200 trong 3 lần thăm dò liên tiếp (mỗi lần cách nhau 15 giây), Render sẽ tự động cô lập container lỗi và khởi động lại container mới.

### 4.2. Quản trị nhật ký thời gian thực (Live Streaming Logs)
- Toàn bộ log của backend được ghi chuẩn hóa ra các luồng `stdout` (thông tin bình thường) và `stderr` (cảnh báo, ngoại lệ).
- Render tự động thu thập và lưu trữ log luồng theo thời gian thực (Live Logs Viewer), cho phép nhóm lọc log theo timestamp, level (`INFO`, `WARN`, `ERROR`) để truy vết sự cố nhanh chóng.

---

## 5. Quy Trình Khôi Phục Sự Cố Từng Bước (Step-by-Step Rollback Guide)

Khi phiên bản mới phát sinh lỗi nghiêm trọng trên Production (Zero-Day bug, lỗi logic thanh toán, CSDL xung đột), nhóm thực hiện quy trình Rollback theo 3 cấp độ:

### Cấp độ 1: Rollback Frontend trên Vercel (Thao tác trong 10 giây)
1. Truy cập Vercel Dashboard $\rightarrow$ Chọn dự án `brewlite-web`.
2. Chuyển đến tab **Deployments**.
3. Tìm bản deployment ổn định gần nhất trước đó (có nhãn màu xanh lá).
4. Bấm vào dấu ba chấm `(...)` $\rightarrow$ Chọn **Instant Rollback**.
5. Vercel lập tức chuyển hướng 100% traffic CDN toàn cầu về bản cũ mà **không cần build lại source code**.

### Cấp độ 2: Rollback Backend trên Render (Thao tác trong 1-2 phút)
1. Truy cập Render Dashboard $\rightarrow$ Chọn dịch vụ `brewlite-api`.
2. Vào mục **Events / Deploy History**.
3. Chọn bản deploy ổn định trước đó (dựa theo commit SHA đã được kiểm thử).
4. Bấm **Rollback to this deploy**.
5. Render sẽ kích hoạt lại Docker Image của commit SHA cũ trên GHCR và chuyển lưu lượng mạng về phiên bản an toàn.

### Cấp độ 3: Rollback Cơ sở dữ liệu (Database Rollback)
- **Nếu lỗi do Migration mới:**
  1. Kiểm tra file migration gây lỗi trong `apps/api/prisma/migrations/`.
  2. Tạo một file migration mới theo chiều ngược lại (Revert Migration) để hoàn tác cấu trúc bảng hoặc dùng lệnh:
     ```bash
     npx prisma migrate resolve --rolled-back <ten_migration_loi>
     ```
- **Nếu lỗi làm hỏng dữ liệu:**
  1. Truy cập trang quản trị Neon Cloud Console $\rightarrow$ Chọn mục **Branches & Restore**.
  2. Sử dụng tính năng **Point-in-Time Recovery (PITR)** của Neon: Khôi phục trạng thái CSDL về thời điểm chính xác trước khi xảy ra sự cố (ví dụ: 10 phút trước).

---

## 6. Hướng Dẫn Chạy Môi Trường Local & Demo Thuyết Trình

### 6.1. Khởi động nhanh bằng Docker Compose
Để thầy cô hoặc bạn bè có thể clone repository và chạy toàn bộ hệ thống ở máy cá nhân mà không cần cài Node.js hay PostgreSQL:

```powershell
# 1. Clone repository
git clone https://github.com/Longcodepro/Project_SE_Assignment02_HK1_2026_2027.git
cd Project_SE_Assignment02_HK1_2026_2027

# 2. Tạo file biến môi trường local từ mẫu
cp .env.example .env

# 3. Khởi chạy toàn bộ 3 dịch vụ (Web, API, DB)
docker compose up -d --build
```
- **Web Frontend:** Mở trình duyệt truy cập `http://localhost:4004`.
- **Backend API & Swagger:** `http://localhost:4003/api/docs`.
- **Database PostgreSQL:** Cổng kết nối `localhost:4005`.

### 6.2. Chia sẻ luồng demo lên điện thoại thật qua Cloudflare Tunnel
Khi cần thuyết trình hoặc chấm bài trực tiếp bằng điện thoại di động:
```bash
# Chạy script khởi tạo Cloudflare Tunnel
bash scripts/start-tunnel.sh
```
Hệ thống sẽ cung cấp một đường dẫn HTTPS công khai tạm thời để bất kỳ smartphone nào quét mã QR cũng có thể đặt món và thanh toán demo mượt mà.
