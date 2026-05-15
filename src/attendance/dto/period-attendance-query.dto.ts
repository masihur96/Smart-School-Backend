import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumberString,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PeriodAttendanceStatus } from '../entities/period-attendance.entity';

export class PeriodAttendanceQueryDto {
  @ApiProperty({
    example: 'John',
    description: 'Search by student name (partial, case-insensitive)',
    required: false,
  })
  @IsOptional()
  @IsString()
  studentName?: string;

  @ApiProperty({
    example: 'uuid-student-001',
    description: 'Filter by exact Student ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiProperty({
    example: 'uuid-class-001',
    description: 'Filter by Class ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  classId?: string;

  @ApiProperty({
    example: 'uuid-section-001',
    description: 'Filter by Section ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  sectionId?: string;

  @ApiProperty({
    example: 'uuid-subject-001',
    description: 'Filter by Subject ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  subjectId?: string;

  @ApiProperty({
    example: 'uuid-teacher-001',
    description: 'Filter by Teacher ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  teacherId?: string;

  @ApiProperty({
    example: 'uuid-routine-001',
    description: 'Filter by Routine/Period ID',
    required: false,
  })
  @IsOptional()
  @IsString()
  routineId?: string;

  @ApiProperty({
    example: '2026-05-14',
    description: 'Filter by specific date (YYYY-MM-DD)',
    required: false,
  })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiProperty({
    example: '2026-05-01',
    description: 'Start of date range (YYYY-MM-DD)',
    required: false,
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiProperty({
    example: '2026-05-31',
    description: 'End of date range (YYYY-MM-DD)',
    required: false,
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiProperty({
    enum: PeriodAttendanceStatus,
    description: 'Filter by attendance status',
    required: false,
  })
  @IsOptional()
  @IsEnum(PeriodAttendanceStatus)
  status?: PeriodAttendanceStatus;

  @ApiProperty({ example: 1, description: 'Page number (default: 1)', required: false })
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiProperty({ example: 50, description: 'Records per page (default: 50)', required: false })
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}

// ---------- Daily report DTOs ----------

export class PeriodAttendanceStudentRecordDto {
  studentId: string;
  studentName: string;
  rollNumber: string;
  status: PeriodAttendanceStatus;
}

export class DailyPeriodReportDto {
  routineId: string;
  subjectName: string;
  teacherName: string;
  startTime: string;
  endTime: string;
  records: PeriodAttendanceStudentRecordDto[];
}

// ---------- Monthly aggregate DTOs ----------

export class SubjectAttendanceSummaryDto {
  subjectId: string;
  subjectName: string;
  classId: string;
  className: string;
  sectionId?: string;
  sectionName?: string;
  totalSessions: number;
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalLeave: number;
  attendancePercentage: number;
}

export class MonthlyPeriodOverviewResponseDto {
  year: number;
  month: number;
  bySubject: SubjectAttendanceSummaryDto[];
  byClass: {
    classId: string;
    className: string;
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    totalLeave: number;
    attendancePercentage: number;
  }[];
}

// ---------- Student analytics DTOs ----------

export class StudentSubjectAnalyticsDto {
  subjectId: string;
  subjectName: string;
  totalClasses: number;
  present: number;
  absent: number;
  late: number;
  leave: number;
  attendancePercentage: number;
}

export class StudentAttendanceAnalyticsDto {
  studentId: string;
  studentName: string;
  year: number;
  month?: number;
  bySubject: StudentSubjectAnalyticsDto[];
  overallPercentage: number;
}
