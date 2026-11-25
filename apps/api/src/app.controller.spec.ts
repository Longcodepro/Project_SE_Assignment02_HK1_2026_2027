/**
 * Unit Test cho AppController (Health check & root endpoint).
 */

import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    // Dựng module kiểm thử
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    // Kiểm tra GET / trả về 'Hello World!'
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });

    // Kiểm tra GET /health trả về status 'ok' kèm timestamp
    it('should return health status ok', () => {
      const res = appController.getHealth();
      expect(res.status).toBe('ok');
      expect(res.timestamp).toBeDefined();
    });
  });
});
