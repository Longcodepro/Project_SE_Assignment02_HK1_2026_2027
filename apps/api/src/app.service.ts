/**
 * AppService: Tầng nghiệp vụ đơn giản cho root endpoint.
 */

import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
}
