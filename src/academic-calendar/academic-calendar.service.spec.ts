import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AcademicCalendarService } from './academic-calendar.service';
import {
  AcademicCalendarEvent,
  AcademicCalendarCategory,
  TargetAudience,
} from './entities/academic-calendar-event.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Class } from '../classes/entities/class.entity';

describe('AcademicCalendarService', () => {
  let service: AcademicCalendarService;

  const mockCalendarRepo = {
    create: jest.fn((dto) => dto),
    save: jest.fn((entity) =>
      Array.isArray(entity)
        ? Promise.resolve(
            entity.map((e, idx) => ({ id: `event-uuid-${idx + 1}`, ...e })),
          )
        : Promise.resolve({ id: 'event-uuid-1', ...entity }),
    ),
    findOne: jest.fn(),
    softRemove: jest.fn().mockResolvedValue(true),
    createQueryBuilder: jest.fn(),
  };

  const mockUserRepo = {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
  };

  const mockClassRepo = {
    find: jest.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcademicCalendarService,
        {
          provide: getRepositoryToken(AcademicCalendarEvent),
          useValue: mockCalendarRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: getRepositoryToken(Class),
          useValue: mockClassRepo,
        },
      ],
    }).compile();

    service = module.get<AcademicCalendarService>(AcademicCalendarService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create an academic calendar event', async () => {
      const dto = {
        title: 'Summer Vacation',
        startDate: '2026-06-01',
        endDate: '2026-06-15',
        category: AcademicCalendarCategory.VACATION,
        isHoliday: true,
      };

      const result = await service.create(dto, 'school-uuid-1', 'admin-uuid-1');

      expect(mockCalendarRepo.create).toHaveBeenCalled();
      expect(mockCalendarRepo.save).toHaveBeenCalled();
      expect(result.title).toBe('Summer Vacation');
      expect(result.schoolId).toBe('school-uuid-1');
      expect(result.isHoliday).toBe(true);
    });

    it('should throw BadRequestException if endDate is before startDate', async () => {
      const dto = {
        title: 'Invalid Event',
        startDate: '2026-06-15',
        endDate: '2026-06-01',
      };

      await expect(
        service.create(dto, 'school-uuid-1', 'admin-uuid-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if schoolId is missing', async () => {
      const dto = {
        title: 'No School Event',
        startDate: '2026-06-01',
      };

      await expect(service.create(dto, '', 'admin-uuid-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('bulkCreate', () => {
    it('should bulk create multiple academic calendar events', async () => {
      const dto = {
        events: [
          {
            title: 'Independence Day',
            startDate: '2026-03-26',
            category: AcademicCalendarCategory.HOLIDAY,
            isHoliday: true,
          },
          {
            title: 'First Term Exam',
            startDate: '2026-04-10',
            endDate: '2026-04-20',
            category: AcademicCalendarCategory.EXAM,
          },
        ],
      };

      const result = await service.bulkCreate(dto, 'school-uuid-1', 'admin-uuid-1');

      expect(mockCalendarRepo.save).toHaveBeenCalled();
      expect(result.count).toBe(2);
      expect(result.events.length).toBe(2);
    });
  });

  describe('findOne', () => {
    it('should return the enriched event if found', async () => {
      const mockEvent = {
        id: 'event-uuid-1',
        schoolId: 'school-uuid-1',
        title: 'Sports Day',
        category: AcademicCalendarCategory.SPORTS,
        startDate: new Date('2026-11-01'),
        endDate: new Date('2026-11-01'),
        isAllDay: true,
        isHoliday: false,
        targetAudience: TargetAudience.ALL,
        isActive: true,
      };

      mockCalendarRepo.findOne.mockResolvedValue(mockEvent);

      const user = { schoolId: 'school-uuid-1', role: UserRole.STUDENT };
      const result = await service.findOne('event-uuid-1', user);

      expect(result.id).toBe('event-uuid-1');
      expect(result.title).toBe('Sports Day');
    });

    it('should throw NotFoundException if event not found', async () => {
      mockCalendarRepo.findOne.mockResolvedValue(null);

      const user = { schoolId: 'school-uuid-1', role: UserRole.STUDENT };
      await expect(service.findOne('non-existent', user)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should soft delete the event', async () => {
      const mockEvent = {
        id: 'event-uuid-1',
        schoolId: 'school-uuid-1',
      };
      mockCalendarRepo.findOne.mockResolvedValue(mockEvent);

      const user = { schoolId: 'school-uuid-1', role: UserRole.ADMIN };
      const result = await service.remove('event-uuid-1', user);

      expect(mockCalendarRepo.softRemove).toHaveBeenCalledWith(mockEvent);
      expect(result.message).toContain('successfully deleted');
    });
  });

  describe('getSummary', () => {
    it('should return calendar summary metrics', async () => {
      const mockQb = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          {
            id: '1',
            category: AcademicCalendarCategory.HOLIDAY,
            isHoliday: true,
            endDate: new Date('2026-12-31'),
          },
          {
            id: '2',
            category: AcademicCalendarCategory.EXAM,
            isHoliday: false,
            endDate: new Date('2026-12-31'),
          },
          {
            id: '3',
            category: AcademicCalendarCategory.EVENT,
            isHoliday: false,
            endDate: new Date('2026-12-31'),
          },
        ]),
      };
      mockCalendarRepo.createQueryBuilder.mockReturnValue(mockQb);

      const summary = await service.getSummary('school-uuid-1');

      expect(summary.totalEvents).toBe(3);
      expect(summary.totalHolidays).toBe(1);
      expect(summary.totalExams).toBe(1);
    });
  });
});
