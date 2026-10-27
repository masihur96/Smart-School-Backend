import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { SmsService } from './sms.service';
import { SmsLog } from './entities/sms-log.entity';
import { User } from '../users/entities/user.entity';

describe('SmsService', () => {
  let service: SmsService;

  const mockSmsLogRepository = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn().mockImplementation((log) => Promise.resolve({ id: 'test-log-id', ...log })),
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockUserRepository = {
    createQueryBuilder: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultVal?: string) => {
      if (key === 'SMS_GATEWAY_URL') return 'https://sms-api-proxy.masihur96.workers.dev';
      if (key === 'SMS_DIRECT_URL') return 'https://sms.whiteinfobd.com';
      if (key === 'SMS_API_KEY') return 'r74NjxN9j7QblXNtGMU9FoNoNLtR9yUT2jso3OKV9699ff42';
      if (key === 'SMS_DEFAULT_SENDER_ID') return '8809639228910';
      return defaultVal;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: getRepositoryToken(SmsLog),
          useValue: mockSmsLogRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<SmsService>(SmsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('normalizePhoneNumber', () => {
    it('normalizes 11-digit Bangladeshi mobile number', () => {
      expect(service.normalizePhoneNumber('01713252758')).toBe('01713252758');
    });

    it('normalizes 13-digit Bangladeshi number with 88 prefix', () => {
      expect(service.normalizePhoneNumber('8801713252758')).toBe('01713252758');
    });

    it('normalizes +880 format with dashes and spaces', () => {
      expect(service.normalizePhoneNumber('+880 1713-252758')).toBe('01713252758');
    });

    it('returns null for invalid numbers', () => {
      expect(service.normalizePhoneNumber('12345')).toBeNull();
      expect(service.normalizePhoneNumber('01234567890')).toBeNull();
    });
  });

  describe('sanitizeNumberList', () => {
    it('deduplicates and cleans valid numbers', () => {
      const input = ['01713252758', '+8801713252758', '01812345678, 01987654321', 'invalid'];
      const res = service.sanitizeNumberList(input);
      expect(res).toEqual(['01713252758', '01812345678', '01987654321']);
    });
  });
});
