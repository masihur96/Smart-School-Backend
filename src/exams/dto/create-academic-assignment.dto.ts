import { IsUUID, IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAcademicAssignmentDto {
  @ApiPropertyOptional({ example: 'uuid-of-assignment' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ example: 'uuid-of-class' })
  @IsUUID()
  class_uid: string;

  @ApiProperty({ example: 'uuid-of-subject' })
  @IsUUID()
  subject_uid: string;

  @ApiProperty({ example: 'uuid-of-examiner-user' })
  @IsUUID()
  examiner_uid: string;

  @ApiProperty({ example: '2025-06-15' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ example: '09:00:00', description: 'Exam start time (nullable)' })
  @IsOptional()
  @IsDateString()
  start_time?: string | null;

  @ApiPropertyOptional({ example: '11:00:00', description: 'Exam end time (nullable)' })
  @IsOptional()
  @IsDateString()
  end_time?: string | null;

  @ApiPropertyOptional({ example: 'Chapter 1 to 5' })
  @IsOptional()
  @IsString()
  syllabus?: string;
}
