import { ValidationPipe } from '@nestjs/common';

// Dùng chung cho main.ts và test để hai bên validate giống nhau.
export const createValidationPipe = () =>
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });
