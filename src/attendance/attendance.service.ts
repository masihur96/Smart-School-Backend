import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance, AttendanceStatus } from './entities/attendance.entity';
import {
  PeriodAttendance,
  PeriodAttendanceStatus,
} from './entities/period-attendance.entity';
import { SubmitAttendanceDto } from './dto/submit-attendance.dto';
import {
  SubmitPeriodAttendanceDto,
} from './dto/submit-period-attendance.dto';
import {
  PeriodAttendanceQueryDto,
  DailyPeriodReportDto,
  MonthlyPeriodOverviewResponseDto,
  StudentAttendanceAnalyticsDto,
} from './dto/period-attendance-query.dto';
import {
  AttendanceOverviewQueryDto,
  AttendanceOverviewResponseDto,
  AttendanceSummaryDto,
  MonthlyAttendanceOverviewQueryDto,
  MonthlyAttendanceOverviewResponseDto,
} from './dto/attendance-overview.dto';
import { UsersService } from '../users/users.service';
import { ClassesService } from '../classes/classes.service';
import { SectionsService } from '../sections/sections.service';
import { User, UserRole } from '../users/entities/user.entity';
import { TeacherAttendance } from './entities/teacher-attendance.entity';
import { SubmitTeacherAttendanceDto } from './dto/submit-teacher-attendance.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { formatReadableDate } from '../common/utils/date.util';
import { Routine } from '../general/entities/routine.entity';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    @InjectRepository(TeacherAttendance)
    private teacherAttendanceRepository: Repository<TeacherAttendance>,
    @InjectRepository(PeriodAttendance)
    private periodAttendanceRepository: Repository<PeriodAttendance>,
    @InjectRepository(Routine)
    private routineRepository: Repository<Routine>,
    private usersService: UsersService,
    private classesService: ClassesService,
    private sectionsService: SectionsService,
    private notificationsService: NotificationsService,
  ) { }

  private getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; // metres
    const φ1 = (lat1 * Math.PI) / 180; // φ, λ in radians
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const d = R * c; // in metres
    return d;
  }

  private normalizeDate(date: string | Date): string {
    if (date instanceof Date) {
      // Use local date parts to respect server timezone (avoids UTC off-by-one).
      // Ensure TZ=Asia/Dhaka is set in your server environment.
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    const dateStr = date;
    // If it's already YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    // If it's DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      const [day, month, year] = dateStr.split('/');
      return `${year}-${month}-${day}`;
    }
    // Fallback to JS Date parsing if possible
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
    } catch (e) {
      this.logger.warn(`Failed to normalize date: ${dateStr}`);
    }
    return dateStr;
  }

  async submitAttendance(data: SubmitAttendanceDto) {
    const results: Attendance[] = [];

    // Resolve the real schoolId — use DTO value or look it up from the class
    let resolvedSchoolId = data.schoolId;
    if (!resolvedSchoolId) {
      const classEntity = await this.classesService.findById(data.classId);
      resolvedSchoolId = classEntity?.schoolId || '';
    }

    for (const record of data.records) {
      // Check if attendance already exists for this student on this date and class
      let attendance = await this.attendanceRepository.findOne({
        where: {
          studentId: record.studentId,
          classId: data.classId,
          date: this.normalizeDate(data.date) as any,
        },
      });

      if (attendance) {
        // Update existing record
        attendance.status = record.status;
        attendance.takenBy = data.takenBy;
        if (resolvedSchoolId) attendance.schoolId = resolvedSchoolId;
      } else {
        // Create new record
        attendance = this.attendanceRepository.create({
          ...record,
          date: this.normalizeDate(data.date) as any,
          takenBy: data.takenBy,
          classId: data.classId,
          schoolId: resolvedSchoolId,
        });
      }

      const savedAttendance = await this.attendanceRepository.save(attendance);
      results.push(savedAttendance);

      // Notification logic for absence
      if (record.status === AttendanceStatus.ABSENT) {
        this.notificationsService.sendToUser(
          record.studentId,
          '⚠️ Absence Alert',
          `You have been marked ABSENT for ${formatReadableDate(data.date)}.`,
          {
            type: 'ATTENDANCE_ABSENT',
            date: data.date.toISOString().split('T')[0],
          },
        );
      }
    }

    return results;
  }

  async getAttendance(classId: string, date?: string) {
    const query = this.attendanceRepository
      .createQueryBuilder('attendance')
      .where('attendance.classId = :classId', { classId });

    if (date) {
      const normalizedDate = this.normalizeDate(date);
      query.andWhere('attendance.date = :date', { date: normalizedDate });
    }

    return await query.getMany();
  }

  async getStudentAttendance(studentId: string) {
    return await this.periodAttendanceRepository.find({
      where: { studentId },
      relations: ['class', 'section', 'subject', 'teacher', 'routine'],
      order: { date: 'DESC', createdAt: 'DESC' },
    });
  }

  async getAttendanceOverview(
    query: AttendanceOverviewQueryDto,
  ): Promise<AttendanceOverviewResponseDto> {
    try {
      const year = parseInt(
        query.year || new Date().getFullYear().toString(),
        10,
      );
      const month = parseInt(
        query.month || (new Date().getMonth() + 1).toString(),
        10,
      );

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 1);

      const qb = this.attendanceRepository
        .createQueryBuilder('attendance')
        .leftJoin(User, 'student', 'attendance.studentId = student.id::text')
        .select('attendance.classId', 'classId')
        .addSelect('COUNT(*)', 'totalRecords')
        .addSelect(
          `SUM(CASE WHEN attendance.status::text = :presentStatus THEN 1 ELSE 0 END)`,
          'totalPresent',
        )
        .addSelect(
          `SUM(CASE WHEN attendance.status::text = :absentStatus THEN 1 ELSE 0 END)`,
          'totalAbsent',
        )
        .addSelect(
          `SUM(CASE WHEN attendance.status::text = :leaveStatus THEN 1 ELSE 0 END)`,
          'totalLeave',
        )
        .addSelect(
          `SUM(CASE WHEN attendance.status::text = :lateStatus THEN 1 ELSE 0 END)`,
          'totalLate',
        )
        .where('attendance.date >= :startDate', { startDate })
        .andWhere('attendance.date < :endDate', { endDate })
        .setParameters({
          startDate,
          endDate,
          presentStatus: AttendanceStatus.PRESENT,
          absentStatus: AttendanceStatus.ABSENT,
          leaveStatus: AttendanceStatus.LEAVE,
          lateStatus: AttendanceStatus.LATE,
        });

      if (query.classId) {
        qb.andWhere('attendance.classId = :classId', {
          classId: query.classId,
        });
      }

      if (query.sectionId) {
        qb.andWhere('student.sectionIds LIKE :sectionId', {
          sectionId: `%${query.sectionId}%`,
        });
      }

      if (query.schoolId) {
        qb.andWhere('attendance.schoolId = :schoolId', {
          schoolId: query.schoolId,
        });
      }

      const rawResults = await qb
        .groupBy('attendance.classId')
        .getRawMany();

      // Get all classes and sections to map names
      const classes = await this.classesService.findAll();
      const sections = await this.sectionsService.findAll();

      const classMap = new Map(classes.map((c) => [c.id, c.name]));
      const sectionMap = new Map(sections.map((s) => [s.id, s.name]));

      const data: AttendanceSummaryDto[] = rawResults.map((res: any) => {
        const totalRecords = parseInt(res.totalRecords, 10);
        const totalPresent = parseInt(res.totalPresent, 10);
        const totalAbsent = parseInt(res.totalAbsent, 10);
        const totalLeave = parseInt(res.totalLeave, 10);
        const totalLate = parseInt(res.totalLate, 10);

        return {
          classId: res.classId,
          className: classMap.get(res.classId) || 'Unknown Class',
          totalPresent,
          totalAbsent,
          totalLeave,
          totalLate,
          totalRecords,
          attendancePercentage:
            totalRecords > 0
              ? parseFloat(((totalPresent / totalRecords) * 100).toFixed(2))
              : 0,
        };
      });

      // Filter by class/section if needed (though the query already did it, but good to ensure consistency)
      // Actually, the aggregation might return only rows with data.
      // If we want to include all classes even with 0 records, we'd need more logic.
      // But for a dashboard overview, showing only active ones is often fine.

      const grandTotalPresent = data.reduce(
        (sum, item) => sum + item.totalPresent,
        0,
      );
      const grandTotalAbsent = data.reduce(
        (sum, item) => sum + item.totalAbsent,
        0,
      );
      const grandTotalLeave = data.reduce(
        (sum, item) => sum + item.totalLeave,
        0,
      );
      const grandTotalLate = data.reduce(
        (sum, item) => sum + item.totalLate,
        0,
      );
      const grandTotalRecords = data.reduce(
        (sum, item) => sum + item.totalRecords,
        0,
      );

      const overallAttendancePercentage =
        grandTotalRecords > 0
          ? parseFloat(
            ((grandTotalPresent / grandTotalRecords) * 100).toFixed(2),
          )
          : 0;

      return {
        year,
        month,
        data,
        grandTotalPresent,
        grandTotalAbsent,
        grandTotalLeave,
        grandTotalLate,
        overallAttendancePercentage,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : '';
      this.logger.error(
        `Error getting attendance overview: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  async getMonthlyAttendanceOverview(
    query: MonthlyAttendanceOverviewQueryDto,
  ): Promise<MonthlyAttendanceOverviewResponseDto> {
    const year = parseInt(
      query.year || new Date().getFullYear().toString(),
      10,
    );
    const monthlyData = [];

    for (let month = 1; month <= 12; month++) {
      const overview = await this.getAttendanceOverview({
        year: year.toString(),
        month: month.toString(),
        classId: query.classId,
        sectionId: query.sectionId,
      });

      monthlyData.push({
        month,
        totalPresent: overview.grandTotalPresent,
        totalAbsent: overview.grandTotalAbsent,
        totalLeave: overview.grandTotalLeave,
        totalLate: overview.grandTotalLate,
        attendancePercentage: overview.overallAttendancePercentage,
      });
    }

    return {
      year,
      data: monthlyData,
    };
  }

  // Teacher Attendance
  async submitTeacherAttendance(
    teacherId: string,
    data: SubmitTeacherAttendanceDto,
  ) {
    const teacher = await this.usersService.findById(teacherId);
    if (!teacher || teacher.role !== UserRole.TEACHER) {
      throw new NotFoundException('Teacher not found');
    }

    if (!teacher.lat || !teacher.lon) {
      throw new BadRequestException(
        'Teacher location not set. Please contact admin.',
      );
    }

    const distance = this.getDistance(
      data.lat,
      data.lon,
      Number(teacher.lat),
      Number(teacher.lon),
    );
    const radius = teacher.radius || 100; // default 100m

    if (distance > radius) {
      throw new BadRequestException(
        `You are out of range. Distance: ${distance.toFixed(
          2,
        )}m, Allowed Radius: ${radius}m`,
      );
    }

    const today = this.normalizeDate(new Date());
    const currentTime = new Date();

    let attendance = await this.teacherAttendanceRepository.findOne({
      where: {
        teacherId,
        date: today as any,
      },
    });

    if (attendance) {
      // Update existing record
      if (attendance.status === 'clock-in') {
        // First re-submission after clock-in: mark as clock-out and record end time
        attendance.status = 'clock-out';
        attendance.endTime = currentTime;
      } else {
        // Already clocked-out: only update endTime, preserve original startTime
        attendance.endTime = currentTime;
      }
      attendance.time = currentTime;
      attendance.lat = data.lat;
      attendance.lon = data.lon;
      attendance.distanceFromCenter = distance;
    } else {
      // Create new record for today
      attendance = this.teacherAttendanceRepository.create({
        teacherId,
        schoolId: teacher.schoolId,
        lat: data.lat,
        lon: data.lon,
        distanceFromCenter: distance,
        date: today as any,
        time: currentTime,
        status: 'clock-in',
        startTime: currentTime,
      });
    }

    return await this.teacherAttendanceRepository.save(attendance);
  }

  async getTeacherAttendance(
    schoolId?: string,
    teacherId?: string,
    date?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const query = this.teacherAttendanceRepository
      .createQueryBuilder('ta')
      .leftJoinAndSelect('ta.teacher', 'teacher');

    if (schoolId) {
      query.andWhere('ta.schoolId = :schoolId', { schoolId });
    }

    if (teacherId) {
      query.andWhere('ta.teacherId = :teacherId', { teacherId });
    }

    if (date) {
      const normalizedDate = this.normalizeDate(date);
      query.andWhere('ta.date = :date', { date: normalizedDate });
    } else {
      if (startDate) {
        const normalizedStart = this.normalizeDate(startDate);
        query.andWhere('ta.date >= :startDate', { startDate: normalizedStart });
      }
      if (endDate) {
        const normalizedEnd = this.normalizeDate(endDate);
        query.andWhere('ta.date <= :endDate', { endDate: normalizedEnd });
      }
    }

    query.orderBy('ta.date', 'DESC').addOrderBy('ta.time', 'DESC');

    return await query.getMany();
  }

  async deleteTeacherAttendance(id: string) {
    return await this.teacherAttendanceRepository.softDelete(id);
  }

  async deletePeriodAttendance(id: string) {
    return await this.periodAttendanceRepository.softDelete(id);
  }

  // ─────────────────────────────────────────────────────────────
  // PERIOD / ROUTINE-BASED ATTENDANCE
  // ─────────────────────────────────────────────────────────────

  /**
   * Teacher submits attendance for one of their assigned periods.
   * teacherId comes from the JWT — we verify routine ownership here.
   */
  async submitPeriodAttendance(
    teacherId: string,
    dto: SubmitPeriodAttendanceDto,
  ): Promise<PeriodAttendance[]> {
    const routine = await this.routineRepository
      .createQueryBuilder('routine')
      .where('routine.id = :id::uuid', { id: dto.routineId })
      .getOne();

    if (!routine) {
      throw new NotFoundException(`Routine ${dto.routineId} not found`);
    }

    if (routine.teacherId !== teacherId) {
      throw new ForbiddenException(
        'You are not assigned to this period/routine',
      );
    }

    return this._upsertPeriodRecords(dto, routine, teacherId);
  }

  /**
   * Admin submits attendance for any period — no ownership check.
   * teacherId is resolved from the routine itself.
   */
  async adminSubmitPeriodAttendance(
    dto: SubmitPeriodAttendanceDto,
  ): Promise<PeriodAttendance[]> {
    const routine = await this.routineRepository
      .createQueryBuilder('routine')
      .where('routine.id = :id::uuid', { id: dto.routineId })
      .getOne();

    if (!routine) {
      throw new NotFoundException(`Routine ${dto.routineId} not found`);
    }

    return this._upsertPeriodRecords(dto, routine, routine.teacherId);
  }

  /** Shared upsert logic for both teacher and admin submission paths */
  private async _upsertPeriodRecords(
    dto: SubmitPeriodAttendanceDto,
    routine: Routine,
    submittingTeacherId: string,
  ): Promise<PeriodAttendance[]> {
    const normalizedDate = this.normalizeDate(dto.date);

    // Batch-load student names to avoid N+1
    const studentIds = dto.records.map((r) => r.studentId);
    const students = await this.usersService.findByIds(studentIds);
    const studentMap = new Map(
      students.map((s) => [s.id, { name: s.name, rollNumber: s.rollNumber }]),
    );

    // Set of valid student IDs to avoid foreign key violations
    const validStudentIds = new Set(students.map((s) => s.id));

    const results: PeriodAttendance[] = [];

    // Helper to ensure UUID strings are valid or null (converts empty string to null)
    const toUuid = (id: any) => (id && id !== '' && id !== 'null' ? id : null);

    for (const record of dto.records) {
      // 1. Skip if student doesn't exist to avoid FK violation (500 error)
      if (!validStudentIds.has(record.studentId)) {
        this.logger.warn(
          `Skipping attendance for student ${record.studentId} - not found in database.`,
        );
        continue;
      }

      const studentInfo = studentMap.get(record.studentId);

      // 2. Upsert: one record per (routineId + studentId + date)
      // Use QueryBuilder with explicit casting for Postgres UUID compatibility
      let pa = await this.periodAttendanceRepository
        .createQueryBuilder('pa')
        .where('pa.routineId = :routineId::uuid', { routineId: dto.routineId })
        .andWhere('pa.studentId = :studentId::uuid', {
          studentId: record.studentId,
        })
        .andWhere('pa.date = :date', { date: normalizedDate })
        .getOne();

      if (pa) {
        pa.status = record.status;
        pa.teacherId = toUuid(submittingTeacherId);
      } else {
        pa = this.periodAttendanceRepository.create({
          routineId: dto.routineId,
          studentId: record.studentId,
          studentName: studentInfo?.name ?? null,
          classId: toUuid(routine.classId),
          // Convert empty strings to null for UUID columns to avoid 500 errors
          sectionId: toUuid(routine.sectionId),
          subjectId: toUuid(routine.subjectId),
          teacherId: toUuid(submittingTeacherId),
          date: normalizedDate,
          status: record.status,
          schoolId: routine.schoolId,
        });
      }

      let saved;
      try {
        saved = await this.periodAttendanceRepository.save(pa);
        results.push(saved);
      } catch (dbError) {
        this.logger.error(
          `Critical: Failed to save period attendance for student ${record.studentId}: ${dbError.message}`,
          dbError.stack,
        );
        // Continue to next record instead of crashing the whole batch
        continue;
      }

      // 3. Push absence notification (await to prevent unhandled rejection/race conditions)
      if (record.status === PeriodAttendanceStatus.ABSENT) {
        try {
          await this.notificationsService.sendToUser(
            record.studentId,
            '⚠️ Absence Alert',
            `You were marked ABSENT for a class on ${normalizedDate}.`,
            { type: 'PERIOD_ATTENDANCE_ABSENT', date: normalizedDate },
            routine.schoolId,
          );
        } catch (error) {
          this.logger.error(
            `Failed to send absence notification for student ${record.studentId}`,
          );
          // Don't throw here, we want to finish the loop
        }
      }
    }

    return results;
  }

  /**
   * Paginated, multi-filter query across period_attendance.
   * Supports: studentName (ILIKE), studentId, classId, sectionId,
   * subjectId, teacherId, routineId, date, dateRange, status.
   */
  async getPeriodAttendance(query: PeriodAttendanceQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 50, 200);
    const skip = (page - 1) * limit;

    const qb = this.periodAttendanceRepository
      .createQueryBuilder('pa')
      .leftJoinAndSelect('pa.student', 'student')
      .leftJoinAndSelect('pa.class', 'class')
      .leftJoinAndSelect('pa.section', 'section')
      .leftJoinAndSelect('pa.subject', 'subject')
      .leftJoinAndSelect('pa.teacher', 'teacher')
      .leftJoinAndSelect('pa.routine', 'routine')
      .where('pa.deletedAt IS NULL');

    if (query.studentName) {
      qb.andWhere('pa.studentName ILIKE :studentName', {
        studentName: `%${query.studentName}%`,
      });
    }
    if (query.studentId) {
      qb.andWhere('pa.studentId = :studentId', { studentId: query.studentId });
    }
    if (query.classId) {
      qb.andWhere('pa.classId = :classId', { classId: query.classId });
    }
    if (query.sectionId) {
      qb.andWhere('pa.sectionId = :sectionId', { sectionId: query.sectionId });
    }
    if (query.subjectId) {
      qb.andWhere('pa.subjectId = :subjectId', { subjectId: query.subjectId });
    }
    if (query.teacherId) {
      qb.andWhere('pa.teacherId = :teacherId', { teacherId: query.teacherId });
    }
    if (query.routineId) {
      qb.andWhere('pa.routineId = :routineId', { routineId: query.routineId });
    }
    if (query.status) {
      qb.andWhere('pa.status = :status', { status: query.status });
    }
    if (query.date) {
      qb.andWhere('pa.date = :date', {
        date: this.normalizeDate(query.date),
      });
    } else {
      if (query.startDate) {
        qb.andWhere('pa.date >= :startDate', {
          startDate: this.normalizeDate(query.startDate),
        });
      }
      if (query.endDate) {
        qb.andWhere('pa.date <= :endDate', {
          endDate: this.normalizeDate(query.endDate),
        });
      }
    }

    if (query.schoolId) {
      qb.andWhere('pa.schoolId = :schoolId', { schoolId: query.schoolId });
    }

    qb.orderBy('pa.date', 'DESC')
      .addOrderBy('routine.startTime', 'ASC')
      .skip(skip)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Daily period-by-period attendance report.
   * Returns an array of periods (routines) each with their student records.
   */
  async getDailyAttendanceReport(
    date: string,
    classId?: string,
    sectionId?: string,
    schoolId?: string,
  ): Promise<DailyPeriodReportDto[]> {
    const normalizedDate = this.normalizeDate(date);

    const qb = this.periodAttendanceRepository
      .createQueryBuilder('pa')
      .leftJoinAndSelect('pa.routine', 'routine')
      .leftJoinAndSelect('pa.subject', 'subject')
      .leftJoinAndSelect('pa.teacher', 'teacher')
      .leftJoinAndSelect('pa.student', 'student')
      .where('pa.date = :date', { date: normalizedDate })
      .andWhere('pa.deletedAt IS NULL');

    if (classId) {
      qb.andWhere('pa.classId = :classId', { classId });
    }
    if (sectionId) {
      qb.andWhere('pa.sectionId = :sectionId', { sectionId });
    }
    if (schoolId) {
      qb.andWhere('pa.schoolId = :schoolId', { schoolId });
    }

    qb.orderBy('routine.startTime', 'ASC');

    const records = await qb.getMany();

    // Group by routineId
    const periodMap = new Map<string, DailyPeriodReportDto>();
    for (const rec of records) {
      if (!periodMap.has(rec.routineId)) {
        periodMap.set(rec.routineId, {
          routineId: rec.routineId,
          subjectName: rec.subject?.name ?? 'Unknown',
          teacherName: rec.teacher?.name ?? 'Unknown',
          startTime: rec.routine?.startTime ?? '',
          endTime: rec.routine?.endTime ?? '',
          records: [],
        });
      }
      periodMap.get(rec.routineId).records.push({
        studentId: rec.studentId,
        studentName: rec.studentName ?? rec.student?.name ?? '',
        rollNumber: rec.student?.rollNumber ?? '',
        status: rec.status,
      });
    }

    return Array.from(periodMap.values());
  }

  /**
   * Monthly subject-wise and class-wise attendance aggregation.
   */
  async getMonthlyPeriodOverview(
    month: number,
    year: number,
    classId?: string,
    sectionId?: string,
    schoolId?: string,
  ): Promise<MonthlyPeriodOverviewResponseDto> {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 1)
      .toISOString()
      .split('T')[0];

    const baseQb = () =>
      this.periodAttendanceRepository
        .createQueryBuilder('pa')
        .where('pa.date >= :startDate', { startDate })
        .andWhere('pa.date < :endDate', { endDate })
        .andWhere('pa.deletedAt IS NULL');

    const addOptional = (qb: any) => {
      if (classId) qb.andWhere('pa.classId = :classId', { classId });
      if (sectionId) qb.andWhere('pa.sectionId = :sectionId', { sectionId });
      if (schoolId) qb.andWhere('pa.schoolId = :schoolId', { schoolId });
      return qb;
    };

    // ─── Subject-wise aggregation ───
    const subjectQb = addOptional(baseQb())
      .leftJoin('pa.subject', 'subject')
      .leftJoin('pa.class', 'class')
      .leftJoin('pa.section', 'section')
      .select('pa.subjectId', 'subjectId')
      .addSelect('subject.name', 'subjectName')
      .addSelect('pa.classId', 'classId')
      .addSelect('class.name', 'className')
      .addSelect('pa.sectionId', 'sectionId')
      .addSelect('section.name', 'sectionName')
      .addSelect('COUNT(*)', 'totalSessions')
      .addSelect(
        `SUM(CASE WHEN pa.status = 'present' THEN 1 ELSE 0 END)`,
        'totalPresent',
      )
      .addSelect(
        `SUM(CASE WHEN pa.status = 'absent' THEN 1 ELSE 0 END)`,
        'totalAbsent',
      )
      .addSelect(
        `SUM(CASE WHEN pa.status = 'late' THEN 1 ELSE 0 END)`,
        'totalLate',
      )
      .addSelect(
        `SUM(CASE WHEN pa.status = 'leave' THEN 1 ELSE 0 END)`,
        'totalLeave',
      )
      .groupBy('pa.subjectId')
      .addGroupBy('subject.name')
      .addGroupBy('pa.classId')
      .addGroupBy('class.name')
      .addGroupBy('pa.sectionId')
      .addGroupBy('section.name');

    const subjectRaw = await subjectQb.getRawMany();

    const bySubject = subjectRaw.map((r: any) => {
      const total = parseInt(r.totalSessions, 10);
      const present = parseInt(r.totalPresent, 10);
      return {
        subjectId: r.subjectId,
        subjectName: r.subjectName ?? 'Unknown',
        classId: r.classId,
        className: r.className ?? 'Unknown',
        sectionId: r.sectionId,
        sectionName: r.sectionName,
        totalSessions: total,
        totalPresent: present,
        totalAbsent: parseInt(r.totalAbsent, 10),
        totalLate: parseInt(r.totalLate, 10),
        totalLeave: parseInt(r.totalLeave, 10),
        attendancePercentage:
          total > 0
            ? parseFloat(((present / total) * 100).toFixed(2))
            : 0,
      };
    });

    // ─── Class-wise aggregation ───
    const classQb = addOptional(baseQb())
      .leftJoin('pa.class', 'class')
      .select('pa.classId', 'classId')
      .addSelect('class.name', 'className')
      .addSelect('COUNT(*)', 'total')
      .addSelect(
        `SUM(CASE WHEN pa.status = 'present' THEN 1 ELSE 0 END)`,
        'totalPresent',
      )
      .addSelect(
        `SUM(CASE WHEN pa.status = 'absent' THEN 1 ELSE 0 END)`,
        'totalAbsent',
      )
      .addSelect(
        `SUM(CASE WHEN pa.status = 'late' THEN 1 ELSE 0 END)`,
        'totalLate',
      )
      .addSelect(
        `SUM(CASE WHEN pa.status = 'leave' THEN 1 ELSE 0 END)`,
        'totalLeave',
      )
      .groupBy('pa.classId')
      .addGroupBy('class.name');

    const classRaw = await classQb.getRawMany();

    const byClass = classRaw.map((r: any) => {
      const total = parseInt(r.total, 10);
      const present = parseInt(r.totalPresent, 10);
      return {
        classId: r.classId,
        className: r.className ?? 'Unknown',
        totalPresent: present,
        totalAbsent: parseInt(r.totalAbsent, 10),
        totalLate: parseInt(r.totalLate, 10),
        totalLeave: parseInt(r.totalLeave, 10),
        attendancePercentage:
          total > 0
            ? parseFloat(((present / total) * 100).toFixed(2))
            : 0,
      };
    });

    return { year, month, bySubject, byClass };
  }

  /**
   * Individual student attendance analytics broken down by subject.
   * Optionally filter by month and year.
   */
  async getStudentAttendanceAnalytics(
    studentId: string,
    month?: number,
    year?: number,
    schoolId?: string,
  ): Promise<StudentAttendanceAnalyticsDto> {
    const student = await this.usersService.findById(studentId);
    if (!student) throw new NotFoundException('Student not found');

    const qb = this.periodAttendanceRepository
      .createQueryBuilder('pa')
      .leftJoin('pa.subject', 'subject')
      .select('pa.subjectId', 'subjectId')
      .addSelect('subject.name', 'subjectName')
      .addSelect('COUNT(*)', 'totalClasses')
      .addSelect(
        `SUM(CASE WHEN pa.status = 'present' THEN 1 ELSE 0 END)`,
        'present',
      )
      .addSelect(
        `SUM(CASE WHEN pa.status = 'absent' THEN 1 ELSE 0 END)`,
        'absent',
      )
      .addSelect(
        `SUM(CASE WHEN pa.status = 'late' THEN 1 ELSE 0 END)`,
        'late',
      )
      .addSelect(
        `SUM(CASE WHEN pa.status = 'leave' THEN 1 ELSE 0 END)`,
        'leave',
      )
      .where('pa.studentId = :studentId', { studentId })
      .andWhere('pa.deletedAt IS NULL');

    if (year) {
      if (month) {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = new Date(year, month, 1).toISOString().split('T')[0];
        qb.andWhere('pa.date >= :startDate', { startDate })
          .andWhere('pa.date < :endDate', { endDate });
      } else {
        qb.andWhere(`EXTRACT(YEAR FROM pa.date) = :year`, { year });
      }
    }

    if (schoolId) {
      qb.andWhere('pa.schoolId = :schoolId', { schoolId });
    }

    qb.groupBy('pa.subjectId').addGroupBy('subject.name');

    const raw = await qb.getRawMany();

    let grandTotal = 0;
    let grandPresent = 0;

    const bySubject = raw.map((r: any) => {
      const total = parseInt(r.totalClasses, 10);
      const present = parseInt(r.present, 10);
      grandTotal += total;
      grandPresent += present;
      return {
        subjectId: r.subjectId,
        subjectName: r.subjectName ?? 'Unknown',
        totalClasses: total,
        present,
        absent: parseInt(r.absent, 10),
        late: parseInt(r.late, 10),
        leave: parseInt(r.leave, 10),
        attendancePercentage:
          total > 0
            ? parseFloat(((present / total) * 100).toFixed(2))
            : 0,
      };
    });

    return {
      studentId,
      studentName: student.name,
      year: year ?? new Date().getFullYear(),
      month,
      bySubject,
      overallPercentage:
        grandTotal > 0
          ? parseFloat(((grandPresent / grandTotal) * 100).toFixed(2))
          : 0,
    };
  }
}
