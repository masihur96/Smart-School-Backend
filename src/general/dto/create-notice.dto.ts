import { IsString, IsUUID, IsOptional, IsBoolean } from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class CreateNoticeDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  audience?: string;

  @IsOptional() 
  @IsBoolean()
  isImportent?: boolean;

  @IsOptional()
  @IsString()
  postedBy?: string;

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
  audience?: string;

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

  @IsString()
  day: string;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;

  @IsUUID()
  schoolId: string;

  @IsString()
  @IsOptional()
  roomNumber?: string;
}

export class UpdateRoutineDto extends PartialType(CreateRoutineDto) {}
