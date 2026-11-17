/**
 * AuthController: Tiếp nhận các HTTP Request liên quan đến xác thực tài khoản.
 *
 * Định tuyến:
 * - POST /auth/register: Đăng ký tài khoản khách hàng mới.
 * - POST /auth/login: Đăng nhập bằng SĐT + Mật khẩu, trả về JWT Access Token.
 */

import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import {
  LoginDto,
  LoginResponseDto,
  RegisterDto,
  RegisterResponseDto,
} from './dto/auth.dto.js';

@ApiTags('auth') // Nhóm các endpoint này vào mục 'auth' trên giao diện Swagger UI
@Controller('auth')
export class AuthController {
  // Dependency Injection: Nhúng AuthService vào Controller
  constructor(private readonly auth: AuthService) {}

  /**
   * Endpoint Đăng ký tài khoản khách hàng mới
   * Trả về HTTP 201 Created khi thành công.
   */
  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản khách hàng' })
  @ApiCreatedResponse({ type: RegisterResponseDto, description: 'Đăng ký thành công' })
  @ApiBadRequestResponse({ description: 'Dữ liệu không hợp lệ (sai định dạng SĐT, mật khẩu < 6 ký tự)' })
  @ApiConflictResponse({ description: 'Số điện thoại đã được đăng ký (trùng Primary Key)' })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  /**
   * Endpoint Đăng nhập
   * Lưu ý: Mặc định POST trong NestJS trả về 201 Created, nên dùng @HttpCode(200) để trả về đúng chuẩn 200 OK.
   */
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Đăng nhập, nhận JWT' })
  @ApiOkResponse({ type: LoginResponseDto, description: 'Đăng nhập thành công, trả về JWT Access Token' })
  @ApiBadRequestResponse({ description: 'Dữ liệu không hợp lệ' })
  @ApiUnauthorizedResponse({ description: 'Số điện thoại hoặc mật khẩu không đúng' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }
}
