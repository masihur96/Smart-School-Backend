import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsIn,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminCreateTeacherAttendanceDto {
  @ApiProperty({
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description: 'UUID of the teacher',
  })
  @IsUUID()
  @IsNotEmpty()
  teacherId: string;

  @ApiProperty({
    example: '2026-07-02',
    description: 'Attendance date in YYYY-MM-DD format',
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({
    example: 'clock-in',
    description: 'Attendance status: clock-in or clock-out',
    enum: ['clock-in', 'clock-out', 'absent'],
  })
  @IsString()
  @IsIn(['clock-in', 'clock-out', 'absent'])
  @IsNotEmpty()
  status: string;

  @ApiPropertyOptional({
    example: '2026-07-02T08:00:00.000Z',
    description: 'Clock-in / start time (ISO string). Defaults to now.',
  })
  @IsDateString()
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional({
    example: '2026-07-02T14:00:00.000Z',
    description: 'Clock-out / end time (ISO string).',
  })
  @IsDateString()
  @IsOptional()
  endTime?: string;

  @ApiPropertyOptional({
    example: '2026-07-02T08:00:00.000Z',
    description: 'Exact timestamp of the attendance action. Defaults to now.',
  })
  @IsDateString()
  @IsOptional()
  time?: string;
}
