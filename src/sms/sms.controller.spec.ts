import { Test, TestingModule } from '@nestjs/testing';
import { SmsController } from './sms.controller';
import { SmsService } from './sms.service';

describe('SmsController', () => {
  let controller: SmsController;

  const mockSmsService = {
    sendBulkSms: jest.fn(),
    sendTargetedBulkSms: jest.fn(),
    checkBalance: jest.fn(),
    getSenders: jest.fn(),
    getBatchReport: jest.fn(),
    getLogs: jest.fn(),
    getLogById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SmsController],
      providers: [
        {
          provide: SmsService,
          useValue: mockSmsService,
        },
      ],
    }).compile();

    controller = module.get<SmsController>(SmsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
