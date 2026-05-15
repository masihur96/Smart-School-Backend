import {
  IsString,
  IsArray,
  ValidateNested,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PeriodAttendanceStatus } from '../entities/period-attendance.entity';

export class PeriodAttendanceRecordDto {
  @ApiProperty({
    example: 'uuid-student-001',
    description: 'Student ID (UUID)',
  })
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({
    enum: PeriodAttendanceStatus,
    example: PeriodAttendanceStatus.PRESENT,
    description: 'Attendance status: present | absent | late | leave',
  })
  @IsEnum(PeriodAttendanceStatus)
  status: PeriodAttendanceStatus;
}

export class SubmitPeriodAttendanceDto {
  @ApiProperty({
    example: 'uuid-routine-001',
    description:
      'Routine/Period ID — the specific scheduled class for which attendance is being taken',
  })
  @IsString()
  @IsNotEmpty()
  routineId: string;

  @ApiProperty({
    example: '2026-05-14',
    description: 'Date of the class (YYYY-MM-DD)',
  })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({
    type: [PeriodAttendanceRecordDto],
    description: 'Per-student attendance records',
    example: [
      { studentId: 'uuid-student-001', status: 'present' },
      { studentId: 'uuid-student-002', status: 'absent' },
      { studentId: 'uuid-student-003', status: 'late' },
      { studentId: 'uuid-student-004', status: 'leave' },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PeriodAttendanceRecordDto)
  records: PeriodAttendanceRecordDto[];
}
