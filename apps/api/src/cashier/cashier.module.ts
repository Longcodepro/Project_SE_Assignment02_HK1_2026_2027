import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { OrdersModule } from '../orders/orders.module.js';
import { CashierController } from './cashier.controller.js';
import { CashierService } from './cashier.service.js';

@Module({
  imports: [AuthModule, OrdersModule],
  controllers: [CashierController],
  providers: [CashierService],
})
export class CashierModule {}
