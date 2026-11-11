import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser, JwtAuthGuard, type AuthUser } from '../auth/jwt-auth.guard.js';
import { LoyaltyService } from './loyalty.service.js';

@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyalty: LoyaltyService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMyLoyalty(@CurrentUser() user: AuthUser) {
    return this.loyalty.getMyLoyalty(user.phone);
  }
}
