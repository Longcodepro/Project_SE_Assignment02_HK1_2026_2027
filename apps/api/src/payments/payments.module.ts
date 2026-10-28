import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { MockPaymentGateway } from './mock-gateway.js';
import { PaymentsController } from './payments.controller.js';
import { PaymentsService } from './payments.service.js';

@Module({
  imports: [AuthModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, MockPaymentGateway],
})
export class PaymentsModule {}
