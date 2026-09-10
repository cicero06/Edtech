import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should describe the API', () => {
      expect(appController.getStatus()).toEqual({
        name: 'Denge Kasabası API',
        status: 'ok',
        frontendUrl: 'http://localhost:5173',
        endpoints: ['/sessions', '/sessions/:id/events', '/sessions/:id/summary'],
      });
    });
  });
});
