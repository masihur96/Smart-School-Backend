import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SubscriptionService } from './subscription.service';
import { Subscription } from './entities/subscription.entity';
import { School } from '../schools/entities/school.entity';
import { PricingService } from '../pricing/pricing.service';
import { UsersService } from '../users/users.service';

describe('SubscriptionService', () => {
  let service: SubscriptionService;

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    getRawOne: jest.fn(),
  };

  const mockSubscriptionRepository = {
    createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    softRemove: jest.fn(),
    restore: jest.fn(),
  };

  const mockSchoolRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockSubscriptionRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        {
          provide: getRepositoryToken(Subscription),
          useValue: mockSubscriptionRepository,
        },
        {
          provide: getRepositoryToken(School),
          useValue: mockSchoolRepository,
        },
        { provide: PricingService, useValue: {} },
        { provide: UsersService, useValue: {} },
      ],
    }).compile();

    service = module.get<SubscriptionService>(SubscriptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSchoolSubscriptionHistory', () => {
    it('should return paginated history with active subscription and calculated status', async () => {
      const mockSubscriptions: Partial<Subscription>[] = [
        {
          id: 'sub-1',
          schoolId: 'SCH-001',
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-12-31'),
          isActive: true,
          amount: 500,
          pricingPlan: {
            id: 'plan-1',
            name: 'Standard Plan',
          } as any,
        },
        {
          id: 'sub-2',
          schoolId: 'SCH-001',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
          isActive: false,
          amount: 400,
          pricingPlan: {
            id: 'plan-2',
            name: 'Basic Plan',
          } as any,
        },
      ];

      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockSubscriptions, 2]);
      mockQueryBuilder.getRawOne.mockResolvedValue({ total: '900' });
      mockSubscriptionRepository.findOne.mockResolvedValue(mockSubscriptions[0]);
      mockSchoolRepository.findOne.mockResolvedValue({
        schoolId: 'SCH-001',
        name: 'School One',
      });

      const result = await service.getSchoolSubscriptionHistory('SCH-001', {
        page: 1,
        limit: 10,
      });

      expect(result.schoolId).toBe('SCH-001');
      expect(result.school?.name).toBe('School One');
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
      expect(result.activeSubscription?.id).toBe('sub-1');
      expect(result.summary.totalAmountPaid).toBe(900);
      expect(result.summary.hasActiveSubscription).toBe(true);
      expect(result.subscriptions).toHaveLength(2);
      expect(result.subscriptions[0].status).toBeDefined();
      expect(result.data).toBe(result.subscriptions);
    });

    it('should apply search, isActive, and custom sorting', async () => {
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
      mockQueryBuilder.getRawOne.mockResolvedValue({ total: '0' });

      await service.getSchoolSubscriptionHistory('SCH-001', {
        search: 'premium',
        isActive: true,
        sortBy: 'amount',
        sortOrder: 'ASC',
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'sub.isActive = :isActive',
        { isActive: true },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(pricingPlan.name ILIKE :search OR sub.transactionId ILIKE :search OR sub.paymentMethod ILIKE :search OR sub.schoolId ILIKE :search)',
        { search: '%premium%' },
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('sub.amount', 'ASC');
    });
  });
});
