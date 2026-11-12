import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

const normalizePhone = ({ value }: { value: unknown }) => {
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
  @Transform(normalizePhone)
  @Matches(/^0[35789]\d{8}$/, {
    message: 'Số điện thoại không hợp lệ (yêu cầu số di động Việt Nam 10 chữ số)',
  })
  phone!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(72)
  password!: string;
}

export class RegisterDto {
  @Transform(normalizePhone)
  @Matches(/^0[35789]\d{8}$/, {
    message: 'Số điện thoại không hợp lệ (yêu cầu số di động Việt Nam 10 chữ số)',
  })
  phone!: string;

  // bcrypt chỉ băm 72 byte đầu nên chặn mật khẩu dài hơn
  @IsString()
  @MinLength(6)
  @MaxLength(72)
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  email?: string;
}
