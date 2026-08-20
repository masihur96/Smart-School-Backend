import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { PerformanceService } from './performance.service';
import { Attendance } from '../attendance/entities/attendance.entity';
import { TeacherAttendance } from '../attendance/entities/teacher-attendance.entity';
import { StudentHomework } from '../homework/entities/student-homework.entity';
import { Homework } from '../homework/entities/homework.entity';
import { Marks } from '../marks/entities/marks.entity';
import { User } from '../users/entities/user.entity';
import { Class } from '../classes/entities/class.entity';
import { Section } from '../sections/entities/section.entity';

describe('PerformanceService', () => {
  let service: PerformanceService;
  let attendanceRepo: any;
  let teacherAttendanceRepo: any;
  let studentHomeworkRepo: any;
  let homeworkRepo: any;
  let marksRepo: any;
  let userRepo: any;
  let classRepo: any;
  let sectionRepo: any;

  const createMockQB = (rawOneResult: any = {}, rawManyResult: any[] = []) => {
    const qb: any = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      setParameter: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue(rawOneResult),
      getRawMany: jest.fn().mockResolvedValue(rawManyResult),
    };
    return qb;
  };

  beforeEach(async () => {
    attendanceRepo = {
      createQueryBuilder: jest.fn(),
    };
    teacherAttendanceRepo = {
      createQueryBuilder: jest.fn(),
    };
    studentHomeworkRepo = {
      createQueryBuilder: jest.fn(),
    };
    homeworkRepo = {
      createQueryBuilder: jest.fn(),
    };
    marksRepo = {
      createQueryBuilder: jest.fn(),
    };
    userRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
    };
    classRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
    };
    sectionRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PerformanceService,
        { provide: getRepositoryToken(Attendance), useValue: attendanceRepo },
        {
          provide: getRepositoryToken(TeacherAttendance),
          useValue: teacherAttendanceRepo,
        },
        {
          provide: getRepositoryToken(StudentHomework),
          useValue: studentHomeworkRepo,
        },
        { provide: getRepositoryToken(Homework), useValue: homeworkRepo },
        { provide: getRepositoryToken(Marks), useValue: marksRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Class), useValue: classRepo },
        { provide: getRepositoryToken(Section), useValue: sectionRepo },
      ],
    }).compile();

    service = module.get<PerformanceService>(PerformanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStudentPerformance', () => {
    it('should throw NotFoundException if student does not exist', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(
        service.getStudentPerformance('student-1', 'school-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return calculated student performance', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 'student-1',
        name: 'John Doe',
        rollNumber: '101',
        classIds: ['class-1'],
        sectionIds: ['sec-1'],
      });

      attendanceRepo.createQueryBuilder.mockReturnValue(
        createMockQB({ totalWorkingDays: '20', presentDays: '18' }),
      );
      studentHomeworkRepo.createQueryBuilder.mockReturnValue(
        createMockQB({ totalAssigned: '10', totalDone: '8' }),
      );
      marksRepo.createQueryBuilder.mockReturnValue(
        createMockQB({ totalMarksObtained: '450', totalMaximumMarks: '500' }),
      );
      classRepo.findOne.mockResolvedValue({ id: 'class-1', name: 'Class 10' });
      sectionRepo.findOne.mockResolvedValue({ id: 'sec-1', name: 'Section A' });

      const result = await service.getStudentPerformance(
        'student-1',
        'school-1',
        '8',
        '2026',
      );

      expect(result).toEqual({
        studentId: 'student-1',
        name: 'John Doe',
        rollNumber: '101',
        class: { id: 'class-1', name: 'Class 10' },
        section: { id: 'sec-1', name: 'Section A' },
        attendance: {
          totalWorkingDays: 20,
          presentDays: 18,
          percentage: 90,
        },
        homework: {
          totalAssigned: 10,
          totalDone: 8,
          percentage: 80,
        },
        exams: {
          totalMarksObtained: 450,
          totalMaximumMarks: 500,
          percentage: 90,
        },
      });
    });
  });

  describe('getAllStudentsPerformance', () => {
    it('should return empty array if no students found', async () => {
      userRepo.find.mockResolvedValue([]);
      const result = await service.getAllStudentsPerformance('school-1');
      expect(result).toEqual([]);
    });

    it('should batch calculate performance for all students in school', async () => {
      userRepo.find.mockResolvedValue([
        {
          id: 'student-1',
          name: 'John Doe',
          rollNumber: '101',
          classIds: ['class-1'],
          sectionIds: ['sec-1'],
        },
        {
          id: 'student-2',
          name: 'Jane Smith',
          rollNumber: '102',
          classIds: ['class-1'],
          sectionIds: [],
        },
      ]);

      classRepo.find.mockResolvedValue([{ id: 'class-1', name: 'Class 10' }]);
      sectionRepo.find.mockResolvedValue([{ id: 'sec-1', name: 'Section A' }]);

      attendanceRepo.createQueryBuilder.mockReturnValue(
        createMockQB({}, [
          { studentId: 'student-1', totalWorkingDays: '20', presentDays: '15' },
          { studentId: 'student-2', totalWorkingDays: '20', presentDays: '20' },
        ]),
      );

      studentHomeworkRepo.createQueryBuilder.mockReturnValue(
        createMockQB({}, [
          { studentId: 'student-1', totalAssigned: '5', totalDone: '4' },
          { studentId: 'student-2', totalAssigned: '5', totalDone: '5' },
        ]),
      );

      marksRepo.createQueryBuilder.mockReturnValue(
        createMockQB({}, [
          {
            studentId: 'student-1',
            totalMarksObtained: '80',
            totalMaximumMarks: '100',
          },
          {
            studentId: 'student-2',
            totalMarksObtained: '95',
            totalMaximumMarks: '100',
          },
        ]),
      );

      const result = await service.getAllStudentsPerformance(
        'school-1',
        '8',
        '2026',
      );

      expect(result).toHaveLength(2);
      expect(result[0].studentId).toBe('student-1');
      expect(result[0].attendance.percentage).toBe(75);
      expect(result[0].homework.percentage).toBe(80);
      expect(result[0].exams.percentage).toBe(80);
      expect(result[0].class?.name).toBe('Class 10');
      expect(result[0].section?.name).toBe('Section A');

      expect(result[1].studentId).toBe('student-2');
      expect(result[1].attendance.percentage).toBe(100);
      expect(result[1].homework.percentage).toBe(100);
      expect(result[1].exams.percentage).toBe(95);
      expect(result[1].section).toBeNull();
    });
  });

  describe('getTeacherPerformance', () => {
    it('should throw NotFoundException if teacher does not exist', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(
        service.getTeacherPerformance('teacher-1', 'school-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return teacher performance', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 'teacher-1',
        name: 'Mr. Smith',
        designation: 'Math Teacher',
      });

      teacherAttendanceRepo.createQueryBuilder
        .mockReturnValueOnce(createMockQB({ count: '18' }))
        .mockReturnValueOnce(createMockQB({ count: '20' }));

      homeworkRepo.createQueryBuilder.mockReturnValue(
        createMockQB({ count: '8' }),
      );

      const result = await service.getTeacherPerformance(
        'teacher-1',
        'school-1',
        '8',
        '2026',
      );

      expect(result).toEqual({
        teacherId: 'teacher-1',
        name: 'Mr. Smith',
        designation: 'Math Teacher',
        attendance: {
          totalWorkingDays: 20,
          presentDays: 18,
          percentage: 90,
        },
        homework: {
          totalProvided: 8,
          target: 10,
          percentage: 80,
        },
      });
    });
  });

  describe('getAllTeachersPerformance', () => {
    it('should return empty array if no teachers found', async () => {
      userRepo.find.mockResolvedValue([]);
      const result = await service.getAllTeachersPerformance('school-1');
      expect(result).toEqual([]);
    });

    it('should batch calculate performance for all teachers in school', async () => {
      userRepo.find.mockResolvedValue([
        { id: 'teacher-1', name: 'Mr. Smith', designation: 'Math Teacher' },
        { id: 'teacher-2', name: 'Mrs. Davis', designation: 'English Teacher' },
      ]);

      teacherAttendanceRepo.createQueryBuilder
        .mockReturnValueOnce(createMockQB({ count: '22' }))
        .mockReturnValueOnce(
          createMockQB({}, [
            { teacherId: 'teacher-1', presentDays: '20' },
            { teacherId: 'teacher-2', presentDays: '22' },
          ]),
        );

      homeworkRepo.createQueryBuilder.mockReturnValue(
        createMockQB({}, [
          { teacherId: 'teacher-1', totalProvided: '10' },
          { teacherId: 'teacher-2', totalProvided: '12' },
        ]),
      );

      const result = await service.getAllTeachersPerformance('school-1');

      expect(result).toHaveLength(2);
      expect(result[0].teacherId).toBe('teacher-1');
      expect(result[0].attendance.percentage).toBe(90.91);
      expect(result[0].homework.percentage).toBe(100);

      expect(result[1].teacherId).toBe('teacher-2');
      expect(result[1].attendance.percentage).toBe(100);
      expect(result[1].homework.percentage).toBe(100);
    });
  });
});
