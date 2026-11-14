import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Roles, RolesGuard } from '../auth/roles.guard.js';
import { ReportDto, ReportQueryDto } from './dto/report.dto.js';
import { ReportsService } from './reports.service.js';

@ApiTags('admin-reports')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Thiếu hoặc sai token' })
@ApiForbiddenResponse({ description: 'Không phải tài khoản MANAGER' })
@Controller('admin/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MANAGER')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get()
  @ApiOperation({ summary: 'Doanh thu, số đơn hoàn tất, tỷ lệ hủy theo kỳ và Top 5 món bán chạy' })
  @ApiOkResponse({ type: ReportDto })
  @ApiBadRequestResponse({ description: 'Ngày không hợp lệ, from sau to, khoảng quá 366 ngày hoặc groupBy lạ' })
  report(@Query() query: ReportQueryDto) {
    return this.reports.report(query);
  }
}
