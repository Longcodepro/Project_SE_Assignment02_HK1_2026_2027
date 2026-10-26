import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const normalizeEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class LoginDto {
  @Transform(normalizeEmail)
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(72)
  password!: string;
}

// Không extends LoginDto: class-validator bỏ decorator của lớp cha khi lớp con
// khai báo lại cùng thuộc tính, nên giới hạn 72 ký tự sẽ mất.
export class RegisterDto {
  @Transform(normalizeEmail)
  @IsEmail()
  email!: string;

  // bcrypt chỉ băm 72 byte đầu nên chặn mật khẩu dài hơn
  @IsString()
  @MinLength(6)
  @MaxLength(72)
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;
}
