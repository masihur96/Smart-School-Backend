import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  AcademicCalendarEvent,
  AcademicCalendarCategory,
  TargetAudience,
} from './entities/academic-calendar-event.entity';
import { CreateAcademicCalendarEventDto } from './dto/create-academic-calendar-event.dto';
import { UpdateAcademicCalendarEventDto } from './dto/update-academic-calendar-event.dto';
import { BulkCreateAcademicCalendarDto } from './dto/bulk-create-academic-calendar.dto';
import { FilterAcademicCalendarDto } from './dto/filter-academic-calendar.dto';
import { User, UserRole } from '../users/entities/user.entity';
import { Class } from '../classes/entities/class.entity';

@Injectable()
export class AcademicCalendarService {
  constructor(
    @InjectRepository(AcademicCalendarEvent)
    private readonly calendarRepo: Repository<AcademicCalendarEvent>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Class)
    private readonly classRepo: Repository<Class>,
  ) {}

  /** Default hex color palette based on event category */
  private getDefaultColor(
    category: AcademicCalendarCategory,
    isHoliday: boolean,
  ): string {
    if (isHoliday || category === AcademicCalendarCategory.HOLIDAY) {
      return '#E53935'; // Red
    }
    switch (category) {
      case AcademicCalendarCategory.EXAM:
        return '#1E88E5'; // Blue
      case AcademicCalendarCategory.VACATION:
        return '#FB8C00'; // Orange
      case AcademicCalendarCategory.EVENT:
        return '#43A047'; // Green
      case AcademicCalendarCategory.ACADEMIC:
        return '#8E24AA'; // Purple
      case AcademicCalendarCategory.MEETING:
        return '#00897B'; // Teal
      case AcademicCalendarCategory.SPORTS:
        return '#3949AB'; // Indigo
      case AcademicCalendarCategory.OTHER:
      default:
        return '#5C6BC0'; // Slate Indigo
    }
  }

  /** Resolves raw Calendar records into enriched response objects with class and creator info. */
  private async enrich(records: AcademicCalendarEvent[]): Promise<any[]> {
    if (!records || records.length === 0) return [];

    // Collect referenced class IDs and user IDs
    const classIds = [
      ...new Set(
        records
          .flatMap((r) => (Array.isArray(r.classIds) ? r.classIds : []))
          .filter(Boolean),
      ),
    ];
    const userIds = [
      ...new Set(records.map((r) => r.createdById).filter(Boolean)),
    ] as string[];

    const [classes, users] = await Promise.all([
      classIds.length
        ? this.classRepo.find({
            where: { id: In(classIds) },
            select: ['id', 'name'],
          })
        : [],
      userIds.length
        ? this.userRepo.find({
            where: { id: In(userIds) },
            select: ['id', 'name', 'avatar', 'role'],
          })
        : [],
    ]);

    const classMap = new Map<string, { id: string; name: string }>();
    classes.forEach((c) => classMap.set(c.id, { id: c.id, name: c.name }));

    const userMap = new Map<
      string,
      { id: string; name: string; avatar: string | null; role: string }
    >();
    users.forEach((u) =>
      userMap.set(u.id, {
        id: u.id,
        name: u.name,
        avatar: u.avatar || null,
        role: u.role,
      }),
    );

    return records.map((event) => {
      const assignedClasses = Array.isArray(event.classIds)
        ? event.classIds.map((cid) => classMap.get(cid) || { id: cid, name: null })
        : [];

      return {
        id: event.id,
        schoolId: event.schoolId,
        title: event.title,
        description: event.description || null,
        category: event.category,
        startDate: event.startDate,
        endDate: event.endDate,
        startTime: event.startTime || null,
        endTime: event.endTime || null,
        isAllDay: event.isAllDay,
        isHoliday: event.isHoliday,
        targetAudience: event.targetAudience,
        classIds: event.classIds || [],
        classes: assignedClasses,
        color: event.color || this.getDefaultColor(event.category, event.isHoliday),
        location: event.location || null,
        attachmentUrl: event.attachmentUrl || null,
        academicYear: event.academicYear || null,
        term: event.term || null,
        createdById: event.createdById || null,
        createdBy: event.createdById ? userMap.get(event.createdById) || null : null,
        isActive: event.isActive,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
      };
    });
  }

  /** Helper to validate and parse start & end dates */
  private parseDates(startDateStr: string, endDateStr?: string): { start: Date; end: Date } {
    const start = new Date(startDateStr);
    if (isNaN(start.getTime())) {
      throw new BadRequestException(`Invalid startDate format: ${startDateStr}`);
    }

    let end: Date;
    if (endDateStr) {
      end = new Date(endDateStr);
      if (isNaN(end.getTime())) {
        throw new BadRequestException(`Invalid endDate format: ${endDateStr}`);
      }
      if (end < start) {
        throw new BadRequestException('endDate cannot be earlier than startDate');
      }
    } else {
      end = new Date(start);
    }

    return { start, end };
  }

  /** Create a new academic calendar event (Admin/SuperAdmin) */
  async create(
    dto: CreateAcademicCalendarEventDto,
    schoolId: string,
    createdById?: string,
  ): Promise<any> {
    try {
      if (!schoolId) {
        throw new BadRequestException('schoolId is required to create a calendar event');
      }

      const { start, end } = this.parseDates(dto.startDate, dto.endDate);
      const isHoliday =
        dto.isHoliday ?? (dto.category === AcademicCalendarCategory.HOLIDAY);
      const category =
        dto.category ||
        (isHoliday ? AcademicCalendarCategory.HOLIDAY : AcademicCalendarCategory.EVENT);
      const color =
        dto.color || this.getDefaultColor(category, isHoliday);

      const newEvent = this.calendarRepo.create({
        schoolId,
        title: dto.title,
        description: dto.description,
        category,
        startDate: start,
        endDate: end,
        startTime: dto.startTime,
        endTime: dto.endTime,
        isAllDay: dto.isAllDay ?? true,
        isHoliday,
        targetAudience: dto.targetAudience || TargetAudience.ALL,
        classIds: dto.classIds || [],
        color,
        location: dto.location,
        attachmentUrl: dto.attachmentUrl,
        academicYear: dto.academicYear,
        term: dto.term,
        createdById,
        isActive: true,
      });

      const saved = await this.calendarRepo.save(newEvent);
      const [enriched] = await this.enrich([saved]);
      return enriched;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error creating academic calendar event:', error);
      throw new InternalServerErrorException(
        `Failed to create academic calendar event: ${error.message || error}`,
      );
    }
  }

  /** Bulk create events (Admin/SuperAdmin - e.g. annual calendar import) */
  async bulkCreate(
    dto: BulkCreateAcademicCalendarDto,
    schoolId: string,
    createdById?: string,
  ): Promise<any> {
    try {
      if (!schoolId) {
        throw new BadRequestException('schoolId is required for bulk creation');
      }

      const entities: AcademicCalendarEvent[] = [];

      for (const item of dto.events) {
        const { start, end } = this.parseDates(item.startDate, item.endDate);
        const isHoliday =
          item.isHoliday ?? (item.category === AcademicCalendarCategory.HOLIDAY);
        const category =
          item.category ||
          (isHoliday ? AcademicCalendarCategory.HOLIDAY : AcademicCalendarCategory.EVENT);
        const color =
          item.color || this.getDefaultColor(category, isHoliday);

        entities.push(
          this.calendarRepo.create({
            schoolId,
            title: item.title,
            description: item.description,
            category,
            startDate: start,
            endDate: end,
            startTime: item.startTime,
            endTime: item.endTime,
            isAllDay: item.isAllDay ?? true,
            isHoliday,
            targetAudience: item.targetAudience || TargetAudience.ALL,
            classIds: item.classIds || [],
            color,
            location: item.location,
            attachmentUrl: item.attachmentUrl,
            academicYear: item.academicYear,
            term: item.term,
            createdById,
            isActive: true,
          }),
        );
      }

      const saved = await this.calendarRepo.save(entities);
      return {
        count: saved.length,
        message: `Successfully created ${saved.length} calendar events`,
        events: await this.enrich(saved),
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error bulk creating academic calendar events:', error);
      throw new InternalServerErrorException(
        `Failed to bulk create academic calendar events: ${error.message || error}`,
      );
    }
  }

  /** Find all events with filtering and role context */
  async findAll(filters: FilterAcademicCalendarDto, user: any): Promise<any[]> {
    const schoolId =
      user.role === UserRole.SUPER_ADMIN && filters.schoolId
        ? filters.schoolId
        : user.schoolId;

    if (!schoolId && user.role !== UserRole.SUPER_ADMIN) {
      return [];
    }

    const qb = this.calendarRepo.createQueryBuilder('event');

    if (schoolId) {
      qb.where('event.schoolId = :schoolId', { schoolId });
    } else {
      qb.where('1=1');
    }

    qb.andWhere('event.isActive = :isActive', { isActive: true });

    // Role-based Audience and Class filtering
    if (user.role === UserRole.STUDENT) {
      // Students see ALL + STUDENTS target audience
      qb.andWhere('event.targetAudience IN (:...studentAudiences)', {
        studentAudiences: [TargetAudience.ALL, TargetAudience.STUDENTS],
      });

      // Filter by student's enrolled classes if available
      let studentClassIds: string[] = user.classIds || [];
      if ((!studentClassIds || studentClassIds.length === 0) && user.id) {
        const studentUser = await this.userRepo.findOne({
          where: { id: user.id },
          select: ['id', 'classIds'],
        });
        if (studentUser?.classIds) {
          studentClassIds = studentUser.classIds;
        }
      }

      if (studentClassIds.length > 0) {
        // Event applies if classIds is empty/null (school-wide) OR contains any of the student's classes
        const classConditions = studentClassIds
          .map((cid, idx) => `event.classIds LIKE :cId${idx}`)
          .join(' OR ');
        const classParams: Record<string, string> = {};
        studentClassIds.forEach((cid, idx) => {
          classParams[`cId${idx}`] = `%${cid}%`;
        });

        qb.andWhere(
          `(event.classIds IS NULL OR event.classIds = '' OR ${classConditions})`,
          classParams,
        );
      } else {
        qb.andWhere("(event.classIds IS NULL OR event.classIds = '')");
      }
    } else if (user.role === UserRole.TEACHER) {
      // Teachers see ALL + TEACHERS target audience
      qb.andWhere('event.targetAudience IN (:...teacherAudiences)', {
        teacherAudiences: [TargetAudience.ALL, TargetAudience.TEACHERS],
      });

      if (filters.classId) {
        qb.andWhere(
          `(event.classIds IS NULL OR event.classIds = '' OR event.classIds LIKE :filterClassId)`,
          { filterClassId: `%${filters.classId}%` },
        );
      }
    } else if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
      if (filters.targetAudience) {
        qb.andWhere('event.targetAudience = :targetAudience', {
          targetAudience: filters.targetAudience,
        });
      }
      if (filters.classId) {
        qb.andWhere(
          `(event.classIds IS NULL OR event.classIds = '' OR event.classIds LIKE :filterClassId)`,
          { filterClassId: `%${filters.classId}%` },
        );
      }
    }

    // Date range & Month/Year filtering
    if (filters.year && filters.month) {
      const year = Number(filters.year);
      const month = Number(filters.month);
      const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
      const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
      qb.andWhere(
        'event.startDate <= :endOfMonth AND event.endDate >= :startOfMonth',
        { startOfMonth, endOfMonth },
      );
    } else if (filters.year) {
      const year = Number(filters.year);
      const startOfYear = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
      const endOfYear = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
      qb.andWhere(
        'event.startDate <= :endOfYear AND event.endDate >= :startOfYear',
        { startOfYear, endOfYear },
      );
    } else if (filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      qb.andWhere('event.startDate <= :end AND event.endDate >= :start', {
        start,
        end,
      });
    } else if (filters.startDate) {
      const start = new Date(filters.startDate);
      qb.andWhere('event.endDate >= :start', { start });
    } else if (filters.endDate) {
      const end = new Date(filters.endDate);
      qb.andWhere('event.startDate <= :end', { end });
    }

    // Category filter
    if (filters.category) {
      qb.andWhere('event.category = :category', { category: filters.category });
    }

    // Holiday filter
    if (filters.isHoliday !== undefined) {
      qb.andWhere('event.isHoliday = :isHoliday', {
        isHoliday: filters.isHoliday,
      });
    }

    // Academic year filter
    if (filters.academicYear) {
      qb.andWhere('event.academicYear = :academicYear', {
        academicYear: filters.academicYear,
      });
    }

    // Term filter
    if (filters.term) {
      qb.andWhere('event.term = :term', { term: filters.term });
    }

    // Order
    qb.orderBy('event.startDate', 'ASC').addOrderBy('event.startTime', 'ASC');

    const records = await qb.getMany();
    return this.enrich(records);
  }

  /** Find single event by ID */
  async findOne(id: string, user: any): Promise<any> {
    const schoolId =
      user.role === UserRole.SUPER_ADMIN ? null : user.schoolId;

    const query: any = { id };
    if (schoolId) {
      query.schoolId = schoolId;
    }

    const event = await this.calendarRepo.findOne({ where: query });
    if (!event) {
      throw new NotFoundException(`Calendar event with ID ${id} not found`);
    }

    const [enriched] = await this.enrich([event]);
    return enriched;
  }

  /** Update an existing academic calendar event */
  async update(
    id: string,
    dto: UpdateAcademicCalendarEventDto,
    user: any,
  ): Promise<any> {
    const schoolId =
      user.role === UserRole.SUPER_ADMIN ? null : user.schoolId;

    const query: any = { id };
    if (schoolId) {
      query.schoolId = schoolId;
    }

    const event = await this.calendarRepo.findOne({ where: query });
    if (!event) {
      throw new NotFoundException(`Calendar event with ID ${id} not found`);
    }

    if (dto.startDate || dto.endDate) {
      const startStr = dto.startDate || event.startDate.toISOString();
      const endStr = dto.endDate || event.endDate.toISOString();
      const { start, end } = this.parseDates(startStr, endStr);
      event.startDate = start;
      event.endDate = end;
    }

    if (dto.title !== undefined) event.title = dto.title;
    if (dto.description !== undefined) event.description = dto.description;
    if (dto.category !== undefined) event.category = dto.category;
    if (dto.startTime !== undefined) event.startTime = dto.startTime;
    if (dto.endTime !== undefined) event.endTime = dto.endTime;
    if (dto.isAllDay !== undefined) event.isAllDay = dto.isAllDay;
    if (dto.isHoliday !== undefined) event.isHoliday = dto.isHoliday;
    if (dto.targetAudience !== undefined) event.targetAudience = dto.targetAudience;
    if (dto.classIds !== undefined) event.classIds = dto.classIds;
    if (dto.color !== undefined) {
      event.color = dto.color;
    } else if (dto.category !== undefined || dto.isHoliday !== undefined) {
      event.color = this.getDefaultColor(event.category, event.isHoliday);
    }
    if (dto.location !== undefined) event.location = dto.location;
    if (dto.attachmentUrl !== undefined) event.attachmentUrl = dto.attachmentUrl;
    if (dto.academicYear !== undefined) event.academicYear = dto.academicYear;
    if (dto.term !== undefined) event.term = dto.term;
    if (dto.isActive !== undefined) event.isActive = dto.isActive;

    const updated = await this.calendarRepo.save(event);
    const [enriched] = await this.enrich([updated]);
    return enriched;
  }

  /** Remove / Soft-delete an academic calendar event */
  async remove(id: string, user: any): Promise<{ message: string; id: string }> {
    const schoolId =
      user.role === UserRole.SUPER_ADMIN ? null : user.schoolId;

    const query: any = { id };
    if (schoolId) {
      query.schoolId = schoolId;
    }

    const event = await this.calendarRepo.findOne({ where: query });
    if (!event) {
      throw new NotFoundException(`Calendar event with ID ${id} not found`);
    }

    await this.calendarRepo.softRemove(event);
    return {
      message: 'Academic calendar event successfully deleted',
      id,
    };
  }

  /** Get upcoming events for a role (today onwards) */
  async getUpcomingEvents(user: any, limit = 10): Promise<any[]> {
    const schoolId = user.schoolId;
    if (!schoolId && user.role !== UserRole.SUPER_ADMIN) return [];

    const now = new Date();
    // Start from beginning of today in UTC
    const startOfToday = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0),
    );

    const qb = this.calendarRepo.createQueryBuilder('event');
    if (schoolId) {
      qb.where('event.schoolId = :schoolId', { schoolId });
    } else {
      qb.where('1=1');
    }

    qb.andWhere('event.isActive = :isActive', { isActive: true })
      .andWhere('event.endDate >= :startOfToday', { startOfToday });

    if (user.role === UserRole.STUDENT) {
      qb.andWhere('event.targetAudience IN (:...audiences)', {
        audiences: [TargetAudience.ALL, TargetAudience.STUDENTS],
      });
      const studentClassIds = user.classIds || [];
      if (studentClassIds.length > 0) {
        const classConditions = studentClassIds
          .map((cid, idx) => `event.classIds LIKE :cId${idx}`)
          .join(' OR ');
        const classParams: Record<string, string> = {};
        studentClassIds.forEach((cid, idx) => {
          classParams[`cId${idx}`] = `%${cid}%`;
        });
        qb.andWhere(
          `(event.classIds IS NULL OR event.classIds = '' OR ${classConditions})`,
          classParams,
        );
      } else {
        qb.andWhere("(event.classIds IS NULL OR event.classIds = '')");
      }
    } else if (user.role === UserRole.TEACHER) {
      qb.andWhere('event.targetAudience IN (:...audiences)', {
        audiences: [TargetAudience.ALL, TargetAudience.TEACHERS],
      });
    }

    qb.orderBy('event.startDate', 'ASC')
      .addOrderBy('event.startTime', 'ASC')
      .limit(limit);

    const records = await qb.getMany();
    return this.enrich(records);
  }

  /** Get holidays list for current school */
  async getHolidays(user: any, year?: number, academicYear?: string): Promise<any[]> {
    const filters: FilterAcademicCalendarDto = {
      isHoliday: true,
      year,
      academicYear,
    };
    return this.findAll(filters, user);
  }

  /** Get calendar summary statistics (total events, holidays, exam periods, etc.) */
  async getSummary(
    schoolId: string,
    academicYear?: string,
    year?: number,
  ): Promise<any> {
    if (!schoolId) {
      throw new BadRequestException('schoolId is required to generate calendar summary');
    }

    const qb = this.calendarRepo.createQueryBuilder('event')
      .where('event.schoolId = :schoolId', { schoolId })
      .andWhere('event.isActive = :isActive', { isActive: true });

    if (academicYear) {
      qb.andWhere('event.academicYear = :academicYear', { academicYear });
    }

    if (year) {
      const startOfYear = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
      const endOfYear = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
      qb.andWhere('event.startDate <= :endOfYear AND event.endDate >= :startOfYear', {
        startOfYear,
        endOfYear,
      });
    }

    const events = await qb.getMany();

    const now = new Date();
    const startOfToday = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0),
    );

    const totalEvents = events.length;
    let totalHolidays = 0;
    let totalExams = 0;
    let totalVacations = 0;
    let upcomingEventsCount = 0;
    const categoryBreakdown: Record<string, number> = {};

    for (const event of events) {
      // Category count
      categoryBreakdown[event.category] = (categoryBreakdown[event.category] || 0) + 1;

      if (event.isHoliday || event.category === AcademicCalendarCategory.HOLIDAY) {
        totalHolidays++;
      }
      if (event.category === AcademicCalendarCategory.EXAM) {
        totalExams++;
      }
      if (event.category === AcademicCalendarCategory.VACATION) {
        totalVacations++;
      }
      if (new Date(event.endDate) >= startOfToday) {
        upcomingEventsCount++;
      }
    }

    return {
      schoolId,
      academicYear: academicYear || null,
      year: year || null,
      totalEvents,
      totalHolidays,
      totalExams,
      totalVacations,
      upcomingEventsCount,
      categoryBreakdown,
    };
  }
}
