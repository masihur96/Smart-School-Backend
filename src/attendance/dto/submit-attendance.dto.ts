import { IsString, IsDate, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus } from '../entities/attendance.entity';

export class SubmitAttendanceDto {
  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsString()
  takenBy: string;

  @IsString()
  classId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttendanceRecordDto)
  records: AttendanceRecordDto[];
}

export class AttendanceRecordDto {
  @IsString()
  studentId: string;

  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;
}
