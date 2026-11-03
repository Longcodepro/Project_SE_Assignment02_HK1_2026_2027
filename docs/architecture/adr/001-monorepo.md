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