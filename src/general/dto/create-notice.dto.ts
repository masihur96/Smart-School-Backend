import {
  IsString,
  IsUUID,
  IsOptional,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { PartialType, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Day } from '../entities/routine.entity';

export class CreateNoticeDto {
  @ApiProperty({ example: 'Welcome Back!' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'School reopens next Monday.' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ example: 'Students' })
  @IsOptional()
  @IsString()
  targetAudience?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isImportent?: boolean;

  @ApiPropertyOptional({ example: 'Principal' })
  @IsOptional()
  @IsString()
  postedBy?: string;

  @ApiProperty({ example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  @IsUUID()
  schoolId: string;
}

export class UpdateNoticeDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  targetAudience?: string;

  @IsOptional()
  @IsBoolean()
  isImportent?: boolean;
}

export class CreateRoutineDto {
  @IsUUID()
  classId: string;

  @IsUUID()
  subjectId: string;

  @IsUUID()
  teacherId: string;

  @IsEnum(Day)
  day: Day;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;

  @IsUUID()
  schoolId: string;

  @IsString()
  roomNumber: string;
}

export class UpdateRoutineDto extends PartialType(CreateRoutineDto) {}
