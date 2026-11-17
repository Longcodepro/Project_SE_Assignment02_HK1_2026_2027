/**
 * Unit Test cho ProductsController sử dụng Vitest và thư viện @nestjs/testing.
 *
 * Mục đích của file này:
 * 1. Kiểm thử tính đúng đắn của logic Controller và Service mà KHÔNG cần kết nối database thật.
 * 2. Đảm bảo các ràng buộc nghiệp vụ (chỉ hiện món danh mục active, 404 khi không tìm thấy, 400 khi sai kiểu ID).
 * 3. Chạy tự động trong CI/CD pipeline trước khi code được merge vào main.
 */

import { Test } from '@nestjs/testing';
import request from 'supertest';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';

// Dữ liệu mẫu (mock data) nằm cố định trên RAM để giả lập kết quả trả về từ database
const rows = [
  {
    id: 1,
    name: 'Cà phê sữa',
    price: 29000,
    imageUrl: 'https://example.com/ca-phe-sua.jpg',
    isAvailable: true,
    categoryId: 1,
    category: { id: 1, name: 'Cà phê' },
  },
];

describe('ProductsController', () => {
  /**
   * TEST CASE 1: Lấy danh sách sản phẩm thành công
   * Kiểm tra endpoint GET /products trả về mã 200, đúng cấu trúc DTO và gọi đúng query xuống Prisma.
   */
  it('GET /products trả về danh sách đúng hình dạng kèm category và isAvailable', async () => {
    // 1. Tạo hàm giả lập (mock): khi gọi findMany, trả về mảng `rows` mà không đụng tới Postgres
    const findMany = vi.fn().mockResolvedValue(rows);

    // 2. Dựng module NestJS ảo trong bộ nhớ (In-memory Test Container)
    const moduleRef = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        ProductsService,
        // Kỹ thuật Dependency Injection: Thay thế PrismaService thật bằng object giả chứa hàm findMany
        { provide: PrismaService, useValue: { product: { findMany } } },
      ],
    }).compile();

    // 3. Khởi tạo ứng dụng NestJS ảo
    const app = moduleRef.createNestApplication();
    await app.init();

    // 4. Dùng supertest bắn request HTTP GET /products vào ứng dụng ảo
    const res = await request(app.getHttpServer()).get('/products').expect(200);

    // 5. Kiểm tra kết quả trả về khớp chính xác với cấu trúc mong đợi
    expect(res.body).toEqual([
      {
        id: 1,
        name: 'Cà phê sữa',
        price: 29000,
        imageUrl: 'https://example.com/ca-phe-sua.jpg',
        isAvailable: true,
        category: { id: 1, name: 'Cà phê' },
      },
    ]);

    // 6. Kiểm tra Prisma có được gọi đúng các tham số nghiệp vụ (chỉ lấy category active, sort id tăng dần)
    expect(findMany).toHaveBeenCalledWith({
      where: { category: { isActive: true } },
      orderBy: { id: 'asc' },
      include: { category: { select: { id: true, name: true } } },
    });

    // 7. Đóng ứng dụng để giải phóng tài nguyên RAM và socket
    await app.close();
  });

  /**
   * TEST CASE 2: Lấy chi tiết một sản phẩm theo ID thành công (200 OK)
   */
  it('GET /products/:id trả về 200 cho id tồn tại', async () => {
    // Giả lập Prisma findUnique tìm thấy sản phẩm có id = 1
    const findUnique = vi.fn().mockResolvedValue(rows[0]);

    const moduleRef = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: { product: { findUnique } } },
      ],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    // Gửi request GET /products/1
    const res = await request(app.getHttpServer()).get('/products/1').expect(200);

    // Dữ liệu trả về phải được loại bỏ trường `categoryId` thừa, chỉ giữ lại object `category`
    expect(res.body).toEqual({
      id: 1,
      name: 'Cà phê sữa',
      price: 29000,
      imageUrl: 'https://example.com/ca-phe-sua.jpg',
      isAvailable: true,
      category: { id: 1, name: 'Cà phê' },
    });

    await app.close();
  });

  /**
   * TEST CASE 3: Sản phẩm thuộc danh mục bị ẩn (isActive = false)
   * Nghiệp vụ quy định: Nếu danh mục bị ẩn, sản phẩm cũng không được lộ diện -> Phải trả về 404 Not Found.
   */
  it('GET /products/:id chỉ tìm món của danh mục đang hiện; món của danh mục ẩn trả 404', async () => {
    // Giả lập DB không tìm thấy bản ghi nào khớp điều kiện category isActive = true
    const findUnique = vi.fn().mockResolvedValue(null);

    const moduleRef = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: { product: { findUnique } } },
      ],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    // Kiểm tra request trả về đúng mã trạng thái HTTP 404
    await request(app.getHttpServer()).get('/products/1').expect(404);

    // Kiểm tra xem query gửi xuống DB có đúng là có điều kiện `category: { isActive: true }` hay không
    expect(findUnique.mock.calls[0][0].where).toEqual({ id: 1, category: { isActive: true } });

    await app.close();
  });

  /**
   * TEST CASE 4: Kiểm tra trường mô tả món (description)
   */
  it('GET /products trả thêm mô tả món (description)', async () => {
    const findMany = vi.fn().mockResolvedValue([{ ...rows[0], description: 'Cà phê phin pha sữa đặc' }]);

    const moduleRef = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: { product: { findMany } } },
      ],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    const res = await request(app.getHttpServer()).get('/products').expect(200);
    expect(res.body[0].description).toBe('Cà phê phin pha sữa đặc');

    await app.close();
  });

  /**
   * TEST CASE 5: ID không tồn tại trong database -> Trả 404
   */
  it('GET /products/:id trả về 404 cho id không tồn tại', async () => {
    const findUnique = vi.fn().mockResolvedValue(null);

    const moduleRef = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: { product: { findUnique } } },
      ],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    // ID = 999 không có trong DB -> Expect HTTP status 404
    await request(app.getHttpServer()).get('/products/999').expect(404);

    await app.close();
  });

  /**
   * TEST CASE 6: ID sai định dạng (không phải số nguyên) -> Trả 400 Bad Request
   * Kiểm tra ParseIntPipe của NestJS: chặn ngay tại Controller, không gọi vào Service hay DB.
   */
  it('GET /products/:id trả về 400 cho id không phải số', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: { product: {} } }, // Không cần mock hàm nào vì không bao giờ được gọi tới
      ],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    // Gửi ID dạng chuỗi 'abc' -> ParseIntPipe phải ném 400 Bad Request
    await request(app.getHttpServer()).get('/products/abc').expect(400);

    await app.close();
  });
});
