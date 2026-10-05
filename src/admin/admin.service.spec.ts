import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { School } from '../schools/entities/school.entity';
import { UsersService } from '../users/users.service';
import { ClassesService } from '../classes/classes.service';
import { SubjectsService } from '../subjects/subjects.service';
import { ExamsService } from '../exams/exams.service';
import { MarksService } from '../marks/marks.service';
import { HomeworkService } from '../homework/homework.service';
import { SubscriptionService } from '../subscriptions/subscription.service';

describe('AdminService', () => {
  let service: AdminService;
  let subscriptionService: SubscriptionService;

  const mockSubscriptionService = {
    getSchoolSubscriptionHistory: jest.fn(),
  };

  const mockSchoolRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: getRepositoryToken(School), useValue: mockSchoolRepository },
        { provide: UsersService, useValue: {} },
        { provide: ClassesService, useValue: {} },
        { provide: SubjectsService, useValue: {} },
        { provide: ExamsService, useValue: {} },
        { provide: MarksService, useValue: {} },
        { provide: HomeworkService, useValue: {} },
        { provide: SubscriptionService, useValue: mockSubscriptionService },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    subscriptionService = module.get<SubscriptionService>(SubscriptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSchoolSubscriptionHistory', () => {
    it('should delegate to subscriptionService.getSchoolSubscriptionHistory', async () => {
      const mockResult = {
        schoolId: 'SCH-001',
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
        activeSubscription: null,
        subscriptions: [],
        data: [],
      };
      mockSubscriptionService.getSchoolSubscriptionHistory.mockResolvedValue(
        mockResult,
      );

      const result = await service.getSchoolSubscriptionHistory('SCH-001', {
        page: 1,
        limit: 10,
      });

      expect(result).toEqual(mockResult);
      expect(
        mockSubscriptionService.getSchoolSubscriptionHistory,
      ).toHaveBeenCalledWith('SCH-001', { page: 1, limit: 10 });
    });
  });
});
