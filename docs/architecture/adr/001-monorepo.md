# ADR 001: Sử Dụng Cấu Trúc Monorepo Cho Toàn Bộ Dự Án

> **Trạng thái:** ĐÃ CHẤP NHẬN (ACCEPTED)  
> **Ngày quyết định:** 2026-10-25  
> **Người tham gia:** Nguyễn Thành Long (`Longcodepro`), Trần Quốc Tài (`TaiTran263`)

---

## 1. Bối Cảnh (Context)
Dự án BrewLite bao gồm hai ứng dụng độc lập:
* **Frontend:** Next.js 16 (`apps/web`).
* **Backend:** NestJS 12 (`apps/api`).
* **Tài liệu & Kiểm thử:** Thư mục `docs/`, `tests/`, và cấu hình `docker-compose.yml`.

Nhóm cần lựa chọn giữa hai phương án quản lý mã nguồn:
1. **Polyrepo (Multi-repo):** Tạo 2 kho GitHub riêng biệt cho Frontend và Backend.
2. **Monorepo:** Gộp toàn bộ Frontend, Backend, tài liệu thiết kế và CI/CD vào chung một kho GitHub duy nhất.

---

## 2. Quyết Định (Decision)
Nhóm quyết định áp dụng mô hình **Monorepo** với cấu trúc thư mục phân cấp rõ ràng:

```
.
├── apps/
│   ├── web/            # Next.js 16 (Frontend)
│   └── api/            # NestJS 12 + Prisma (Backend)
├── docs/               # requirements, diagrams, architecture (ADR)
├── tests/              # kiểm thử end-to-end (Planned)
├── scripts/            # tiện ích vận hành (tunnel, logs)
├── .github/workflows/  # ci.yml, cd.yml
├── docker-compose.yml
└── .env.example
```

Mỗi ứng dụng trong `apps/` có `package.json` và `package-lock.json` riêng (npm), không dùng công cụ workspace ở thư mục gốc; hai app chỉ giao tiếp qua hợp đồng HTTP trong `docs/architecture/api-contract.md`.

---

## 3. Hệ Quả (Consequences)

### Tích cực (Ưu điểm):
* **Một Pull Request cho một chức năng xuyên tầng:** thay đổi API và giao diện đi cùng nhau, người review thấy đủ ngữ cảnh.
* **Tài liệu nằm cạnh mã nguồn:** `docs/` được kiểm soát phiên bản chung, đáp ứng yêu cầu tài liệu phải có trong lịch sử Git trước khi viết mã.
* **Một pipeline CI/CD duy nhất:** `ci.yml` kiểm tra cả `apps/web` và `apps/api` trên mọi Pull Request; `docker-compose.yml` chạy trọn bộ hệ thống chỉ bằng một lệnh.
* **Phù hợp nhóm 2 người:** không phải đồng bộ phiên bản giữa nhiều kho, một lần `git clone` là đủ.

### Tiêu cực (Hạn chế & Đánh đổi):
* **Lịch sử Git dùng chung:** commit của Frontend và Backend xen kẽ nhau; cần quy ước nhánh `<tên>/task-N-mô-tả` và commit rõ ràng để dễ truy vết.
* **Không có cách ly quyền truy cập theo ứng dụng:** ai có quyền ghi vào kho đều chạm được cả hai phần; phân vai (Long sửa `apps/api`, Tài sửa `apps/web`) dựa vào quy ước nhóm và review chéo.
* **Phải tự giữ hai `package-lock.json` đồng bộ:** không có công cụ workspace nên mỗi app cài phụ thuộc riêng.
