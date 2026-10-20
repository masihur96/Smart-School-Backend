import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { RequestComplaintsService } from './request-complaints.service';
import {
  RequestComplaint,
  RequestComplaintType,
  RequestComplaintStatus,
  RequestComplaintPriority,
  RequestComplaintCategory,
} from './entities/request-complaint.entity';
import { RequestComplaintComment } from './entities/request-complaint-comment.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Routine } from '../general/entities/routine.entity';
import { Class } from '../classes/entities/class.entity';
import { NotificationsService } from '../notifications/notifications.service';

describe('RequestComplaintsService', () => {
  let service: RequestComplaintsService;

  const mockSchoolId = '11111111-1111-1111-1111-111111111111';
  const mockClassId1 = 'class-1-uuid';
  const mockClassId2 = 'class-2-uuid';

  const mockStudentUser: Partial<User> = {
    id: 'student-uuid',
    name: 'Alice Student',
    email: 'alice@school.com',
    role: UserRole.STUDENT,
    schoolId: mockSchoolId,
    classIds: [mockClassId1],
    isActive: true,
  };

  const mockClassTeacherUser: Partial<User> = {
    id: 'class-teacher-uuid',
    name: 'Mr. Smith (Class Teacher)',
    email: 'smith@school.com',
    role: UserRole.TEACHER,
    schoolId: mockSchoolId,
    classIds: [mockClassId1],
    isActive: true,
  };

  const mockRoutineTeacherUser: Partial<User> = {
    id: 'routine-teacher-uuid',
    name: 'Mrs. Davis (Routine Teacher)',
    email: 'davis@school.com',
    role: UserRole.TEACHER,
    schoolId: mockSchoolId,
    classIds: [], // Not directly in classIds, but teaches class in routine
    isActive: true,
  };

  const mockOtherTeacherUser: Partial<User> = {
    id: 'other-teacher-uuid',
    name: 'Mr. Unrelated',
    email: 'unrelated@school.com',
    role: UserRole.TEACHER,
    schoolId: mockSchoolId,
    classIds: [mockClassId2],
    isActive: true,
  };

  const mockAdminUser: Partial<User> = {
    id: 'admin-uuid',
    name: 'Principal Skinner',
    email: 'admin@school.com',
    role: UserRole.ADMIN,
    schoolId: mockSchoolId,
    isActive: true,
  };

  const mockOtherStudentUser: Partial<User> = {
    id: 'other-student-uuid',
    name: 'Bob Student',
    email: 'bob@school.com',
    role: UserRole.STUDENT,
    schoolId: mockSchoolId,
    classIds: [mockClassId1],
    isActive: true,
  };

  let mockRequestComplaintRepo: any;
  let mockCommentRepo: any;
  let mockUserRepo: any;
  let mockRoutineRepo: any;
  let mockClassRepo: any;
  let mockNotificationsService: any;

  beforeEach(async () => {
    mockRequestComplaintRepo = {
      create: jest.fn().mockImplementation((dto) => ({
        id: 'new-rc-uuid',
        ...dto,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      save: jest.fn().mockImplementation(async (item) => ({
        id: item.id || 'new-rc-uuid',
        ...item,
      })),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
      softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    mockCommentRepo = {
      create: jest.fn().mockImplementation((dto) => ({
        id: 'new-comment-uuid',
        ...dto,
        createdAt: new Date(),
      })),
      save: jest.fn().mockImplementation(async (c) => ({
        id: c.id || 'new-comment-uuid',
        ...c,
      })),
      findOne: jest.fn().mockImplementation(async (opts) => ({
        id: opts.where.id,
        sender: mockStudentUser,
        message: 'Test message',
      })),
    };

    mockUserRepo = {
      findOne: jest.fn().mockImplementation(async ({ where }) => {
        if (where.id === mockStudentUser.id) return { ...mockStudentUser };
        if (where.id === mockClassTeacherUser.id) return { ...mockClassTeacherUser };
        if (where.id === mockRoutineTeacherUser.id) return { ...mockRoutineTeacherUser };
        if (where.id === mockOtherTeacherUser.id) return { ...mockOtherTeacherUser };
        if (where.id === mockAdminUser.id) return { ...mockAdminUser };
        if (where.id === mockOtherStudentUser.id) return { ...mockOtherStudentUser };
        return null;
      }),
      find: jest.fn().mockResolvedValue([mockAdminUser]),
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockAdminUser]),
      }),
    };

    mockRoutineRepo = {
      count: jest.fn().mockImplementation(async ({ where }) => {
        // Routine teacher teaches mockClassId1
        if (
          where.teacherId === mockRoutineTeacherUser.id &&
          where.classId?._value?.includes(mockClassId1)
        ) {
          return 1;
        }
        return 0;
      }),
      find: jest.fn().mockResolvedValue([]),
    };

    mockClassRepo = {
      find: jest.fn().mockResolvedValue([]),
    };

    mockNotificationsService = {
      sendToUser: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RequestComplaintsService,
        {
          provide: getRepositoryToken(RequestComplaint),
          useValue: mockRequestComplaintRepo,
        },
        {
          provide: getRepositoryToken(RequestComplaintComment),
          useValue: mockCommentRepo,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo,
        },
        {
          provide: getRepositoryToken(Routine),
          useValue: mockRoutineRepo,
        },
        {
          provide: getRepositoryToken(Class),
          useValue: mockClassRepo,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get<RequestComplaintsService>(RequestComplaintsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ═════════════════════════════════════════════════════════════════════════
  // RULE 1: STUDENT ROUTING
  // ═════════════════════════════════════════════════════════════════════════

  describe('Rule 1: Student Permissions', () => {
    it('allows student to submit to Admin', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 'new-rc-uuid',
        title: 'Need Certificate',
        senderId: mockStudentUser.id,
        recipientId: mockAdminUser.id,
      } as any);

      const result = await service.create(
        {
          type: RequestComplaintType.REQUEST,
          title: 'Need Certificate',
          description: 'Please issue student certificate',
          recipientId: mockAdminUser.id,
        },
        mockStudentUser,
      );

      expect(result).toBeDefined();
      expect(mockRequestComplaintRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          senderId: mockStudentUser.id,
          recipientId: mockAdminUser.id,
          type: RequestComplaintType.REQUEST,
        }),
      );
    });

    it('allows student to submit to her direct class teacher (via classIds)', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 'new-rc-uuid',
        title: 'Math homework clarification',
        senderId: mockStudentUser.id,
        recipientId: mockClassTeacherUser.id,
      } as any);

      const result = await service.create(
        {
          type: RequestComplaintType.REQUEST,
          title: 'Math homework clarification',
          description: 'Could you please explain problem 4?',
          recipientId: mockClassTeacherUser.id,
        },
        mockStudentUser,
      );

      expect(result).toBeDefined();
      expect(mockRequestComplaintRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientId: mockClassTeacherUser.id,
          targetRole: UserRole.TEACHER,
        }),
      );
    });

    it('allows student to submit to her routine class teacher (via Routine)', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 'new-rc-uuid',
        title: 'Routine teacher question',
        senderId: mockStudentUser.id,
        recipientId: mockRoutineTeacherUser.id,
      } as any);

      const result = await service.create(
        {
          type: RequestComplaintType.REQUEST,
          title: 'Routine teacher question',
          description: 'Question about science class',
          recipientId: mockRoutineTeacherUser.id,
        },
        mockStudentUser,
      );

      expect(result).toBeDefined();
    });

    it('FORBIDS student from submitting to an unrelated teacher who does not teach her class', async () => {
      await expect(
        service.create(
          {
            type: RequestComplaintType.REQUEST,
            title: 'Unauthorized request',
            description: 'Trying to contact unrelated teacher',
            recipientId: mockOtherTeacherUser.id,
          },
          mockStudentUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('FORBIDS student from submitting to another student', async () => {
      await expect(
        service.create(
          {
            type: RequestComplaintType.COMPLAINT,
            title: 'Complaint against student',
            description: 'Direct complaint to peer',
            recipientId: mockOtherStudentUser.id,
          },
          mockStudentUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows student to submit without recipientId (routes to school admin queue)', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 'new-rc-uuid',
        title: 'General school maintenance',
        senderId: mockStudentUser.id,
        recipientId: null,
      } as any);

      const result = await service.create(
        {
          type: RequestComplaintType.COMPLAINT,
          title: 'General school maintenance',
          description: 'Water dispenser is broken on 2nd floor',
        },
        mockStudentUser,
      );

      expect(result).toBeDefined();
      expect(mockRequestComplaintRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientId: null,
          targetRole: UserRole.ADMIN,
        }),
      );
    });
  });

  // ═════════════════════════════════════════════════════════════════════════
  // RULE 2: TEACHER ROUTING
  // ═════════════════════════════════════════════════════════════════════════

  describe('Rule 2: Teacher Permissions', () => {
    it('allows teacher to submit to Admin', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 'new-rc-uuid',
        title: 'Projector repair request',
        senderId: mockClassTeacherUser.id,
        recipientId: mockAdminUser.id,
      } as any);

      const result = await service.create(
        {
          type: RequestComplaintType.REQUEST,
          title: 'Projector repair request',
          description: 'HDMI port in Room 102 is malfunctioning',
          recipientId: mockAdminUser.id,
        },
        mockClassTeacherUser,
      );

      expect(result).toBeDefined();
      expect(mockRequestComplaintRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          senderId: mockClassTeacherUser.id,
          recipientId: mockAdminUser.id,
        }),
      );
    });

    it('allows teacher to submit without recipientId (routes to school admin queue)', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 'new-rc-uuid',
        title: 'Leave application',
        senderId: mockClassTeacherUser.id,
        recipientId: null,
      } as any);

      const result = await service.create(
        {
          type: RequestComplaintType.REQUEST,
          title: 'Leave application',
          description: 'Request for medical leave tomorrow',
        },
        mockClassTeacherUser,
      );

      expect(result).toBeDefined();
      expect(mockRequestComplaintRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientId: null,
          targetRole: UserRole.ADMIN,
        }),
      );
    });

    it('FORBIDS teacher from submitting to another teacher', async () => {
      await expect(
        service.create(
          {
            type: RequestComplaintType.COMPLAINT,
            title: 'Teacher dispute',
            description: 'Direct complaint to peer teacher',
            recipientId: mockOtherTeacherUser.id,
          },
          mockClassTeacherUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('FORBIDS teacher from submitting directly to a student', async () => {
      await expect(
        service.create(
          {
            type: RequestComplaintType.COMPLAINT,
            title: 'Student misbehavior',
            description: 'Direct complaint to student',
            recipientId: mockStudentUser.id,
          },
          mockClassTeacherUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ═════════════════════════════════════════════════════════════════════════
  // RULE 3: ADMIN ROUTING
  // ═════════════════════════════════════════════════════════════════════════

  describe('Rule 3: Admin Permissions', () => {
    it('allows admin to submit to a teacher', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 'new-rc-uuid',
        title: 'Syllabus submission deadline',
        senderId: mockAdminUser.id,
        recipientId: mockClassTeacherUser.id,
      } as any);

      const result = await service.create(
        {
          type: RequestComplaintType.REQUEST,
          title: 'Syllabus submission deadline',
          description: 'Please submit term exam syllabus by Friday',
          recipientId: mockClassTeacherUser.id,
        },
        mockAdminUser,
      );

      expect(result).toBeDefined();
      expect(mockRequestComplaintRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          senderId: mockAdminUser.id,
          recipientId: mockClassTeacherUser.id,
          targetRole: UserRole.TEACHER,
        }),
      );
    });

    it('allows admin to submit to a student', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 'new-rc-uuid',
        title: 'Fee payment reminder',
        senderId: mockAdminUser.id,
        recipientId: mockStudentUser.id,
      } as any);

      const result = await service.create(
        {
          type: RequestComplaintType.REQUEST,
          title: 'Fee payment reminder',
          description: 'Please submit term fees before exams',
          recipientId: mockStudentUser.id,
        },
        mockAdminUser,
      );

      expect(result).toBeDefined();
      expect(mockRequestComplaintRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          senderId: mockAdminUser.id,
          recipientId: mockStudentUser.id,
          targetRole: UserRole.STUDENT,
        }),
      );
    });

    it('requires recipientId when admin creates a request/complaint', async () => {
      await expect(
        service.create(
          {
            type: RequestComplaintType.REQUEST,
            title: 'Missing recipient',
            description: 'No target specified',
          },
          mockAdminUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ═════════════════════════════════════════════════════════════════════════
  // STATUS UPDATES & PERMISSIONS
  // ═════════════════════════════════════════════════════════════════════════

  describe('Status Updates', () => {
    it('allows sender to cancel their own PENDING request', async () => {
      const mockPendingItem = {
        id: 'item-1',
        senderId: mockStudentUser.id,
        status: RequestComplaintStatus.PENDING,
        schoolId: mockSchoolId,
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockPendingItem as any);

      const result = await service.updateStatus(
        'item-1',
        { status: RequestComplaintStatus.CANCELLED, resolutionNote: 'No longer needed' },
        mockStudentUser,
      );

      expect(mockRequestComplaintRepo.save).toHaveBeenCalled();
      expect(mockPendingItem.status).toBe(RequestComplaintStatus.CANCELLED);
    });

    it('forbids sender from cancelling when request is already IN_PROGRESS or RESOLVED', async () => {
      const mockInProgressItem = {
        id: 'item-1',
        senderId: mockStudentUser.id,
        status: RequestComplaintStatus.IN_PROGRESS,
        schoolId: mockSchoolId,
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockInProgressItem as any);

      await expect(
        service.updateStatus(
          'item-1',
          { status: RequestComplaintStatus.CANCELLED },
          mockStudentUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows assigned recipient teacher to update status to RESOLVED', async () => {
      const mockItem = {
        id: 'item-2',
        senderId: mockStudentUser.id,
        recipientId: mockClassTeacherUser.id,
        status: RequestComplaintStatus.IN_PROGRESS,
        schoolId: mockSchoolId,
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockItem as any);

      await service.updateStatus(
        'item-2',
        { status: RequestComplaintStatus.RESOLVED, resolutionNote: 'Explained in class' },
        mockClassTeacherUser,
      );

      expect(mockItem.status).toBe(RequestComplaintStatus.RESOLVED);
      expect((mockItem as any).resolvedById).toBe(mockClassTeacherUser.id);
    });

    it('forbids unrelated user from updating status', async () => {
      const mockItem = {
        id: 'item-3',
        senderId: mockStudentUser.id,
        recipientId: mockClassTeacherUser.id,
        status: RequestComplaintStatus.PENDING,
        schoolId: mockSchoolId,
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockItem as any);

      await expect(
        service.updateStatus(
          'item-3',
          { status: RequestComplaintStatus.RESOLVED },
          mockOtherTeacherUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ═════════════════════════════════════════════════════════════════════════
  // COMMENTS / CONVERSATION
  // ═════════════════════════════════════════════════════════════════════════

  describe('Comments Thread', () => {
    it('allows sender or recipient to post comments', async () => {
      const mockItem = {
        id: 'item-4',
        senderId: mockStudentUser.id,
        recipientId: mockAdminUser.id,
        schoolId: mockSchoolId,
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockItem as any);

      const comment = await service.addComment(
        'item-4',
        { message: 'Here is the doctor note.' },
        mockStudentUser,
      );

      expect(comment).toBeDefined();
      expect(mockCommentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          requestComplaintId: 'item-4',
          senderId: mockStudentUser.id,
          message: 'Here is the doctor note.',
        }),
      );
    });
  });
});
