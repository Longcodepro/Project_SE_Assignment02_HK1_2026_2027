/**
 * DTO và các hàm chuẩn hóa dữ liệu cho AuthModule.
 *
 * Nhiệm vụ:
 * 1. Chuẩn hóa dữ liệu đầu vào (normalize số điện thoại Việt Nam, viết thường email).
 * 2. Kiểm duyệt chặt chẽ (Validation) bằng class-validator (Regex, Min/MaxLength).
 * 3. Sinh tài liệu Swagger UI tự động qua các decorator @ApiProperty.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Role } from '../../generated/prisma/enums.js';

/**
 * Hàm chuẩn hóa số điện thoại:
 * Chuyển đổi đầu số quốc tế +84 thành đầu số 0 chuẩn Việt Nam.
 * Ví dụ: "+84901234567" -> "0901234567"
 */
export const normalizePhone = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (trimmed.startsWith('+84')) {
    return '0' + trimmed.slice(3);
  }
  return trimmed;
};

/**
 * Hàm chuẩn hóa email: Cắt khoảng trắng thừa và đưa về chữ thường để tránh trùng lặp tài khoản.
 */
const normalizeEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

/**
 * DTO nhận dữ liệu đăng nhập từ Client
 */
export class LoginDto {
  @ApiProperty({
    example: '0901234567',
    description: 'Số di động VN 10 chữ số (+84 tự đổi thành 0)',
  })
  @Transform(normalizePhone) // Tự động chạy hàm chuẩn hóa trước khi validate
  @Matches(/^0[35789]\d{8}$/, {
    message:
      'Số điện thoại không hợp lệ (yêu cầu số di động Việt Nam 10 chữ số)',
  })
  phone!: string;

  @ApiProperty({ example: 'matkhau123', maxLength: 72 })
  @IsString()
  @MinLength(1)
  @MaxLength(72) // Giới hạn 72 byte vì bcrypt chỉ xử lý tối đa 72 byte
  password!: string;
}

/**
 * DTO nhận dữ liệu đăng ký tài khoản khách hàng mới
 */
export class RegisterDto {
  @ApiProperty({
    example: '0901234567',
    description: 'Số di động VN 10 chữ số (+84 tự đổi thành 0)',
  })
  @Transform(normalizePhone)
  @Matches(/^0[35789]\d{8}$/, {
    message:
      'Số điện thoại không hợp lệ (yêu cầu số di động Việt Nam 10 chữ số)',
  })
  phone!: string;

  // Thuật toán bcrypt chỉ băm 72 byte đầu tiên nên cần chặn mật khẩu quá 72 ký tự
  @ApiProperty({ example: 'matkhau123', minLength: 6, maxLength: 72 })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  @MaxLength(72, { message: 'Mật khẩu không được vượt quá 72 ký tự' })
  password!: string;

  @ApiPropertyOptional({ example: 'Nguyễn Văn A', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'a@example.com' })
  @IsOptional()
  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  email?: string;
}

/**
 * DTO phản hồi sau khi đăng ký tài khoản thành công.
 * TUYỆT ĐỐI không có trường passwordHash ở đây để đảm bảo an toàn.
 */
export class RegisterResponseDto {
  @ApiProperty({ example: '0901234567' })
  phone!: string;

  @ApiProperty({ example: 'Nguyễn Văn A', nullable: true, type: String })
  name!: string | null;

  @ApiProperty({ example: 'a@example.com', nullable: true, type: String })
  email!: string | null;

  @ApiProperty({ enum: Role, example: Role.CUSTOMER })
  role!: string;
}

/**
 * DTO phản hồi sau khi đăng nhập thành công.
 * Trả về chuỗi JWT Access Token.
 */
export class LoginResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT, gửi kèm header Authorization: Bearer <accessToken>',
  })
  accessToken!: string;
}
