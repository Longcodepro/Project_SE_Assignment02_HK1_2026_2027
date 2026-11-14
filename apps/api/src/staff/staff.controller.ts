import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles, RolesGuard } from '../auth/roles.guard.js';
import {
  CreateStaffDto,
  StaffDto,
  StaffListItemDto,
  StaffParamsDto,
  UpdateStaffDto,
} from './dto/staff.dto.js';
import { StaffService } from './staff.service.js';

@ApiTags('admin-staff')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Thiếu hoặc sai token' })
@ApiForbiddenResponse({ description: 'Không phải tài khoản MANAGER' })
@Controller('admin/staff')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MANAGER')
export class StaffController {
  constructor(private readonly staff: StaffService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách nhân viên và Manager, cũ nhất lên đầu' })
  @ApiOkResponse({ type: StaffListItemDto, isArray: true })
  list() {
    return this.staff.list();
  }

  @Post()
  @ApiOperation({ summary: 'Tạo tài khoản nhân viên (BARISTA hoặc CASHIER)' })
  @ApiCreatedResponse({ type: StaffDto })
  @ApiBadRequestResponse({ description: 'Dữ liệu không hợp lệ hoặc role ngoài BARISTA/CASHIER' })
  @ApiConflictResponse({ description: 'Số điện thoại đã có tài khoản' })
  create(@Body() dto: CreateStaffDto) {
    return this.staff.create(dto);
  }

  @Patch(':phone')
  @ApiOperation({ summary: 'Đổi vai trò, khóa hoặc mở khóa tài khoản nhân viên' })
  @ApiOkResponse({ type: StaffDto })
  @ApiBadRequestResponse({ description: 'Body rỗng, sai kiểu, hoặc SĐT không hợp lệ' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy tài khoản' })
  @ApiConflictResponse({ description: 'Tài khoản không phải nhân viên (MANAGER, CUSTOMER)' })
  update(@Param() { phone }: StaffParamsDto, @Body() dto: UpdateStaffDto) {
    return this.staff.update(phone, dto);
  }
}
