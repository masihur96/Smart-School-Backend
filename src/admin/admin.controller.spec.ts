import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AttendanceService } from '../attendance/attendance.service';
import { UserRole } from '../users/entities/user.entity';

describe('AdminController', () => {
  let controller: AdminController;
  let adminService: AdminService;

  const mockAdminService = {
    getSchoolSubscriptionHistory: jest.fn(),
  };

  const mockAttendanceService = {
    adminCreateTeacherAttendance: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        {
          provide: AdminService,
          useValue: mockAdminService,
        },
        {
          provide: AttendanceService,
          useValue: mockAttendanceService,
        },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
    adminService = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getSubscriptionHistory', () => {
    it('should return subscription history for admin school', async () => {
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
      mockAdminService.getSchoolSubscriptionHistory.mockResolvedValue(mockResult);

      const user = {
        id: 'user-uuid',
        userId: 'admin1',
        role: UserRole.ADMIN,
        schoolId: 'SCH-001',
      };

      const result = await controller.getSubscriptionHistory(user, {});
      expect(result).toEqual(mockResult);
      expect(mockAdminService.getSchoolSubscriptionHistory).toHaveBeenCalledWith(
        'SCH-001',
        {},
      );
    });

    it('should throw ForbiddenException if regular admin has no schoolId', async () => {
      const user = {
        id: 'user-uuid',
        userId: 'admin1',
        role: UserRole.ADMIN,
        schoolId: null,
      };

      await expect(controller.getSubscriptionHistory(user, {})).rejects.toThrow(
        'Admin must be associated with a school',
      );
    });

    it('should throw ForbiddenException if regular admin tries to access another school', async () => {
      const user = {
        id: 'user-uuid',
        userId: 'admin1',
        role: UserRole.ADMIN,
        schoolId: 'SCH-001',
      };

      await expect(
        controller.getSubscriptionHistory(user, { schoolId: 'SCH-999' }),
      ).rejects.toThrow(
        'You can only view subscription history for your own school',
      );
    });

    it('should allow SuperAdmin to specify a schoolId', async () => {
      const mockResult = {
        schoolId: 'SCH-999',
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 1,
        activeSubscription: null,
        subscriptions: [],
        data: [],
      };
      mockAdminService.getSchoolSubscriptionHistory.mockResolvedValue(mockResult);

      const user = {
        id: 'super-uuid',
        userId: 'super1',
        role: UserRole.SUPER_ADMIN,
        schoolId: null,
      };

      const result = await controller.getSubscriptionHistory(user, {
        schoolId: 'SCH-999',
      });
      expect(result).toEqual(mockResult);
      expect(mockAdminService.getSchoolSubscriptionHistory).toHaveBeenCalledWith(
        'SCH-999',
        { schoolId: 'SCH-999' },
      );
    });
  });
});
