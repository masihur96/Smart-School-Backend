import { Test, TestingModule } from '@nestjs/testing';
import { AcademicCalendarController } from './academic-calendar.controller';
import { AcademicCalendarService } from './academic-calendar.service';
import { UserRole } from '../users/entities/user.entity';
import {
  AcademicCalendarCategory,
  TargetAudience,
} from './entities/academic-calendar-event.entity';

describe('AcademicCalendarController', () => {
  let controller: AcademicCalendarController;
  let service: AcademicCalendarService;

  const mockCalendarService = {
    create: jest.fn(),
    bulkCreate: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getUpcomingEvents: jest.fn(),
    getHolidays: jest.fn(),
    getSummary: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AcademicCalendarController],
      providers: [
        {
          provide: AcademicCalendarService,
          useValue: mockCalendarService,
        },
      ],
    }).compile();

    controller = module.get<AcademicCalendarController>(
      AcademicCalendarController,
    );
    service = module.get<AcademicCalendarService>(AcademicCalendarService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Admin Endpoints', () => {
    const adminUser = {
      id: 'admin-1',
      role: UserRole.ADMIN,
      schoolId: 'school-1',
    };

    it('create should call service.create with user schoolId', async () => {
      const dto = {
        title: 'Sports Day',
        startDate: '2026-11-20',
        category: AcademicCalendarCategory.SPORTS,
      };

      mockCalendarService.create.mockResolvedValue({ id: 'e1', ...dto });

      const result = await controller.create(dto, adminUser);
      expect(service.create).toHaveBeenCalledWith(dto, 'school-1', 'admin-1');
      expect(result.id).toBe('e1');
    });

    it('bulkCreate should call service.bulkCreate', async () => {
      const dto = {
        events: [
          { title: 'Holiday 1', startDate: '2026-01-01' },
          { title: 'Holiday 2', startDate: '2026-02-21' },
        ],
      };

      mockCalendarService.bulkCreate.mockResolvedValue({ count: 2 });

      const result = await controller.bulkCreate(dto, adminUser);
      expect(service.bulkCreate).toHaveBeenCalledWith(
        dto,
        'school-1',
        'admin-1',
      );
      expect(result.count).toBe(2);
    });

    it('getSummary should call service.getSummary', async () => {
      mockCalendarService.getSummary.mockResolvedValue({ totalEvents: 10 });
      const result = await controller.getSummary(adminUser);
      expect(service.getSummary).toHaveBeenCalledWith(
        'school-1',
        undefined,
        undefined,
      );
      expect(result.totalEvents).toBe(10);
    });
  });

  describe('Teacher Endpoints', () => {
    const teacherUser = {
      id: 'teacher-1',
      role: UserRole.TEACHER,
      schoolId: 'school-1',
    };

    it('findAllForTeacher should call service.findAll with teacher user', async () => {
      mockCalendarService.findAll.mockResolvedValue([]);
      const filters = {};
      const result = await controller.findAllForTeacher(filters, teacherUser);
      expect(service.findAll).toHaveBeenCalledWith(filters, teacherUser);
      expect(result).toEqual([]);
    });

    it('getTeacherUpcoming should call service.getUpcomingEvents', async () => {
      mockCalendarService.getUpcomingEvents.mockResolvedValue([]);
      const result = await controller.getTeacherUpcoming(teacherUser, 5);
      expect(service.getUpcomingEvents).toHaveBeenCalledWith(teacherUser, 5);
      expect(result).toEqual([]);
    });
  });

  describe('Student Endpoints', () => {
    const studentUser = {
      id: 'student-1',
      role: UserRole.STUDENT,
      schoolId: 'school-1',
      classIds: ['class-1'],
    };

    it('findAllForStudent should call service.findAll with student user', async () => {
      mockCalendarService.findAll.mockResolvedValue([]);
      const filters = {};
      const result = await controller.findAllForStudent(filters, studentUser);
      expect(service.findAll).toHaveBeenCalledWith(filters, studentUser);
      expect(result).toEqual([]);
    });

    it('getStudentUpcoming should call service.getUpcomingEvents', async () => {
      mockCalendarService.getUpcomingEvents.mockResolvedValue([]);
      const result = await controller.getStudentUpcoming(studentUser);
      expect(service.getUpcomingEvents).toHaveBeenCalledWith(studentUser, 10);
      expect(result).toEqual([]);
    });
  });

  describe('Universal / Shared Endpoints', () => {
    const user = {
      id: 'any-user',
      role: UserRole.STUDENT,
      schoolId: 'school-1',
    };

    it('getHolidays should call service.getHolidays', async () => {
      mockCalendarService.getHolidays.mockResolvedValue([]);
      const result = await controller.getHolidays(user, 2026);
      expect(service.getHolidays).toHaveBeenCalledWith(
        user,
        2026,
        undefined,
      );
      expect(result).toEqual([]);
    });

    it('findOne should return single event', async () => {
      mockCalendarService.findOne.mockResolvedValue({ id: 'e1' });
      const result = await controller.findOne('e1', user);
      expect(service.findOne).toHaveBeenCalledWith('e1', user);
      expect(result.id).toBe('e1');
    });

    it('remove should delete event', async () => {
      mockCalendarService.remove.mockResolvedValue({ message: 'Deleted' });
      const admin = { id: 'admin-1', role: UserRole.ADMIN, schoolId: 'school-1' };
      const result = await controller.remove('e1', admin);
      expect(service.remove).toHaveBeenCalledWith('e1', admin);
      expect(result.message).toBe('Deleted');
    });
  });
});
