import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { MenuAdminController } from './menu-admin.controller.js';
import { MenuOptionsController } from './menu-options.controller.js';
import { MenuService } from './menu.service.js';

@Module({
  imports: [AuthModule],
  controllers: [MenuAdminController, MenuOptionsController],
  providers: [MenuService],
})
export class MenuModule {}
