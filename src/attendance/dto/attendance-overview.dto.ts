import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumberString } from 'class-validator';

export class AttendanceOverviewQueryDto {
  @ApiProperty({
    example: 2026,
    description: 'Year',
    required: false,
  })
  @IsOptional()
  @IsNumberString()
  year?: string;

  @ApiProperty({
    example: 4,
    description: 'Month (1-12)',
    required: false,
  })
  @IsOptional()
  @IsNumberString()
  month?: string;

  @ApiProperty({
    example: 'uuid-class-001',
    description: 'Class ID (UUID)',
    required: false,
  })
  @IsOptional()
  @IsString()
  classId?: string;

  @ApiProperty({
    example: 'uuid-section-001',
    description: 'Section ID (UUID)',
    required: false,
  })
  @IsOptional()
  @IsString()
  sectionId?: string;
}

export class AttendanceSummaryDto {
  @ApiProperty({
    example: 'uuid-class-001',
    description: 'Class ID',
  })
  classId: string;

  @ApiProperty({
    example: 'Class X',
    description: 'Class name',
  })
  className: string;

  @ApiProperty({
    example: 'uuid-section-001',
    description: 'Section ID',
  })
  sectionId?: string;

  @ApiProperty({
    example: 'Section A',
    description: 'Section name',
  })
  sectionName?: string;

  @ApiProperty({
    example: 25,
    description: 'Total present count',
  })
  totalPresent: number;

  @ApiProperty({
    example: 5,
    description: 'Total absent count',
  })
  totalAbsent: number;

  @ApiProperty({
    example: 2,
    description: 'Total leave count',
  })
  totalLeave: number;

  @ApiProperty({
    example: 32,
    description: 'Total records',
  })
  totalRecords: number;

  @ApiProperty({
    example: 78.125,
    description: 'Attendance percentage',
  })
  attendancePercentage: number;
}

export class AttendanceOverviewResponseDto {
  @ApiProperty({
    example: 2026,
    description: 'Year',
  })
  year: number;

  @ApiProperty({
    example: 4,
    description: 'Month',
  })
  month: number;

  @ApiProperty({
    type: [AttendanceSummaryDto],
    description: 'Attendance summary by class and section',
  })
  data: AttendanceSummaryDto[];

  @ApiProperty({
    example: 25,
    description: 'Grand total present count',
  })
  grandTotalPresent: number;

  @ApiProperty({
    example: 5,
    description: 'Grand total absent count',
  })
  grandTotalAbsent: number;

  @ApiProperty({
    example: 2,
    description: 'Grand total leave count',
  })
  grandTotalLeave: number;

  @ApiProperty({
    example: 78.125,
    description: 'Overall attendance percentage',
  })
  overallAttendancePercentage: number;
}

export class MonthlyAttendanceOverviewQueryDto {
  @ApiProperty({
    example: 2026,
    description: 'Year to retrieve monthly overview for',
    required: false,
  })
  @IsOptional()
  @IsNumberString()
  year?: string;

  @ApiProperty({
    example: 'uuid-class-001',
    description: 'Filter by Class ID (UUID)',
    required: false,
  })
  @IsOptional()
  @IsString()
  classId?: string;

  @ApiProperty({
    example: 'uuid-section-001',
    description: 'Filter by Section ID (UUID)',
    required: false,
  })
  @IsOptional()
  @IsString()
  sectionId?: string;
}

export class MonthlyAttendanceSummaryDto {
  @ApiProperty({ example: 4, description: 'Month (1-12)' })
  month: number;

  @ApiProperty({
    example: 100,
    description: 'Total present count for the month',
  })
  totalPresent: number;

  @ApiProperty({ example: 10, description: 'Total absent count for the month' })
  totalAbsent: number;

  @ApiProperty({ example: 5, description: 'Total leave count for the month' })
  totalLeave: number;

  @ApiProperty({
    example: 86.96,
    description: 'Attendance percentage for the month',
  })
  attendancePercentage: number;
}

export class MonthlyAttendanceOverviewResponseDto {
  @ApiProperty({ example: 2026, description: 'Year' })
  year: number;

  @ApiProperty({
    type: [MonthlyAttendanceSummaryDto],
    description: 'Monthly summaries for the year',
  })
  data: MonthlyAttendanceSummaryDto[];
}
