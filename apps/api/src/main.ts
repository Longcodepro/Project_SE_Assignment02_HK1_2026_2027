import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { setupSwagger } from './swagger.js';
import { createValidationPipe } from './common/validation.js';
import { AppModule, ObserveInstrument } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });

  const httpLogger = new Logger('HTTP');
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const { method, originalUrl } = req;
    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - start;
      const message = `${method} ${originalUrl} ${statusCode} - ${duration}ms`;
      if (statusCode >= 500) {
        httpLogger.error(message);
      } else if (statusCode >= 400) {
        httpLogger.warn(message);
      } else {
        httpLogger.log(message);
      }
    });
    next();
  });

  setupSwagger(app);
  app.useGlobalPipes(createValidationPipe());

  const rawFrontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:4001';
  const allowedOrigins = rawFrontendUrl.split(',').map((u) => u.trim());

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        allowedOrigins.includes('*') ||
        origin.endsWith('.vercel.app')
      ) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 4000);
}
await bootstrap();
