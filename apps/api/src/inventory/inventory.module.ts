import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { InventoryController } from './inventory.controller.js';
import { InventoryService } from './inventory.service.js';
import { RecipesController } from './recipes.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [InventoryController, RecipesController],
  providers: [InventoryService],
})
export class InventoryModule {}
