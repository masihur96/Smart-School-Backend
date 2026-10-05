import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from './entities/user.entity';
import { School } from '../schools/entities/school.entity';
import { ClassesService } from '../classes/classes.service';
import { SectionsService } from '../sections/sections.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            createQueryBuilder: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(School),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: ClassesService,
          useValue: {
            findById: jest.fn(),
            findAll: jest.fn(),
          },
        },
        {
          provide: SectionsService,
          useValue: {
            findOne: jest.fn(),
            findAll: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return students with class and section data enriched', async () => {
    const mockClassId = 'ebe68f77-62c8-40b5-b9bc-0a10bf3a16e1';
    const mockSectionId = '11a86f9d-1c92-4286-a97d-62b16a9df703';

    const mockClass = {
      id: mockClassId,
      name: 'Class 10',
    };

    const mockSection = {
      id: mockSectionId,
      name: 'Section A',
      classId: mockClassId,
    };

    const mockUser: Partial<User> = {
      id: 'f0465b20-eddc-443a-8940-173ecd2bb840',
      name: 'Rahat Hossen',
      email: 'rahat2@gmail.com',
      role: UserRole.STUDENT,
      schoolId: '29f05edb-8e0b-434c-a471-aa776308a1c1',
      classIds: ['02982e06-6667-48cd-8209-a56965a93301', mockClassId],
      sectionIds: ['3dc6243d-86b0-479d-9528-689499f7730b', mockSectionId],
      phone: '01329291947',
      rollNumber: '08',
      isActive: true,
    };

    const qb: any = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([mockUser]),
    };

    const userRepo = moduleRef.get(getRepositoryToken(User));
    jest.spyOn(userRepo, 'createQueryBuilder').mockReturnValue(qb);

    const classesService = moduleRef.get(ClassesService);
    jest.spyOn(classesService, 'findById').mockImplementation(async (id: string) => {
      if (id === mockClassId) return mockClass as any;
      return { id, name: 'Other Class' } as any;
    });

    const sectionsService = moduleRef.get(SectionsService);
    jest.spyOn(sectionsService, 'findOne').mockImplementation(async (id: string) => {
      if (id === mockSectionId) return mockSection as any;
      return { id, name: 'Other Section', classId: '02982e06-6667-48cd-8209-a56965a93301' } as any;
    });

    const result = await service.findStudentsByClass(mockClassId);

    expect(result).toHaveLength(1);
    const student = result[0];

    // Top-level fields
    expect(student.userId).toBe(mockUser.id);
    expect(student.rollId).toBe(mockUser.rollNumber);
    expect(student.classId).toBe(mockClassId);
    expect(student.sectionId).toBe(mockSectionId);
    expect(student.guardianContact).toBe(mockUser.phone);
    expect(student.class).toEqual(mockClass);
    expect(student.section).toEqual(mockSection);

    // Inside user object
    expect(student.user.class).toEqual(mockClass);
    expect(student.user.section).toEqual(mockSection);
    expect(student.user.classes).toHaveLength(2);
    expect(student.user.sections).toHaveLength(2);
  });
});
