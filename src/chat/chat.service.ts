import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
  Optional,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, SelectQueryBuilder } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Routine } from '../general/entities/routine.entity';
import { Class } from '../classes/entities/class.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { StartConversationDto } from './dto/start-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { GetMessagesDto } from './dto/get-messages.dto';
import { GetContactsDto } from './dto/get-contacts.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  // Optional reference to ChatGateway for real-time socket events
  private wsNotifier?: (recipientId: string, event: string, payload: any) => void;

  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepo: Repository<ChatMessage>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Routine)
    private readonly routineRepo: Repository<Routine>,
    @InjectRepository(Class)
    private readonly classRepo: Repository<Class>,
    @Optional()
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService?: NotificationsService,
  ) {}

  public registerWsNotifier(
    notifier: (recipientId: string, event: string, payload: any) => void,
  ) {
    this.wsNotifier = notifier;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 1. CHAT PERMISSION VALIDATION
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Enforces the following rules:
   * 1. Student can chat with her classes teacher and admin.
   * 2. Teacher can chat with principal and only her assigned classes students.
   * 3. Admin can chat with anyone in this school.
   */
  async validateChatPermission(sender: User, recipient: User): Promise<boolean> {
    if (sender.id === recipient.id) {
      throw new BadRequestException('Cannot start a chat with yourself.');
    }

    // Must belong to the same school unless one is Super Admin
    const isSuperAdmin =
      sender.role === UserRole.SUPER_ADMIN ||
      recipient.role === UserRole.SUPER_ADMIN;

    if (!isSuperAdmin && sender.schoolId !== recipient.schoolId) {
      throw new BadRequestException(
        'Users must belong to the same school to chat.',
      );
    }

    const schoolId = sender.schoolId || recipient.schoolId;

    // ───────────────────────────────────────────────────────────────────────
    // RULE 1: SENDER IS STUDENT
    // ───────────────────────────────────────────────────────────────────────
    if (sender.role === UserRole.STUDENT) {
      // Allowed: Admin or Principal
      if (this.isPrincipalOrAdmin(recipient)) {
        return true;
      }

      // Allowed: Her class teachers
      if (recipient.role === UserRole.TEACHER) {
        const isClassTeacher = await this.isClassTeacherForStudent(
          recipient.id,
          sender.id,
          schoolId,
        );

        if (!isClassTeacher) {
          throw new ForbiddenException(
            'Students can only chat with their class teachers and admin.',
          );
        }
        return true;
      }

      // Forbidden: Other students or unrecognized roles
      throw new ForbiddenException(
        'Students can only chat with their class teachers and admin.',
      );
    }

    // ───────────────────────────────────────────────────────────────────────
    // RULE 2: SENDER IS TEACHER
    // ───────────────────────────────────────────────────────────────────────
    if (sender.role === UserRole.TEACHER) {
      // Allowed: Principal or Admin
      if (this.isPrincipalOrAdmin(recipient)) {
        return true;
      }

      // Allowed: Only her assigned classes students
      if (recipient.role === UserRole.STUDENT) {
        const isAssignedStudent = await this.isClassTeacherForStudent(
          sender.id,
          recipient.id,
          schoolId,
        );

        if (!isAssignedStudent) {
          throw new ForbiddenException(
            'Teachers can only chat with principal and their assigned classes students.',
          );
        }
        return true;
      }

      // Forbidden: Other teachers (unless principal/admin) or others
      throw new ForbiddenException(
        'Teachers can only chat with principal and their assigned classes students.',
      );
    }

    // ───────────────────────────────────────────────────────────────────────
    // RULE 3: SENDER IS ADMIN OR SUPER_ADMIN
    // ───────────────────────────────────────────────────────────────────────
    if (
      sender.role === UserRole.ADMIN ||
      sender.role === UserRole.SUPER_ADMIN
    ) {
      // Admin can chat with anyone in this school!
      const isValidRole =
        recipient.role === UserRole.STUDENT ||
        recipient.role === UserRole.TEACHER ||
        recipient.role === UserRole.ADMIN ||
        recipient.role === UserRole.SUPER_ADMIN;

      if (!isValidRole) {
        throw new BadRequestException('Recipient has an invalid role.');
      }
      return true;
    }

    throw new ForbiddenException('You do not have permission to use chat.');
  }

  /**
   * Checks if user is an Admin, SuperAdmin, or designated as Principal/Headmaster
   */
  isPrincipalOrAdmin(user: User): boolean {
    if (
      user.role === UserRole.ADMIN ||
      user.role === UserRole.SUPER_ADMIN
    ) {
      return true;
    }
    if (
      user.designation &&
      /principal|headmaster|headmistress/i.test(user.designation)
    ) {
      return true;
    }
    return false;
  }

  /**
   * Checks if a teacher is assigned to teach any of the student's enrolled classes
   */
  async isClassTeacherForStudent(
    teacherId: string,
    studentId: string,
    schoolId?: string,
  ): Promise<boolean> {
    const student = await this.userRepo.findOne({
      where: { id: studentId },
      select: ['id', 'classIds', 'schoolId'],
    });

    if (!student || !student.classIds || student.classIds.length === 0) {
      return false;
    }

    const teacher = await this.userRepo.findOne({
      where: { id: teacherId },
      select: ['id', 'classIds', 'schoolId', 'role'],
    });

    if (!teacher || teacher.role !== UserRole.TEACHER) {
      return false;
    }

    const studentClasses = Array.isArray(student.classIds)
      ? student.classIds
      : [];
    const teacherClasses = Array.isArray(teacher.classIds)
      ? teacher.classIds
      : [];

    // 1. Direct classIds overlap check
    const hasCommonClass = studentClasses.some((cid) =>
      teacherClasses.includes(cid),
    );
    if (hasCommonClass) {
      return true;
    }

    // 2. Routine assignment check
    if (studentClasses.length > 0) {
      const routineWhere: any = {
        classId: In(studentClasses),
        teacherId: teacher.id,
      };
      if (schoolId || student.schoolId) {
        routineWhere.schoolId = schoolId || student.schoolId;
      }

      const routineCount = await this.routineRepo.count({
        where: routineWhere,
      });

      if (routineCount > 0) {
        return true;
      }
    }

    return false;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 2. CONVERSATION MANAGEMENT
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Retrieves an existing conversation between two users or creates a new one.
   * Deterministically orders user1Id and user2Id so only one unique conversation exists.
   */
  async getOrCreateConversation(
    userAId: string,
    userBId: string,
    schoolId: string,
  ): Promise<Conversation> {
    const [user1Id, user2Id] =
      userAId < userBId ? [userAId, userBId] : [userBId, userAId];

    let conv = await this.conversationRepo.findOne({
      where: { schoolId, user1Id, user2Id },
      relations: ['user1', 'user2'],
    });

    if (!conv) {
      const created = this.conversationRepo.create({
        schoolId,
        user1Id,
        user2Id,
        lastMessageAt: new Date(),
      });
      const saved = await this.conversationRepo.save(created);
      const reloaded = await this.conversationRepo.findOne({
        where: { id: saved.id },
        relations: ['user1', 'user2'],
      });
      conv = reloaded || saved;
    }

    return conv!;
  }

  /**
   * Start a new conversation or send the initial message
   */
  async startConversation(dto: StartConversationDto, currentUser: any) {
    const sender = await this.userRepo.findOne({
      where: { id: currentUser.id },
    });
    if (!sender) {
      throw new NotFoundException('Current user record not found.');
    }

    const recipient = await this.userRepo.findOne({
      where: { id: dto.recipientId },
    });
    if (!recipient) {
      throw new NotFoundException('Recipient user not found.');
    }

    // Validate permission
    await this.validateChatPermission(sender, recipient);

    const schoolId = sender.schoolId || recipient.schoolId;
    const conversation = await this.getOrCreateConversation(
      sender.id,
      recipient.id,
      schoolId,
    );

    // If an initial message was supplied, send it
    let initialMessage: ChatMessage | null = null;
    if (dto.message && dto.message.trim().length > 0) {
      initialMessage = await this.sendMessage(sender, {
        conversationId: conversation.id,
        recipientId: recipient.id,
        message: dto.message,
        attachments: dto.attachments,
      });
    }

    const otherUser =
      conversation.user1Id === sender.id
        ? conversation.user2
        : conversation.user1;

    return {
      conversation: {
        id: conversation.id,
        schoolId: conversation.schoolId,
        otherUser: {
          id: otherUser.id,
          name: otherUser.name,
          email: otherUser.email,
          avatar: otherUser.avatar,
          role: otherUser.role,
          designation: otherUser.designation,
        },
        lastMessageText: conversation.lastMessageText,
        lastMessageAt: conversation.lastMessageAt,
      },
      message: initialMessage,
    };
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 3. SEND MESSAGE
  // ═════════════════════════════════════════════════════════════════════════

  async sendMessage(senderUser: any, dto: SendMessageDto) {
    const sender = await this.userRepo.findOne({
      where: { id: senderUser.id },
    });
    if (!sender) {
      throw new NotFoundException('Sender not found.');
    }

    let recipientId = dto.recipientId;
    let conversation: Conversation | null = null;

    if (dto.conversationId) {
      conversation = await this.conversationRepo.findOne({
        where: { id: dto.conversationId },
        relations: ['user1', 'user2'],
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found.');
      }

      if (
        conversation.user1Id !== sender.id &&
        conversation.user2Id !== sender.id &&
        sender.role !== UserRole.SUPER_ADMIN
      ) {
        throw new ForbiddenException(
          'You are not a participant in this conversation.',
        );
      }

      recipientId =
        conversation.user1Id === sender.id
          ? conversation.user2Id
          : conversation.user1Id;
    }

    if (!recipientId) {
      throw new BadRequestException(
        'Recipient ID or conversation ID must be provided.',
      );
    }

    const recipient = await this.userRepo.findOne({
      where: { id: recipientId },
    });
    if (!recipient) {
      throw new NotFoundException('Recipient user not found.');
    }

    // Verify permission
    await this.validateChatPermission(sender, recipient);

    const schoolId = sender.schoolId || recipient.schoolId;

    if (!conversation) {
      conversation = await this.getOrCreateConversation(
        sender.id,
        recipient.id,
        schoolId,
      );
    }

    const messageText = dto.message.trim();
    if (!messageText) {
      throw new BadRequestException('Message cannot be empty.');
    }

    // Create & save chat message
    const chatMessage = this.chatMessageRepo.create({
      conversationId: conversation.id,
      schoolId,
      senderId: sender.id,
      recipientId: recipient.id,
      message: messageText,
      attachments: dto.attachments || [],
      isRead: false,
    });

    const savedMessage = await this.chatMessageRepo.save(chatMessage);

    // Update conversation preview
    conversation.lastMessageText = messageText.substring(0, 255);
    conversation.lastMessageSenderId = sender.id;
    conversation.lastMessageAt = new Date();
    await this.conversationRepo.save(conversation);

    // Fetch saved message with sender details
    const populated = await this.chatMessageRepo.findOne({
      where: { id: savedMessage.id },
      relations: ['sender', 'recipient'],
    });

    // Asynchronously dispatch Push Notification
    this.sendChatPushNotification(sender, recipient, messageText, conversation.id).catch(
      (err) => this.logger.warn(`Failed to dispatch push notification: ${err.message}`),
    );

    // Real-time WebSocket dispatch
    if (this.wsNotifier) {
      try {
        this.wsNotifier(recipient.id, 'new_message', populated);
      } catch (err: any) {
        this.logger.warn(`Failed to dispatch WS event: ${err.message}`);
      }
    }

    return populated;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 4. GET CONVERSATIONS LIST
  // ═════════════════════════════════════════════════════════════════════════

  async getUserConversations(currentUser: any) {
    const userId = currentUser.id;
    const schoolId = currentUser.schoolId;

    const qb = this.conversationRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.user1', 'u1')
      .leftJoinAndSelect('c.user2', 'u2')
      .where('(c.user1Id = :userId OR c.user2Id = :userId)', { userId });

    if (schoolId && currentUser.role !== UserRole.SUPER_ADMIN) {
      qb.andWhere('c.schoolId = :schoolId', { schoolId });
    }

    qb.orderBy('c.lastMessageAt', 'DESC');

    const conversations = await qb.getMany();

    const results = [];
    for (const c of conversations) {
      const otherUser = c.user1Id === userId ? c.user2 : c.user1;
      if (!otherUser) continue;

      // Count unread messages for current user
      const unreadCount = await this.chatMessageRepo.count({
        where: {
          conversationId: c.id,
          recipientId: userId,
          isRead: false,
        },
      });

      results.push({
        id: c.id,
        schoolId: c.schoolId,
        otherUser: {
          id: otherUser.id,
          name: otherUser.name,
          email: otherUser.email,
          avatar: otherUser.avatar,
          role: otherUser.role,
          designation: otherUser.designation,
        },
        lastMessageText: c.lastMessageText || '',
        lastMessageSenderId: c.lastMessageSenderId || null,
        lastMessageAt: c.lastMessageAt,
        unreadCount,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      });
    }

    return results;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 5. GET MESSAGES IN CONVERSATION
  // ═════════════════════════════════════════════════════════════════════════

  async getConversationMessages(
    conversationId: string,
    currentUser: any,
    dto?: GetMessagesDto,
  ) {
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId },
      relations: ['user1', 'user2'],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found.');
    }

    if (
      conversation.user1Id !== currentUser.id &&
      conversation.user2Id !== currentUser.id &&
      currentUser.role !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'You do not have permission to view messages in this conversation.',
      );
    }

    const page = dto?.page && dto.page > 0 ? Number(dto.page) : 1;
    const limit = dto?.limit && dto.limit > 0 ? Number(dto.limit) : 50;
    const skip = (page - 1) * limit;

    const qb = this.chatMessageRepo
      .createQueryBuilder('msg')
      .leftJoinAndSelect('msg.sender', 'sender')
      .where('msg.conversationId = :conversationId', { conversationId });

    if (dto?.before) {
      qb.andWhere('msg.createdAt < :before', {
        before: new Date(dto.before),
      });
    }

    qb.orderBy('msg.createdAt', 'ASC')
      .skip(skip)
      .take(limit);

    const [messages, total] = await qb.getManyAndCount();

    // Automatically mark unread messages as read
    await this.markAsRead(conversationId, currentUser.id);

    const otherUser =
      conversation.user1Id === currentUser.id
        ? conversation.user2
        : conversation.user1;

    return {
      conversationId,
      otherUser: otherUser
        ? {
            id: otherUser.id,
            name: otherUser.name,
            email: otherUser.email,
            avatar: otherUser.avatar,
            role: otherUser.role,
            designation: otherUser.designation,
          }
        : null,
      messages,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 6. MARK CONVERSATION AS READ
  // ═════════════════════════════════════════════════════════════════════════

  async markAsRead(conversationId: string, userId: string) {
    const result = await this.chatMessageRepo.update(
      {
        conversationId,
        recipientId: userId,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      },
    );

    return { success: true, markedCount: result.affected || 0 };
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 7. GET TOTAL UNREAD COUNT
  // ═════════════════════════════════════════════════════════════════════════

  async getUnreadCount(currentUser: any) {
    const unreadCount = await this.chatMessageRepo.count({
      where: {
        recipientId: currentUser.id,
        isRead: false,
      },
    });

    return { unreadCount };
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 8. GET ALLOWED CHAT CONTACTS (BASED ON ROLE RULES)
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Returns contacts allowed to chat with the current user according to rules:
   * - Student: Admin + Her class teachers
   * - Teacher: Principal/Admin + Only her assigned classes students
   * - Admin: Anyone in this school (teachers, students, admins)
   */
  async getContacts(currentUser: any, dto?: GetContactsDto) {
    const schoolId = currentUser.schoolId;
    const search = dto?.search ? dto.search.toLowerCase() : null;

    // ───────────────────────────────────────────────────────────────────────
    // A. STUDENT CONTACTS: Admins + Her Class Teachers
    // ───────────────────────────────────────────────────────────────────────
    if (currentUser.role === UserRole.STUDENT) {
      // 1. Admins
      const adminQb = this.userRepo
        .createQueryBuilder('user')
        .select([
          'user.id',
          'user.name',
          'user.email',
          'user.avatar',
          'user.role',
          'user.designation',
        ])
        .where('user.role IN (:...roles)', {
          roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
        })
        .andWhere('user.isActive = :isActive', { isActive: true });

      if (schoolId) {
        adminQb.andWhere(
          '(user.schoolId = :schoolId OR user.role = :superRole)',
          { schoolId, superRole: UserRole.SUPER_ADMIN },
        );
      }
      if (search) {
        adminQb.andWhere(
          '(LOWER(user.name) LIKE :search OR LOWER(user.email) LIKE :search)',
          { search: `%${search}%` },
        );
      }
      const admins = await adminQb.getMany();

      // 2. Class Teachers
      const student = await this.userRepo.findOne({
        where: { id: currentUser.id },
        select: ['id', 'classIds', 'schoolId'],
      });

      const studentClasses =
        student && Array.isArray(student.classIds) ? student.classIds : [];

      let classTeachers: any[] = [];

      if (studentClasses.length > 0) {
        // Teacher classIds overlap
        const teacherQb = this.userRepo
          .createQueryBuilder('user')
          .select([
            'user.id',
            'user.name',
            'user.email',
            'user.avatar',
            'user.role',
            'user.designation',
            'user.classIds',
          ])
          .where('user.role = :role', { role: UserRole.TEACHER })
          .andWhere('user.isActive = :isActive', { isActive: true });

        if (schoolId) {
          teacherQb.andWhere('user.schoolId = :schoolId', { schoolId });
        }
        if (search) {
          teacherQb.andWhere(
            '(LOWER(user.name) LIKE :search OR LOWER(user.email) LIKE :search)',
            { search: `%${search}%` },
          );
        }

        const allTeachers = await teacherQb.getMany();
        const teacherMap = new Map<string, any>();

        for (const t of allTeachers) {
          const tClasses = Array.isArray(t.classIds) ? t.classIds : [];
          if (studentClasses.some((cid) => tClasses.includes(cid))) {
            teacherMap.set(t.id, {
              id: t.id,
              name: t.name,
              email: t.email,
              avatar: t.avatar,
              role: t.role,
              designation: t.designation,
              subjects: [],
            });
          }
        }

        // Routine teachers
        const routines = await this.routineRepo.find({
          where: {
            classId: In(studentClasses),
            ...(schoolId ? { schoolId } : {}),
          },
          relations: ['teacherEntity', 'subjectEntity'],
        });

        for (const r of routines) {
          if (r.teacherEntity && r.teacherEntity.isActive) {
            const t = r.teacherEntity;
            if (
              search &&
              !t.name.toLowerCase().includes(search) &&
              !t.email?.toLowerCase().includes(search)
            ) {
              continue;
            }

            if (!teacherMap.has(t.id)) {
              teacherMap.set(t.id, {
                id: t.id,
                name: t.name,
                email: t.email,
                avatar: t.avatar,
                role: t.role,
                designation: t.designation,
                subjects: [],
              });
            }

            const entry = teacherMap.get(t.id);
            if (
              r.subjectEntity?.name &&
              !entry.subjects.includes(r.subjectEntity.name)
            ) {
              entry.subjects.push(r.subjectEntity.name);
            }
          }
        }

        classTeachers = Array.from(teacherMap.values());
      }

      return {
        role: UserRole.STUDENT,
        admins,
        classTeachers,
      };
    }

    // ───────────────────────────────────────────────────────────────────────
    // B. TEACHER CONTACTS: Principal/Admins + Assigned Classes Students
    // ───────────────────────────────────────────────────────────────────────
    if (currentUser.role === UserRole.TEACHER) {
      // 1. Principals and Admins
      const adminQb = this.userRepo
        .createQueryBuilder('user')
        .select([
          'user.id',
          'user.name',
          'user.email',
          'user.avatar',
          'user.role',
          'user.designation',
        ])
        .where(
          '(user.role IN (:...roles) OR LOWER(user.designation) LIKE :principalPattern)',
          {
            roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
            principalPattern: '%principal%',
          },
        )
        .andWhere('user.isActive = :isActive', { isActive: true });

      if (schoolId) {
        adminQb.andWhere(
          '(user.schoolId = :schoolId OR user.role = :superRole)',
          { schoolId, superRole: UserRole.SUPER_ADMIN },
        );
      }
      if (search) {
        adminQb.andWhere(
          '(LOWER(user.name) LIKE :search OR LOWER(user.email) LIKE :search)',
          { search: `%${search}%` },
        );
      }
      const principalsAndAdmins = await adminQb.getMany();

      // 2. Assigned Classes Students
      const teacher = await this.userRepo.findOne({
        where: { id: currentUser.id },
        select: ['id', 'classIds', 'schoolId'],
      });

      const assignedClassIdsSet = new Set<string>();
      if (teacher?.classIds && Array.isArray(teacher.classIds)) {
        teacher.classIds.forEach((cid) => assignedClassIdsSet.add(cid));
      }

      // Collect from Routine
      const teacherRoutines = await this.routineRepo.find({
        where: {
          teacherId: currentUser.id,
          ...(schoolId ? { schoolId } : {}),
        },
        select: ['classId'],
      });
      teacherRoutines.forEach((r) => assignedClassIdsSet.add(r.classId));

      const assignedClassIds = Array.from(assignedClassIdsSet);

      let assignedStudents: any[] = [];
      if (assignedClassIds.length > 0) {
        const studentQb = this.userRepo
          .createQueryBuilder('user')
          .select([
            'user.id',
            'user.name',
            'user.email',
            'user.avatar',
            'user.role',
            'user.rollNumber',
            'user.classIds',
          ])
          .where('user.role = :role', { role: UserRole.STUDENT })
          .andWhere('user.isActive = :isActive', { isActive: true });

        if (schoolId) {
          studentQb.andWhere('user.schoolId = :schoolId', { schoolId });
        }
        if (dto?.classId) {
          studentQb.andWhere('user.classIds LIKE :classId', {
            classId: `%${dto.classId}%`,
          });
        }
        if (search) {
          studentQb.andWhere(
            '(LOWER(user.name) LIKE :search OR LOWER(user.email) LIKE :search OR user.rollNumber LIKE :search)',
            { search: `%${search}%` },
          );
        }

        const candidates = await studentQb.take(200).getMany();

        // Filter to only those whose classIds overlap with assignedClassIds
        assignedStudents = candidates.filter((s) => {
          const sClasses = Array.isArray(s.classIds) ? s.classIds : [];
          return sClasses.some((cid) => assignedClassIdsSet.has(cid));
        });
      }

      return {
        role: UserRole.TEACHER,
        principalsAndAdmins,
        assignedStudents,
      };
    }

    // ───────────────────────────────────────────────────────────────────────
    // C. ADMIN CONTACTS: Anyone in this school
    // ───────────────────────────────────────────────────────────────────────
    const baseQb = (role: UserRole) => {
      const qb = this.userRepo
        .createQueryBuilder('user')
        .select([
          'user.id',
          'user.name',
          'user.email',
          'user.avatar',
          'user.role',
          'user.designation',
          'user.rollNumber',
          'user.classIds',
        ])
        .where('user.role = :role', { role })
        .andWhere('user.isActive = :isActive', { isActive: true });

      if (schoolId && currentUser.role !== UserRole.SUPER_ADMIN) {
        qb.andWhere('user.schoolId = :schoolId', { schoolId });
      }
      if (search) {
        qb.andWhere(
          '(LOWER(user.name) LIKE :search OR LOWER(user.email) LIKE :search OR user.rollNumber LIKE :search)',
          { search: `%${search}%` },
        );
      }
      return qb;
    };

    let admins: User[] = [];
    let teachers: User[] = [];
    let students: User[] = [];

    if (!dto?.role || dto.role === UserRole.ADMIN) {
      admins = await baseQb(UserRole.ADMIN).getMany();
    }
    if (!dto?.role || dto.role === UserRole.TEACHER) {
      teachers = await baseQb(UserRole.TEACHER).getMany();
    }
    if (!dto?.role || dto.role === UserRole.STUDENT) {
      const studentQb = baseQb(UserRole.STUDENT);
      if (dto?.classId) {
        studentQb.andWhere('user.classIds LIKE :classId', {
          classId: `%${dto.classId}%`,
        });
      }
      students = await studentQb.take(200).getMany();
    }

    return {
      role: currentUser.role,
      admins,
      teachers,
      students,
    };
  }

  // ═════════════════════════════════════════════════════════════════════════
  // NOTIFICATION DISPATCH HELPERS
  // ═════════════════════════════════════════════════════════════════════════

  private async sendChatPushNotification(
    sender: User,
    recipient: User,
    messageText: string,
    conversationId: string,
  ) {
    if (!this.notificationsService) return;

    const title = `Message from ${sender.name}`;
    const preview =
      messageText.length > 80
        ? `${messageText.substring(0, 80)}...`
        : messageText;

    await this.notificationsService.sendToUser(
      recipient.id,
      title,
      preview,
      {
        type: 'CHAT_MESSAGE',
        conversationId,
        senderId: sender.id,
        senderName: sender.name,
      },
      recipient.schoolId,
    );
  }
}
