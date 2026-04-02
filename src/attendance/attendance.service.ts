import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance, AttendanceStatus } from './entities/attendance.entity';
import { SubmitAttendanceDto } from './dto/submit-attendance.dto';
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
import { User } from '../users/entities/user.entity';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    private usersService: UsersService,
    private classesService: ClassesService,
    private sectionsService: SectionsService,
  ) {}

  private normalizeDate(date: string | Date): string {
    if (date instanceof Date) {
      return date.toISOString().split('T')[0];
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
      } else {
        // Create new record
        attendance = this.attendanceRepository.create({
          ...record,
          date: this.normalizeDate(data.date) as any,
          takenBy: data.takenBy,
          classId: data.classId,
          schoolId: 'placeholder-school-id', // Should ideally come from JWT or DTO
        });
      }

      results.push(await this.attendanceRepository.save(attendance));
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
    return await this.attendanceRepository.find({
      where: { studentId },
      order: { date: 'DESC' },
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
        .addSelect('student.sectionId', 'sectionId')
        .addSelect('COUNT(*)', 'totalRecords')
        .addSelect(
          `SUM(CASE WHEN attendance.status = :presentStatus THEN 1 ELSE 0 END)`,
          'totalPresent',
        )
        .addSelect(
          `SUM(CASE WHEN attendance.status = :absentStatus THEN 1 ELSE 0 END)`,
          'totalAbsent',
        )
        .addSelect(
          `SUM(CASE WHEN attendance.status = :leaveStatus THEN 1 ELSE 0 END)`,
          'totalLeave',
        )
        .where('attendance.date >= :startDate', { startDate })
        .andWhere('attendance.date < :endDate', { endDate })
        .setParameters({
          startDate,
          endDate,
          presentStatus: AttendanceStatus.PRESENT,
          absentStatus: AttendanceStatus.ABSENT,
          leaveStatus: AttendanceStatus.LEAVE,
        });

      if (query.classId) {
        qb.andWhere('attendance.classId = :classId', {
          classId: query.classId,
        });
      }

      if (query.sectionId) {
        qb.andWhere('student.sectionId = :sectionId', {
          sectionId: query.sectionId,
        });
      }

      const rawResults = await qb
        .groupBy('attendance.classId')
        .addGroupBy('student.sectionId')
        .getRawMany();

      // Get all classes and sections to map names
      const classes = await this.classesService.findAll();
      const sections = await this.sectionsService.findAll();

      const classMap = new Map(classes.map((c) => [c.id, c.name]));
      const sectionMap = new Map(sections.map((s) => [s.id, s.name]));

      const data: AttendanceSummaryDto[] = rawResults.map((res) => {
        const totalRecords = parseInt(res.totalRecords, 10);
        const totalPresent = parseInt(res.totalPresent, 10);
        const totalAbsent = parseInt(res.totalAbsent, 10);
        const totalLeave = parseInt(res.totalLeave, 10);

        return {
          classId: res.classId,
          className: classMap.get(res.classId) || 'Unknown Class',
          sectionId: res.sectionId,
          sectionName: sectionMap.get(res.sectionId) || 'Unknown Section',
          totalPresent,
          totalAbsent,
          totalLeave,
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
        overallAttendancePercentage,
      };
    } catch (error) {
      this.logger.error(
        `Error getting attendance overview: ${error.message}`,
        error.stack,
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
        attendancePercentage: overview.overallAttendancePercentage,
      });
    }

    return {
      year,
      data: monthlyData,
    };
  }
}
