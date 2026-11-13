import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { KdsController } from './kds.controller.js';
import { KdsService } from './kds.service.js';

@Module({
  imports: [AuthModule],
  controllers: [KdsController],
  providers: [KdsService],
})
export class KdsModule {}
