import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExamsService } from './exams.service';
import { Exam } from './entities/exam.entity';
import { AcademicAssignment } from './entities/academic-assignment.entity';
import { Class } from '../classes/entities/class.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { User } from '../users/entities/user.entity';
import { MarksService } from '../marks/marks.service';

describe('ExamsService', () => {
  let service: ExamsService;
  let examRepo: any;
  let academicAssignmentRepo: any;
  let classRepo: any;
  let subjectRepo: any;
  let userRepo: any;
  let marksService: any;

  const createMockQB = (rawResult: any[] = [], manyResult: any[] = []) => {
    const qb: any = {
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue(rawResult),
      getMany: jest.fn().mockResolvedValue(manyResult),
    };
    return qb;
  };

  beforeEach(async () => {
    examRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    academicAssignmentRepo = {
      createQueryBuilder: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    classRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
    };
    subjectRepo = {
      findOne: jest.fn(),
    };
    userRepo = {
      findOne: jest.fn(),
    };
    marksService = {
      submitMarks: jest.fn(),
      getMarks: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamsService,
        { provide: getRepositoryToken(Exam), useValue: examRepo },
        {
          provide: getRepositoryToken(AcademicAssignment),
          useValue: academicAssignmentRepo,
        },
        { provide: getRepositoryToken(Class), useValue: classRepo },
        { provide: getRepositoryToken(Subject), useValue: subjectRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: MarksService, useValue: marksService },
      ],
    }).compile();

    service = module.get<ExamsService>(ExamsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllExams', () => {
    it('should return exams for a specific schoolId without loading all database assignments', async () => {
      classRepo.find.mockResolvedValue([{ id: 'class-1' }, { id: 'class-2' }]);

      academicAssignmentRepo.createQueryBuilder.mockReturnValue(
        createMockQB([{ examId: 'exam-1' }, { examId: 'exam-2' }]),
      );

      const mockExams = [
        {
          id: 'exam-1',
          exam_name: 'Midterm',
          assignments: [{ id: 'assign-1' }],
        },
        {
          id: 'exam-2',
          exam_name: 'Final',
          assignments: [{ id: 'assign-2' }],
        },
      ];

      examRepo.createQueryBuilder.mockReturnValue(
        createMockQB([], mockExams),
      );

      const result = await service.findAllExams('school-123');

      expect(classRepo.find).toHaveBeenCalledWith({
        where: { schoolId: 'school-123' },
        select: ['id'],
      });
      expect(result).toEqual(mockExams);
    });

    it('should return empty array if school has no classes', async () => {
      classRepo.find.mockResolvedValue([]);
      const result = await service.findAllExams('school-123');
      expect(result).toEqual([]);
    });

    it('should return empty array if school classes have no exam assignments', async () => {
      classRepo.find.mockResolvedValue([{ id: 'class-1' }]);
      academicAssignmentRepo.createQueryBuilder.mockReturnValue(
        createMockQB([]),
      );
      const result = await service.findAllExams('school-123');
      expect(result).toEqual([]);
    });

    it('should return all exams when no schoolId is provided (super admin)', async () => {
      const mockExams = [{ id: 'exam-1', assignments: [] }];
      examRepo.find.mockResolvedValue(mockExams);

      const result = await service.findAllExams();
      expect(examRepo.find).toHaveBeenCalledWith({
        relations: ['assignments'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(mockExams);
    });
  });
});
