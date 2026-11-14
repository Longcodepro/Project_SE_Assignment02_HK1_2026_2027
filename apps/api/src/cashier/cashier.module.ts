import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CashierController } from './cashier.controller.js';
import { CashierService } from './cashier.service.js';

@Module({
  imports: [AuthModule],
  controllers: [CashierController],
  providers: [CashierService],
})
export class CashierModule {}
