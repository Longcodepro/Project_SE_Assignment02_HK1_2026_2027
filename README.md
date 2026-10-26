# BrewLite

Ứng dụng đặt cà phê không dùng tiền mặt. Next.js (web) · NestJS (api) · PostgreSQL · Docker Compose.

Luồng chính: Xem menu → Chọn tùy chọn → Giỏ hàng → Đặt đơn → Thanh toán → Theo dõi đơn.

## Cấu trúc

```
apps/web/     Next.js mobile-first
apps/api/     NestJS + Prisma (migration, seed, test, Swagger, Postman)
docs/         requirements/ · diagrams/ · architecture/ (kèm adr/) · traceability-matrix.md · deployment.md
tests/        integration / E2E
.github/      workflows CI/CD, mẫu Pull Request
docker-compose.yml · .env.example
```

## Chạy dự án

Yêu cầu: Docker + Docker Compose.

```bash
cp .env.example .env     # rồi sửa POSTGRES_PASSWORD, JWT_SECRET
docker compose up --build
```

| Service  | URL                    |
|----------|------------------------|
| Web      | http://localhost:4001  |
| API      | http://localhost:4000  |
| Swagger  | http://localhost:4000/docs |
| Postgres | localhost:4002         |

Migration và seed tự chạy khi API khởi động. Dừng: `docker compose down` (thêm `-v` để xóa dữ liệu DB).

Chạy không cần Docker (Node.js 22+, cần `DATABASE_URL`):

```bash
cd apps/api && npm ci && npx prisma migrate dev && npx prisma db seed && PORT=4000 npm run start:dev
cd apps/web && npm ci && NEXT_PUBLIC_API_URL=http://localhost:4000 npm run dev
```

## Kiểm thử

```bash
cd apps/api && npm run lint && npm run build && npm test
cd apps/api && npm run postman      # cần API đang chạy
cd apps/web && npm run lint && npm run build
```

## Quy ước

- Nhánh: `<tên-người>/<mô-tả-ngắn>`, không push thẳng `main`, merge qua Pull Request và CI xanh.
- Commit: `<loại>(<phạm-vi>): <mô tả>` (feat, fix, chore, docs, refactor, test, style), tiếng Việt có dấu.
- Hợp đồng API: `docs/architecture/api-contract.md`. Đổi hợp đồng phải báo người còn lại.
