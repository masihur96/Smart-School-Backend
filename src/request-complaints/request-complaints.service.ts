import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
  Optional,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, SelectQueryBuilder } from 'typeorm';
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
import { CreateRequestComplaintDto } from './dto/create-request-complaint.dto';
import { UpdateRequestComplaintStatusDto } from './dto/update-request-complaint-status.dto';
import { AddCommentDto } from './dto/add-comment.dto';
import {
  FilterRequestComplaintDto,
  RequestComplaintScope,
} from './dto/filter-request-complaint.dto';

@Injectable()
export class RequestComplaintsService {
  private readonly logger = new Logger(RequestComplaintsService.name);

  constructor(
    @InjectRepository(RequestComplaint)
    private readonly requestComplaintRepo: Repository<RequestComplaint>,
    @InjectRepository(RequestComplaintComment)
    private readonly commentRepo: Repository<RequestComplaintComment>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Routine)
    private readonly routineRepo: Repository<Routine>,
    @InjectRepository(Class)
    private readonly classRepo: Repository<Class>,
    @Optional()
    @Inject(NotificationsService)
    private readonly notificationsService?: NotificationsService,
  ) {}

  // ═════════════════════════════════════════════════════════════════════════
  // 1. CREATE REQUEST / COMPLAINT
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Enforces rules:
   * - Student: can only request/complain to her class teachers and admin.
   * - Teacher: can only request/complain to admin.
   * - Admin: can request/complain to teachers and students.
   */
  async create(dto: CreateRequestComplaintDto, currentUser: any) {
    const schoolId =
      currentUser.role === UserRole.SUPER_ADMIN
        ? dto.schoolId || currentUser.schoolId
        : currentUser.schoolId;

    if (!schoolId && currentUser.role !== UserRole.SUPER_ADMIN) {
      throw new BadRequestException('User does not belong to a school.');
    }

    let targetRecipient: User | null = null;
    let targetRole: string | null = null;

    if (currentUser.role === UserRole.STUDENT) {
      // ───────────────────────────────────────────────────────────────────
      // RULE 1: STUDENT -> Class Teachers OR Admin
      // ───────────────────────────────────────────────────────────────────
      if (dto.recipientId) {
        targetRecipient = await this.userRepo.findOne({
          where: { id: dto.recipientId },
        });

        if (!targetRecipient) {
          throw new NotFoundException('Recipient user not found.');
        }

        if (
          schoolId &&
          targetRecipient.schoolId !== schoolId &&
          targetRecipient.role !== UserRole.SUPER_ADMIN
        ) {
          throw new BadRequestException(
            'Recipient does not belong to your school.',
          );
        }

        const isAdmin =
          targetRecipient.role === UserRole.ADMIN ||
          targetRecipient.role === UserRole.SUPER_ADMIN;

        if (isAdmin) {
          targetRole = UserRole.ADMIN;
        } else if (targetRecipient.role === UserRole.TEACHER) {
          // Verify that this teacher teaches student's class
          const isClassTeacher = await this.isTeacherForStudent(
            currentUser.id,
            targetRecipient.id,
            schoolId,
          );

          if (!isClassTeacher) {
            throw new ForbiddenException(
              'Students can only submit requests or complaints to their class teachers or admin.',
            );
          }
          targetRole = UserRole.TEACHER;
        } else {
          throw new ForbiddenException(
            'Students can only submit requests or complaints to their class teachers or admin.',
          );
        }
      } else {
        // Omitting recipientId routes directly to School Admin queue
        targetRole = UserRole.ADMIN;
      }
    } else if (currentUser.role === UserRole.TEACHER) {
      // ───────────────────────────────────────────────────────────────────
      // RULE 2: TEACHER -> Admin ONLY
      // ───────────────────────────────────────────────────────────────────
      if (dto.recipientId) {
        targetRecipient = await this.userRepo.findOne({
          where: { id: dto.recipientId },
        });

        if (!targetRecipient) {
          throw new NotFoundException('Recipient user not found.');
        }

        if (
          schoolId &&
          targetRecipient.schoolId !== schoolId &&
          targetRecipient.role !== UserRole.SUPER_ADMIN
        ) {
          throw new BadRequestException(
            'Recipient does not belong to your school.',
          );
        }

        const isAdmin =
          targetRecipient.role === UserRole.ADMIN ||
          targetRecipient.role === UserRole.SUPER_ADMIN;

        if (!isAdmin) {
          throw new ForbiddenException(
            'Teachers can only submit requests or complaints to admin.',
          );
        }
        targetRole = UserRole.ADMIN;
      } else {
        // Teacher routes directly to School Admin queue
        targetRole = UserRole.ADMIN;
      }
    } else if (
      currentUser.role === UserRole.ADMIN ||
      currentUser.role === UserRole.SUPER_ADMIN
    ) {
      // ───────────────────────────────────────────────────────────────────
      // RULE 3: ADMIN -> Teacher AND Student (also other admins)
      // ───────────────────────────────────────────────────────────────────
      if (!dto.recipientId) {
        throw new BadRequestException(
          'Recipient ID is required for requests or complaints created by admin.',
        );
      }

      targetRecipient = await this.userRepo.findOne({
        where: { id: dto.recipientId },
      });

      if (!targetRecipient) {
        throw new NotFoundException('Recipient user not found.');
      }

      if (
        schoolId &&
        targetRecipient.schoolId !== schoolId &&
        currentUser.role !== UserRole.SUPER_ADMIN
      ) {
        throw new BadRequestException(
          'Recipient does not belong to your school.',
        );
      }

      const isValidRecipientRole =
        targetRecipient.role === UserRole.TEACHER ||
        targetRecipient.role === UserRole.STUDENT ||
        targetRecipient.role === UserRole.ADMIN;

      if (!isValidRecipientRole) {
        throw new ForbiddenException(
          'Admins can only submit requests or complaints to teachers or students.',
        );
      }

      targetRole = targetRecipient.role;
    } else {
      throw new ForbiddenException(
        'You do not have permission to submit requests or complaints.',
      );
    }

    const item = this.requestComplaintRepo.create({
      schoolId: schoolId || currentUser.schoolId,
      senderId: currentUser.id,
      recipientId: targetRecipient ? targetRecipient.id : null,
      targetRole: targetRole || null,
      type: dto.type,
      category: dto.category || RequestComplaintCategory.OTHER,
      title: dto.title.trim(),
      description: dto.description.trim(),
      priority: dto.priority || RequestComplaintPriority.MEDIUM,
      status: RequestComplaintStatus.PENDING,
      attachments: dto.attachments || [],
    });

    const saved = await this.requestComplaintRepo.save(item);

    // Asynchronously dispatch notifications
    this.sendCreatedNotification(saved, currentUser, targetRecipient).catch(
      (err) => this.logger.warn(`Failed to dispatch notification: ${err.message}`),
    );

    return this.findOne(saved.id, currentUser);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 2. HELPER: VERIFY IF TEACHER IS A CLASS TEACHER FOR STUDENT
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * A teacher is considered a student's class teacher if:
   * 1. The teacher has any of the student's class IDs in teacher.classIds, OR
   * 2. The Routine schedule assigns the teacher to teach any of the student's classes.
   */
  async isTeacherForStudent(
    studentId: string,
    teacherId: string,
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

    // 1. Direct classIds overlap check
    const studentClasses = Array.isArray(student.classIds) ? student.classIds : [];
    const teacherClasses = Array.isArray(teacher.classIds) ? teacher.classIds : [];

    const hasCommonClass = studentClasses.some((cId) =>
      teacherClasses.includes(cId),
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
  // 3. GET PERMITTED RECIPIENTS BASED ON CALLER'S ROLE
  // ═════════════════════════════════════════════════════════════════════════

  /**
   * Provides dynamic recipient options tailored to the authenticated user's permissions:
   * - Student: School Admins + Her Class Teachers
   * - Teacher: School Admins only
   * - Admin: Teachers and Students in the school
   */
  async getAvailableRecipients(
    currentUser: any,
    options?: { search?: string; classId?: string },
  ) {
    const schoolId = currentUser.schoolId;
    const search = options?.search ? options.search.toLowerCase() : null;

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
        adminQb.andWhere('(user.schoolId = :schoolId OR user.role = :superRole)', {
          schoolId,
          superRole: UserRole.SUPER_ADMIN,
        });
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
        // A. Teachers from user.classIds
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
          if (studentClasses.some((cId) => tClasses.includes(cId))) {
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

        // B. Teachers from Routines
        const routines = await this.routineRepo.find({
          where: {
            classId: In(studentClasses),
            ...(schoolId ? { schoolId } : {}),
          },
          relations: ['teacherEntity', 'subjectEntity', 'classEntity'],
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
            if (r.subjectEntity?.name && !entry.subjects.includes(r.subjectEntity.name)) {
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
    } else if (currentUser.role === UserRole.TEACHER) {
      // Teachers can only submit to Admin
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
        adminQb.andWhere('(user.schoolId = :schoolId OR user.role = :superRole)', {
          schoolId,
          superRole: UserRole.SUPER_ADMIN,
        });
      }
      if (search) {
        adminQb.andWhere(
          '(LOWER(user.name) LIKE :search OR LOWER(user.email) LIKE :search)',
          { search: `%${search}%` },
        );
      }

      const admins = await adminQb.getMany();

      return {
        role: UserRole.TEACHER,
        admins,
      };
    } else {
      // Admins can submit to Teachers and Students
      const teachersQb = this.userRepo
        .createQueryBuilder('user')
        .select([
          'user.id',
          'user.name',
          'user.email',
          'user.avatar',
          'user.role',
          'user.designation',
          'user.phone',
        ])
        .where('user.role = :role', { role: UserRole.TEACHER })
        .andWhere('user.isActive = :isActive', { isActive: true });

      if (schoolId) {
        teachersQb.andWhere('user.schoolId = :schoolId', { schoolId });
      }
      if (search) {
        teachersQb.andWhere(
          '(LOWER(user.name) LIKE :search OR LOWER(user.email) LIKE :search)',
          { search: `%${search}%` },
        );
      }

      const teachers = await teachersQb.getMany();

      const studentsQb = this.userRepo
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
        studentsQb.andWhere('user.schoolId = :schoolId', { schoolId });
      }
      if (options?.classId) {
        studentsQb.andWhere('user.classIds LIKE :classId', {
          classId: `%${options.classId}%`,
        });
      }
      if (search) {
        studentsQb.andWhere(
          '(LOWER(user.name) LIKE :search OR LOWER(user.email) LIKE :search OR user.rollNumber LIKE :search)',
          { search: `%${search}%` },
        );
      }

      const students = await studentsQb.take(100).getMany();

      return {
        role: currentUser.role,
        teachers,
        students,
      };
    }
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 4. FIND ALL (WITH ROLE SCOPING & FILTERS)
  // ═════════════════════════════════════════════════════════════════════════

  async findAll(filters: FilterRequestComplaintDto, currentUser: any) {
    const schoolId =
      currentUser.role === UserRole.SUPER_ADMIN
        ? filters.schoolId || currentUser.schoolId
        : currentUser.schoolId;

    const page = filters.page && filters.page > 0 ? Number(filters.page) : 1;
    const limit = filters.limit && filters.limit > 0 ? Number(filters.limit) : 10;
    const skip = (page - 1) * limit;

    const qb: SelectQueryBuilder<RequestComplaint> = this.requestComplaintRepo
      .createQueryBuilder('rc')
      .leftJoinAndSelect('rc.sender', 'sender')
      .leftJoinAndSelect('rc.recipient', 'recipient')
      .leftJoinAndSelect('rc.resolvedBy', 'resolvedBy');

    // School filter
    if (schoolId) {
      qb.andWhere('rc.schoolId = :schoolId', { schoolId });
    }

    // Role-based scoping
    if (currentUser.role === UserRole.STUDENT) {
      // Student sees requests sent by them OR sent to them
      qb.andWhere('(rc.senderId = :myId OR rc.recipientId = :myId)', {
        myId: currentUser.id,
      });
    } else if (currentUser.role === UserRole.TEACHER) {
      // Teacher sees requests sent by them OR sent to them
      qb.andWhere('(rc.senderId = :myId OR rc.recipientId = :myId)', {
        myId: currentUser.id,
      });
    } else if (
      currentUser.role === UserRole.ADMIN ||
      currentUser.role === UserRole.SUPER_ADMIN
    ) {
      // Admin scoping by optional scope filter
      if (filters.scope === RequestComplaintScope.SENT) {
        qb.andWhere('rc.senderId = :myId', { myId: currentUser.id });
      } else if (filters.scope === RequestComplaintScope.RECEIVED) {
        qb.andWhere('rc.recipientId = :myId', { myId: currentUser.id });
      } else if (filters.scope === RequestComplaintScope.UNASSIGNED) {
        qb.andWhere(
          '(rc.recipientId IS NULL AND rc.targetRole = :adminRole)',
          { adminRole: UserRole.ADMIN },
        );
      }
      // If scope is ALL or undefined, admin sees all requests/complaints in their school
    }

    // Extra filters
    if (filters.type) {
      qb.andWhere('rc.type = :type', { type: filters.type });
    }
    if (filters.status) {
      qb.andWhere('rc.status = :status', { status: filters.status });
    }
    if (filters.priority) {
      qb.andWhere('rc.priority = :priority', { priority: filters.priority });
    }
    if (filters.category) {
      qb.andWhere('rc.category = :category', { category: filters.category });
    }
    if (filters.search) {
      qb.andWhere(
        '(LOWER(rc.title) LIKE :search OR LOWER(rc.description) LIKE :search)',
        { search: `%${filters.search.toLowerCase()}%` },
      );
    }

    qb.orderBy('rc.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 5. FIND ONE
  // ═════════════════════════════════════════════════════════════════════════

  async findOne(id: string, currentUser: any) {
    const qb = this.requestComplaintRepo
      .createQueryBuilder('rc')
      .leftJoinAndSelect('rc.sender', 'sender')
      .leftJoinAndSelect('rc.recipient', 'recipient')
      .leftJoinAndSelect('rc.resolvedBy', 'resolvedBy')
      .leftJoinAndSelect('rc.comments', 'comments')
      .leftJoinAndSelect('comments.sender', 'commentSender')
      .where('rc.id = :id', { id })
      .orderBy('comments.createdAt', 'ASC');

    const item = await qb.getOne();

    if (!item) {
      throw new NotFoundException(`Request or complaint with ID ${id} not found.`);
    }

    // Permission check
    const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN;
    const isSchoolAdmin =
      currentUser.role === UserRole.ADMIN &&
      (!currentUser.schoolId || currentUser.schoolId === item.schoolId);
    const isSender = item.senderId === currentUser.id;
    const isRecipient = item.recipientId === currentUser.id;
    const isUnassignedAdminTicket =
      !item.recipientId &&
      item.targetRole === UserRole.ADMIN &&
      (currentUser.role === UserRole.ADMIN || isSuperAdmin);

    if (
      !isSuperAdmin &&
      !isSchoolAdmin &&
      !isSender &&
      !isRecipient &&
      !isUnassignedAdminTicket
    ) {
      throw new ForbiddenException(
        'You do not have permission to view this request or complaint.',
      );
    }

    return item;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 6. UPDATE STATUS
  // ═════════════════════════════════════════════════════════════════════════

  async updateStatus(
    id: string,
    dto: UpdateRequestComplaintStatusDto,
    currentUser: any,
  ) {
    const item = await this.findOne(id, currentUser);

    const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN;
    const isSchoolAdmin =
      currentUser.role === UserRole.ADMIN &&
      (!currentUser.schoolId || currentUser.schoolId === item.schoolId);
    const isSender = item.senderId === currentUser.id;
    const isRecipient = item.recipientId === currentUser.id;

    // Sender can ONLY cancel their own PENDING request
    if (dto.status === RequestComplaintStatus.CANCELLED) {
      if (!isSender && !isSchoolAdmin && !isSuperAdmin) {
        throw new ForbiddenException(
          'Only the creator or school admin can cancel this request.',
        );
      }
      if (isSender && !isSchoolAdmin && !isSuperAdmin && item.status !== RequestComplaintStatus.PENDING) {
        throw new BadRequestException(
          'You can only cancel a request or complaint while it is still pending.',
        );
      }
    } else {
      // For IN_PROGRESS, RESOLVED, REJECTED:
      // Must be school admin or the assigned recipient
      const canResolve = isSchoolAdmin || isSuperAdmin || isRecipient;
      if (!canResolve) {
        throw new ForbiddenException(
          'Only the recipient or school admin can update the status of this request or complaint.',
        );
      }
    }

    // If unassigned admin ticket moved to IN_PROGRESS, claim it for this admin
    if (
      !item.recipientId &&
      (isSchoolAdmin || isSuperAdmin) &&
      dto.status === RequestComplaintStatus.IN_PROGRESS
    ) {
      item.recipientId = currentUser.id;
    }

    item.status = dto.status;

    if (dto.resolutionNote !== undefined) {
      item.resolutionNote = dto.resolutionNote;
    }

    if (
      dto.status === RequestComplaintStatus.RESOLVED ||
      dto.status === RequestComplaintStatus.REJECTED
    ) {
      item.resolvedById = currentUser.id;
      item.resolvedAt = new Date();
    }

    const updated = await this.requestComplaintRepo.save(item);

    // Notify the sender
    this.sendStatusUpdatedNotification(updated, currentUser).catch((err) =>
      this.logger.warn(`Failed to dispatch status notification: ${err.message}`),
    );

    return this.findOne(updated.id, currentUser);
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 7. ADD COMMENT
  // ═════════════════════════════════════════════════════════════════════════

  async addComment(id: string, dto: AddCommentDto, currentUser: any) {
    // Ensures caller has access to view this request
    const item = await this.findOne(id, currentUser);

    const comment = this.commentRepo.create({
      requestComplaintId: id,
      senderId: currentUser.id,
      message: dto.message.trim(),
      attachments: dto.attachments || [],
    });

    const savedComment = await this.commentRepo.save(comment);

    // Touch updatedAt on parent request
    item.updatedAt = new Date();
    await this.requestComplaintRepo.save(item);

    // Notify other party
    this.sendCommentNotification(item, savedComment, currentUser).catch((err) =>
      this.logger.warn(`Failed to dispatch comment notification: ${err.message}`),
    );

    return this.commentRepo.findOne({
      where: { id: savedComment.id },
      relations: ['sender'],
    });
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 8. STATS / SUMMARY
  // ═════════════════════════════════════════════════════════════════════════

  async getStats(currentUser: any) {
    const schoolId = currentUser.schoolId;

    const qb = this.requestComplaintRepo.createQueryBuilder('rc');

    if (schoolId && currentUser.role !== UserRole.SUPER_ADMIN) {
      qb.andWhere('rc.schoolId = :schoolId', { schoolId });
    }

    if (
      currentUser.role === UserRole.STUDENT ||
      currentUser.role === UserRole.TEACHER
    ) {
      qb.andWhere('(rc.senderId = :myId OR rc.recipientId = :myId)', {
        myId: currentUser.id,
      });
    }

    const records = await qb.select(['rc.id', 'rc.type', 'rc.status', 'rc.priority']).getMany();

    const summary = {
      total: records.length,
      pending: 0,
      inProgress: 0,
      resolved: 0,
      rejected: 0,
      cancelled: 0,
      requests: 0,
      complaints: 0,
      byPriority: {
        low: 0,
        medium: 0,
        high: 0,
        urgent: 0,
      },
    };

    for (const r of records) {
      if (r.status === RequestComplaintStatus.PENDING) summary.pending++;
      else if (r.status === RequestComplaintStatus.IN_PROGRESS) summary.inProgress++;
      else if (r.status === RequestComplaintStatus.RESOLVED) summary.resolved++;
      else if (r.status === RequestComplaintStatus.REJECTED) summary.rejected++;
      else if (r.status === RequestComplaintStatus.CANCELLED) summary.cancelled++;

      if (r.type === RequestComplaintType.REQUEST) summary.requests++;
      else if (r.type === RequestComplaintType.COMPLAINT) summary.complaints++;

      const p = (r.priority || '').toLowerCase();
      if (p === 'low') summary.byPriority.low++;
      else if (p === 'medium') summary.byPriority.medium++;
      else if (p === 'high') summary.byPriority.high++;
      else if (p === 'urgent') summary.byPriority.urgent++;
    }

    return summary;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 9. SOFT DELETE
  // ═════════════════════════════════════════════════════════════════════════

  async remove(id: string, currentUser: any) {
    const item = await this.findOne(id, currentUser);

    const isSuperAdmin = currentUser.role === UserRole.SUPER_ADMIN;
    const isSchoolAdmin =
      currentUser.role === UserRole.ADMIN &&
      (!currentUser.schoolId || currentUser.schoolId === item.schoolId);
    const isSender = item.senderId === currentUser.id;

    if (!isSuperAdmin && !isSchoolAdmin) {
      if (!isSender || item.status !== RequestComplaintStatus.PENDING) {
        throw new ForbiddenException(
          'You can only delete your own pending requests or complaints.',
        );
      }
    }

    await this.requestComplaintRepo.softDelete(id);
    return { success: true, message: 'Request or complaint deleted successfully.' };
  }

  // ═════════════════════════════════════════════════════════════════════════
  // NOTIFICATION DISPATCH HELPERS
  // ═════════════════════════════════════════════════════════════════════════

  private async sendCreatedNotification(
    item: RequestComplaint,
    sender: any,
    recipient: User | null,
  ) {
    if (!this.notificationsService) return;

    const typeLabel =
      item.type === RequestComplaintType.COMPLAINT ? 'Complaint' : 'Request';
    const title = `New ${typeLabel}: ${item.title}`;
    const body = `${sender.name || 'A user'} submitted a new ${typeLabel.toLowerCase()}.`;

    if (recipient) {
      await this.notificationsService.sendToUser(
        recipient.id,
        title,
        body,
        {
          type: 'REQUEST_COMPLAINT',
          id: item.id,
          subType: item.type,
        },
        item.schoolId,
      );
    } else {
      // Notify school admins
      const admins = await this.userRepo.find({
        where: {
          schoolId: item.schoolId,
          role: UserRole.ADMIN,
          isActive: true,
        },
        select: ['id'],
      });

      for (const admin of admins) {
        await this.notificationsService.sendToUser(
          admin.id,
          title,
          body,
          {
            type: 'REQUEST_COMPLAINT',
            id: item.id,
            subType: item.type,
          },
          item.schoolId,
        );
      }
    }
  }

  private async sendStatusUpdatedNotification(
    item: RequestComplaint,
    updater: any,
  ) {
    if (!this.notificationsService || !item.senderId) return;

    // Do not notify self
    if (item.senderId === updater.id) return;

    const typeLabel =
      item.type === RequestComplaintType.COMPLAINT ? 'Complaint' : 'Request';
    const title = `${typeLabel} Status Updated: ${item.status}`;
    const body = `Your ${typeLabel.toLowerCase()} "${item.title}" is now ${item.status}.`;

    await this.notificationsService.sendToUser(
      item.senderId,
      title,
      body,
      {
        type: 'REQUEST_COMPLAINT_STATUS',
        id: item.id,
        status: item.status,
      },
      item.schoolId,
    );
  }

  private async sendCommentNotification(
    item: RequestComplaint,
    comment: RequestComplaintComment,
    commenter: any,
  ) {
    if (!this.notificationsService) return;

    const title = `New Message on ${item.title}`;
    const body = `${commenter.name || 'User'}: ${comment.message.substring(0, 80)}`;

    const notifyTargetId =
      item.senderId === commenter.id ? item.recipientId : item.senderId;

    if (notifyTargetId) {
      await this.notificationsService.sendToUser(
        notifyTargetId,
        title,
        body,
        {
          type: 'REQUEST_COMPLAINT_COMMENT',
          id: item.id,
        },
        item.schoolId,
      );
    }
  }
}
