import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { isUniqueViolation } from '../common/idempotency.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { STAFF_ROLES, type CreateStaffDto, type UpdateStaffDto } from './dto/staff.dto.js';

const SELECT = { phone: true, name: true, role: true, isLocked: true } as const;

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  // Nhân viên và Manager, không có khách hàng
  list() {
    return this.prisma.user.findMany({
      where: { role: { not: 'CUSTOMER' } },
      orderBy: { createdAt: 'asc' },
      select: { ...SELECT, createdAt: true },
    });
  }

  async create(dto: CreateStaffDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    try {
      return await this.prisma.user.create({
        data: { phone: dto.phone, passwordHash, name: dto.name, role: dto.role },
        select: SELECT,
      });
    } catch (e) {
      if (isUniqueViolation(e)) throw new ConflictException('Số điện thoại đã được đăng ký');
      throw e;
    }
  }

  async update(phone: string, dto: UpdateStaffDto) {
    if (dto.role === undefined && dto.isLocked === undefined) {
      throw new BadRequestException('Cần gửi ít nhất một trong hai trường: role, isLocked');
    }
    const user = await this.prisma.user.findUnique({ where: { phone }, select: { role: true } });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản');
    // Không động tới Manager và khách hàng, kể cả khóa nhầm chính mình
    if (!(STAFF_ROLES as readonly string[]).includes(user.role)) {
      throw new ConflictException('Chỉ quản lý được tài khoản nhân viên');
    }
    return this.prisma.user.update({
      where: { phone },
      data: { role: dto.role, isLocked: dto.isLocked },
      select: SELECT,
    });
  }
}
