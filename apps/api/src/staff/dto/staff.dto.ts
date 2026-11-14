import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { normalizePhone } from '../../auth/dto/auth.dto.js';
import { Role } from '../../generated/prisma/enums.js';

// Manager chỉ tạo và đổi giữa hai vai trò nhân viên này
export const STAFF_ROLES = ['BARISTA', 'CASHIER'] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

const PHONE = /^0[35789]\d{8}$/;
const PHONE_MESSAGE = 'Số điện thoại không hợp lệ (yêu cầu số di động Việt Nam 10 chữ số)';

export class StaffParamsDto {
  @ApiProperty({ example: '0911222333' })
  @Matches(PHONE, { message: PHONE_MESSAGE })
  phone!: string;
}

export class CreateStaffDto {
  @ApiProperty({ example: '0911222333', description: 'Số di động VN 10 chữ số (+84 tự đổi thành 0)' })
  @Transform(normalizePhone)
  @Matches(PHONE, { message: PHONE_MESSAGE })
  phone!: string;

  @ApiProperty({ example: 'matkhau123', minLength: 6, maxLength: 72 })
  @IsString()
  @MinLength(6)
  @MaxLength(72)
  password!: string;

  @ApiPropertyOptional({ example: 'Thu ngân 2', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiProperty({ enum: STAFF_ROLES, example: 'CASHIER' })
  @IsIn(STAFF_ROLES)
  role!: StaffRole;
}

export class UpdateStaffDto {
  @ApiPropertyOptional({ enum: STAFF_ROLES, example: 'BARISTA' })
  @IsOptional()
  @IsIn(STAFF_ROLES)
  role?: StaffRole;

  @ApiPropertyOptional({ example: true, description: 'true là khóa, false là mở khóa' })
  @IsOptional()
  @IsBoolean()
  isLocked?: boolean;
}

export class StaffDto {
  @ApiProperty({ example: '0911222333' })
  phone!: string;

  @ApiProperty({ type: String, nullable: true, example: 'Thu ngân 2' })
  name!: string | null;

  @ApiProperty({ enum: Role, example: Role.CASHIER })
  role!: string;

  @ApiProperty({ example: false })
  isLocked!: boolean;
}

export class StaffListItemDto extends StaffDto {
  @ApiProperty({ example: '2026-11-13T03:00:00.000Z' })
  createdAt!: Date;
}
