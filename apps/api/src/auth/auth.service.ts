/**
 * AuthService: Tầng nghiệp vụ xử lý logic xác thực, mã hóa và bảo mật.
 *
 * Các kỹ thuật bảo mật quan trọng:
 * 1. Băm mật khẩu một chiều bằng bcryptjs với salt rounds = 10.
 * 2. Chống Timing Attack (tấn công đo thời gian) bằng DUMMY_HASH.
 * 3. Ẩn thông tin khóa tài khoản (chỉ báo khóa sau khi mật khẩu đã đúng).
 * 4. Ký token JWT chứa các trường định danh (sub, phone, role).
 */

import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import type { LoginDto, RegisterDto } from './dto/auth.dto.js';

// KỸ THUẬT CHỐNG TIMING ATTACK:
// Tạo trước một chuỗi hash giả khi server khởi động.
// Khi người dùng đăng nhập bằng SĐT KHÔNG tồn tại, hệ thống vẫn mang mật khẩu người dùng
// đi so sánh với DUMMY_HASH này để thời gian xử lý (CPU latency ~80ms) hoàn toàn giống
// như khi SĐT có tồn tại thật. Kẻ tấn công không thể dựa vào thời gian phản hồi API
// để dò xem số điện thoại nào đã đăng ký trong hệ thống.
const DUMMY_HASH = bcrypt.hashSync('khong-ton-tai', 10);

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService, // Dùng để truy vấn bảng User trong Postgres
    private readonly jwt: JwtService,       // Dùng để ký và sinh chuỗi JWT
  ) {}

  /**
   * Nghiệp vụ đăng ký tài khoản khách hàng mới
   */
  async register(dto: RegisterDto) {
    // 1. Băm mật khẩu với salt rounds = 10 (lặp 2^10 = 1024 lần)
    const passwordHash = await bcrypt.hash(dto.password, 10);

    try {
      // 2. Ghi bản ghi mới vào bảng User
      return await this.prisma.user.create({
        data: {
          phone: dto.phone,
          passwordHash,
          name: dto.name,
          email: dto.email,
          role: 'CUSTOMER', // Mặc định tự đăng ký là vai trò Khách hàng
        },
        // Chỉ chọn lọc các trường công khai trả về, TUYỆT ĐỐI không trả passwordHash
        select: { phone: true, name: true, email: true, role: true },
      });
    } catch (e: unknown) {
      // Bắt lỗi P2002 của Prisma: Vi phạm ràng buộc duy nhất (Unique / Primary Key 'phone')
      if ((e as { code?: string })?.code === 'P2002') {
        throw new ConflictException('Số điện thoại đã được đăng ký');
      }
      throw e;
    }
  }

  /**
   * Nghiệp vụ đăng nhập và cấp phát JWT
   */
  async login(dto: LoginDto) {
    // 1. Tìm tài khoản trong database theo số điện thoại
    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    // 2. So sánh mật khẩu bằng bcrypt:
    // Nếu user tồn tại: so với user.passwordHash
    // Nếu user không tồn tại: so với DUMMY_HASH để giữ nguyên độ trễ CPU (chống timing attack)
    const ok = await bcrypt.compare(dto.password, user?.passwordHash ?? DUMMY_HASH);

    // Không báo chi tiết "sai SĐT" hay "sai mật khẩu" mà gộp chung để tránh lộ thông tin
    if (!user || !ok) {
      throw new UnauthorizedException('Số điện thoại hoặc mật khẩu không đúng');
    }

    // 3. Kiểm tra trạng thái khóa tài khoản:
    // Chỉ báo khóa SAU KHI mật khẩu đúng, để kẻ xấu không thể quét danh sách tài khoản bị khóa
    if (user.isLocked) {
      throw new ForbiddenException('Tài khoản đã bị khóa');
    }

    // 4. Sinh chuỗi JWT Access Token chứa thông tin định danh (claims)
    const accessToken = await this.jwt.signAsync({
      sub: user.phone,  // Subject định danh người dùng
      phone: user.phone,
      role: user.role,  // Quyền hạn (CUSTOMER, BARISTA, ADMIN)
    });

    return { accessToken };
  }
}
