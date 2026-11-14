import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { Role } from '../../generated/prisma/enums.js';

export const normalizePhone = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (trimmed.startsWith('+84')) {
    return '0' + trimmed.slice(3);
  }
  return trimmed;
};

const normalizeEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class LoginDto {
  @ApiProperty({ example: '0901234567', description: 'Số di động VN 10 chữ số (+84 tự đổi thành 0)' })
  @Transform(normalizePhone)
  @Matches(/^0[35789]\d{8}$/, {
    message: 'Số điện thoại không hợp lệ (yêu cầu số di động Việt Nam 10 chữ số)',
  })
  phone!: string;

  @ApiProperty({ example: 'matkhau123', maxLength: 72 })
  @IsString()
  @MinLength(1)
  @MaxLength(72)
  password!: string;
}

export class RegisterDto {
  @ApiProperty({ example: '0901234567', description: 'Số di động VN 10 chữ số (+84 tự đổi thành 0)' })
  @Transform(normalizePhone)
  @Matches(/^0[35789]\d{8}$/, {
    message: 'Số điện thoại không hợp lệ (yêu cầu số di động Việt Nam 10 chữ số)',
  })
  phone!: string;

  // bcrypt chỉ băm 72 byte đầu nên chặn mật khẩu dài hơn
  @ApiProperty({ example: 'matkhau123', minLength: 6, maxLength: 72 })
  @IsString()
  @MinLength(6)
  @MaxLength(72)
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

export class LoginResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT, gửi kèm header Authorization: Bearer <accessToken>',
  })
  accessToken!: string;
}
