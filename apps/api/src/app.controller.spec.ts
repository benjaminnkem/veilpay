import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

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
    it('should return the API greeting', () => {
      expect(appController.getHello()).toBe('VeilPay API is running');
    });
  });

  describe('health', () => {
    it('should return ok', () => {
      expect(appController.getHealth()).toEqual({
        status: 'ok',
        service: 'api',
      });
    });
  });
});
