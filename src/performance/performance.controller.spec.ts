import { Test, TestingModule } from '@nestjs/testing';
import { PerformanceController } from './performance.controller';
import { PerformanceService } from './performance.service';
import { UserRole } from '../users/entities/user.entity';
import { UnauthorizedException } from '@nestjs/common';

describe('PerformanceController', () => {
  let controller: PerformanceController;
  let service: PerformanceService;

  const mockPerformanceService = {
    getStudentPerformance: jest.fn(),
    getAllStudentsPerformance: jest.fn(),
    getTeacherPerformance: jest.fn(),
    getAllTeachersPerformance: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PerformanceController],
      providers: [
        {
          provide: PerformanceService,
          useValue: mockPerformanceService,
        },
      ],
    }).compile();

    controller = module.get<PerformanceController>(PerformanceController);
    service = module.get<PerformanceService>(PerformanceService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getStudentPerformance', () => {
    it('should allow student to fetch own performance', async () => {
      const req = { user: { id: 'student-1', schoolId: 'school-1', role: UserRole.STUDENT } };
      mockPerformanceService.getStudentPerformance.mockResolvedValue({ studentId: 'student-1' });

      const result = await controller.getStudentPerformance(req, undefined, '8', '2026');
      expect(mockPerformanceService.getStudentPerformance).toHaveBeenCalledWith('student-1', 'school-1', '8', '2026');
      expect(result).toEqual({ studentId: 'student-1' });
    });

    it('should throw UnauthorizedException if student tries to view another student', async () => {
      const req = { user: { id: 'student-1', schoolId: 'school-1', role: UserRole.STUDENT } };
      await expect(
        controller.getStudentPerformance(req, 'student-2', '8', '2026'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should fetch all students performance for admin if studentId is not specified', async () => {
      const req = { user: { id: 'admin-1', schoolId: 'school-1', role: UserRole.ADMIN } };
      mockPerformanceService.getAllStudentsPerformance.mockResolvedValue([{ studentId: 'student-1' }]);

      const result = await controller.getStudentPerformance(req, undefined, '8', '2026');
      expect(mockPerformanceService.getAllStudentsPerformance).toHaveBeenCalledWith('school-1', '8', '2026');
      expect(result).toEqual([{ studentId: 'student-1' }]);
    });
  });

  describe('getTeacherPerformance', () => {
    it('should allow teacher to fetch own performance', async () => {
      const req = { user: { id: 'teacher-1', schoolId: 'school-1', role: UserRole.TEACHER } };
      mockPerformanceService.getTeacherPerformance.mockResolvedValue({ teacherId: 'teacher-1' });

      const result = await controller.getTeacherPerformance(req, undefined, '8', '2026');
      expect(mockPerformanceService.getTeacherPerformance).toHaveBeenCalledWith('teacher-1', 'school-1', '8', '2026');
      expect(result).toEqual({ teacherId: 'teacher-1' });
    });

    it('should fetch all teachers performance for admin if teacherId is not specified', async () => {
      const req = { user: { id: 'admin-1', schoolId: 'school-1', role: UserRole.ADMIN } };
      mockPerformanceService.getAllTeachersPerformance.mockResolvedValue([{ teacherId: 'teacher-1' }]);

      const result = await controller.getTeacherPerformance(req, undefined, '8', '2026');
      expect(mockPerformanceService.getAllTeachersPerformance).toHaveBeenCalledWith('school-1', '8', '2026');
      expect(result).toEqual([{ teacherId: 'teacher-1' }]);
    });
  });
});
