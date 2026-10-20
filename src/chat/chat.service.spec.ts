import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { Conversation } from './entities/conversation.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Routine } from '../general/entities/routine.entity';
import { Class } from '../classes/entities/class.entity';
import { NotificationsService } from '../notifications/notifications.service';

describe('ChatService', () => {
  let service: ChatService;

  const mockSchoolId = '11111111-1111-1111-1111-111111111111';
  const otherSchoolId = '99999999-9999-9999-9999-999999999999';
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

  const mockUnassignedStudentUser: Partial<User> = {
    id: 'unassigned-student-uuid',
    name: 'Bob Unassigned',
    email: 'bob@school.com',
    role: UserRole.STUDENT,
    schoolId: mockSchoolId,
    classIds: [mockClassId2],
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
    classIds: [], // Class assigned via Routine
    isActive: true,
  };

  const mockUnrelatedTeacherUser: Partial<User> = {
    id: 'unrelated-teacher-uuid',
    name: 'Mr. Unrelated',
    email: 'unrelated@school.com',
    role: UserRole.TEACHER,
    schoolId: mockSchoolId,
    classIds: [mockClassId2],
    isActive: true,
  };

  const mockAdminUser: Partial<User> = {
    id: 'admin-uuid',
    name: 'School Admin',
    email: 'admin@school.com',
    role: UserRole.ADMIN,
    schoolId: mockSchoolId,
    isActive: true,
  };

  const mockPrincipalTeacherUser: Partial<User> = {
    id: 'principal-teacher-uuid',
    name: 'Principal Skinner',
    email: 'principal@school.com',
    role: UserRole.TEACHER,
    designation: 'Principal',
    schoolId: mockSchoolId,
    isActive: true,
  };

  const mockOtherSchoolUser: Partial<User> = {
    id: 'other-school-uuid',
    name: 'Other School Member',
    email: 'other@school.com',
    role: UserRole.TEACHER,
    schoolId: otherSchoolId,
    isActive: true,
  };

  let mockConversationRepo: any;
  let mockChatMessageRepo: any;
  let mockUserRepo: any;
  let mockRoutineRepo: any;
  let mockClassRepo: any;
  let mockNotificationsService: any;

  beforeEach(async () => {
    mockConversationRepo = {
      create: jest.fn().mockImplementation((dto) => ({
        id: 'new-conv-uuid',
        ...dto,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      save: jest.fn().mockImplementation(async (item) => ({
        id: item.id || 'new-conv-uuid',
        ...item,
      })),
      findOne: jest.fn().mockImplementation(async (opts) => {
        return {
          id: opts.where.id || 'new-conv-uuid',
          schoolId: mockSchoolId,
          user1Id: mockStudentUser.id,
          user2Id: mockClassTeacherUser.id,
          user1: mockStudentUser,
          user2: mockClassTeacherUser,
        };
      }),
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      }),
    };

    mockChatMessageRepo = {
      create: jest.fn().mockImplementation((dto) => ({
        id: 'msg-uuid-1',
        ...dto,
        createdAt: new Date(),
      })),
      save: jest.fn().mockImplementation(async (msg) => ({
        id: msg.id || 'msg-uuid-1',
        ...msg,
      })),
      findOne: jest.fn().mockImplementation(async (opts) => ({
        id: opts.where.id,
        message: 'Hello!',
        sender: mockStudentUser,
        recipient: mockClassTeacherUser,
      })),
      count: jest.fn().mockResolvedValue(2),
      update: jest.fn().mockResolvedValue({ affected: 3 }),
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      }),
    };

    mockUserRepo = {
      findOne: jest.fn().mockImplementation(async ({ where }) => {
        if (where.id === mockStudentUser.id) return { ...mockStudentUser };
        if (where.id === mockUnassignedStudentUser.id) return { ...mockUnassignedStudentUser };
        if (where.id === mockClassTeacherUser.id) return { ...mockClassTeacherUser };
        if (where.id === mockRoutineTeacherUser.id) return { ...mockRoutineTeacherUser };
        if (where.id === mockUnrelatedTeacherUser.id) return { ...mockUnrelatedTeacherUser };
        if (where.id === mockAdminUser.id) return { ...mockAdminUser };
        if (where.id === mockPrincipalTeacherUser.id) return { ...mockPrincipalTeacherUser };
        if (where.id === mockOtherSchoolUser.id) return { ...mockOtherSchoolUser };
        return null;
      }),
      find: jest.fn().mockResolvedValue([]),
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
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
        ChatService,
        {
          provide: getRepositoryToken(Conversation),
          useValue: mockConversationRepo,
        },
        {
          provide: getRepositoryToken(ChatMessage),
          useValue: mockChatMessageRepo,
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

    service = module.get<ChatService>(ChatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ═════════════════════════════════════════════════════════════════════════
  // RULE 1: STUDENT CHAT PERMISSIONS
  // ═════════════════════════════════════════════════════════════════════════

  describe('Rule 1: Student Permissions', () => {
    it('allows student to chat with Admin', async () => {
      const allowed = await service.validateChatPermission(
        mockStudentUser as User,
        mockAdminUser as User,
      );
      expect(allowed).toBe(true);
    });

    it('allows student to chat with Principal (designated teacher)', async () => {
      const allowed = await service.validateChatPermission(
        mockStudentUser as User,
        mockPrincipalTeacherUser as User,
      );
      expect(allowed).toBe(true);
    });

    it('allows student to chat with her class teacher (via classIds)', async () => {
      const allowed = await service.validateChatPermission(
        mockStudentUser as User,
        mockClassTeacherUser as User,
      );
      expect(allowed).toBe(true);
    });

    it('allows student to chat with her routine class teacher (via Routine)', async () => {
      const allowed = await service.validateChatPermission(
        mockStudentUser as User,
        mockRoutineTeacherUser as User,
      );
      expect(allowed).toBe(true);
    });

    it('FORBIDS student from chatting with a teacher who does not teach her class', async () => {
      await expect(
        service.validateChatPermission(
          mockStudentUser as User,
          mockUnrelatedTeacherUser as User,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('FORBIDS student from chatting with another student', async () => {
      await expect(
        service.validateChatPermission(
          mockStudentUser as User,
          mockUnassignedStudentUser as User,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ═════════════════════════════════════════════════════════════════════════
  // RULE 2: TEACHER CHAT PERMISSIONS
  // ═════════════════════════════════════════════════════════════════════════

  describe('Rule 2: Teacher Permissions', () => {
    it('allows teacher to chat with Admin', async () => {
      const allowed = await service.validateChatPermission(
        mockClassTeacherUser as User,
        mockAdminUser as User,
      );
      expect(allowed).toBe(true);
    });

    it('allows teacher to chat with Principal', async () => {
      const allowed = await service.validateChatPermission(
        mockClassTeacherUser as User,
        mockPrincipalTeacherUser as User,
      );
      expect(allowed).toBe(true);
    });

    it('allows teacher to chat with a student from her assigned class (via classIds)', async () => {
      const allowed = await service.validateChatPermission(
        mockClassTeacherUser as User,
        mockStudentUser as User,
      );
      expect(allowed).toBe(true);
    });

    it('allows routine teacher to chat with a student from her assigned class (via Routine)', async () => {
      const allowed = await service.validateChatPermission(
        mockRoutineTeacherUser as User,
        mockStudentUser as User,
      );
      expect(allowed).toBe(true);
    });

    it('FORBIDS teacher from chatting with a student from an unassigned class', async () => {
      await expect(
        service.validateChatPermission(
          mockClassTeacherUser as User,
          mockUnassignedStudentUser as User,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('FORBIDS teacher from chatting with another peer teacher (who is not principal/admin)', async () => {
      await expect(
        service.validateChatPermission(
          mockClassTeacherUser as User,
          mockUnrelatedTeacherUser as User,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ═════════════════════════════════════════════════════════════════════════
  // RULE 3: ADMIN CHAT PERMISSIONS
  // ═════════════════════════════════════════════════════════════════════════

  describe('Rule 3: Admin Permissions', () => {
    it('allows admin to chat with any student in the school', async () => {
      const allowed = await service.validateChatPermission(
        mockAdminUser as User,
        mockStudentUser as User,
      );
      expect(allowed).toBe(true);
    });

    it('allows admin to chat with any teacher in the school', async () => {
      const allowed = await service.validateChatPermission(
        mockAdminUser as User,
        mockUnrelatedTeacherUser as User,
      );
      expect(allowed).toBe(true);
    });

    it('allows admin to chat with another admin', async () => {
      const otherAdmin: Partial<User> = {
        id: 'admin-2-uuid',
        role: UserRole.ADMIN,
        schoolId: mockSchoolId,
      };
      mockUserRepo.findOne.mockResolvedValueOnce(otherAdmin);

      const allowed = await service.validateChatPermission(
        mockAdminUser as User,
        otherAdmin as User,
      );
      expect(allowed).toBe(true);
    });
  });

  // ═════════════════════════════════════════════════════════════════════════
  // GENERAL PERMISSION CONSTRAINTS
  // ═════════════════════════════════════════════════════════════════════════

  describe('General Constraints', () => {
    it('rejects chatting with oneself', async () => {
      await expect(
        service.validateChatPermission(
          mockStudentUser as User,
          mockStudentUser as User,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects cross-school chatting between non-superadmins', async () => {
      await expect(
        service.validateChatPermission(
          mockStudentUser as User,
          mockOtherSchoolUser as User,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ═════════════════════════════════════════════════════════════════════════
  // MESSAGING OPERATIONS
  // ═════════════════════════════════════════════════════════════════════════

  describe('Messaging Operations', () => {
    it('sends message and updates conversation lastMessageText and lastMessageAt', async () => {
      const result = await service.sendMessage(mockStudentUser, {
        recipientId: mockClassTeacherUser.id,
        message: 'Hello teacher!',
      });

      expect(result).toBeDefined();
      expect(mockChatMessageRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          senderId: mockStudentUser.id,
          recipientId: mockClassTeacherUser.id,
          message: 'Hello teacher!',
          isRead: false,
        }),
      );
      expect(mockConversationRepo.save).toHaveBeenCalled();
    });

    it('marks conversation messages as read', async () => {
      const result = await service.markAsRead(
        'existing-conv-id',
        mockStudentUser.id!,
      );
      expect(result.success).toBe(true);
      expect(mockChatMessageRepo.update).toHaveBeenCalledWith(
        {
          conversationId: 'existing-conv-id',
          recipientId: mockStudentUser.id,
          isRead: false,
        },
        expect.objectContaining({ isRead: true }),
      );
    });

    it('returns total unread count for user', async () => {
      const result = await service.getUnreadCount(mockStudentUser);
      expect(result).toEqual({ unreadCount: 2 });
    });
  });
});
