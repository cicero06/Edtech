import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus() {
    return {
      name: 'Denge Kasabası API',
      status: 'ok',
      frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
      endpoints: ['/sessions', '/sessions/:id/events', '/sessions/:id/summary'],
    };
  }
}
