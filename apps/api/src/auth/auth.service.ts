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

// Hash giả để login SĐT không tồn tại vẫn tốn thời gian như SĐT có thật
const DUMMY_HASH = bcrypt.hashSync('khong-ton-tai', 10);

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    try {
      return await this.prisma.user.create({
        data: {
          phone: dto.phone,
          passwordHash,
          name: dto.name,
          email: dto.email,
          role: 'CUSTOMER',
        },
        select: { phone: true, name: true, email: true, role: true },
      });
    } catch (e: unknown) {
      if ((e as { code?: string })?.code === 'P2002') {
        throw new ConflictException('Số điện thoại đã được đăng ký');
      }
      throw e;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });
    const ok = await bcrypt.compare(dto.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok) {
      throw new UnauthorizedException('Số điện thoại hoặc mật khẩu không đúng');
    }
    // Chỉ báo khóa sau khi mật khẩu đúng, để không lộ tài khoản nào đang bị khóa
    if (user.isLocked) throw new ForbiddenException('Tài khoản đã bị khóa');
    const accessToken = await this.jwt.signAsync({
      sub: user.phone,
      phone: user.phone,
      role: user.role,
    });
    return { accessToken };
  }
}
