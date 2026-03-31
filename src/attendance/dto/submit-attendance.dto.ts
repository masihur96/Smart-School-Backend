import {
  IsString,
  IsDate,
  IsArray,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { AttendanceStatus } from '../entities/attendance.entity';

export class AttendanceRecordDto {
  @ApiProperty({
    example: 'uuid-student-001',
    description: 'Student ID (UUID)',
  })
  @IsString()
  studentId: string;

  @ApiProperty({
    enum: AttendanceStatus,
    example: AttendanceStatus.PRESENT,
    description: 'Attendance status',
  })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;
}

export class SubmitAttendanceDto {
  @ApiProperty({
    example: '2026-03-20',
    description: 'Attendance date (YYYY-MM-DD)',
  })
  @IsDate()
  @Type(() => Date)
  date: Date;

  @ApiProperty({
    example: 'uuid-teacher-001',
    description: 'Teacher ID who is taking attendance',
  })
  @IsString()
  takenBy: string;

  @ApiProperty({
    example: 'uuid-class-001',
    description: 'Class ID for which attendance is being submitted',
  })
  @IsString()
  classId: string;

  @ApiProperty({
    type: [AttendanceRecordDto],
    description: 'List of student attendance records',
    example: [
      { studentId: 'uuid-student-001', status: 'present' },
      { studentId: 'uuid-student-002', status: 'absent' },
      { studentId: 'uuid-student-003', status: 'leave' },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceRecordDto)
  records: AttendanceRecordDto[];
}
