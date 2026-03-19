import { IsString, IsDateString, IsUUID, IsArray, ValidateNested, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExamDto {
  @ApiProperty({ example: 'Mid-Term Exam 2025' })
  @IsString()
  exam_name: string;

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
}

export class UpdateExamDto {
  @ApiPropertyOptional({ example: 'Final Exam 2025' })
  @IsOptional()
  @IsString()
  exam_name?: string;

  @ApiPropertyOptional({ example: 'uuid-of-class' })
  @IsOptional()
  @IsUUID()
  class_uid?: string;

  @ApiPropertyOptional({ example: 'uuid-of-subject' })
  @IsOptional()
  @IsUUID()
  subject_uid?: string;

  @ApiPropertyOptional({ example: 'uuid-of-examiner-user' })
  @IsOptional()
  @IsUUID()
  examiner_uid?: string;

  @ApiPropertyOptional({ example: '2025-07-20' })
  @IsOptional()
  @IsDateString()
  date?: string;
}

export class SubmitMarksDto {
  @IsUUID()
  examId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MarksItemDto)
  marks: MarksItemDto[];
}

export class MarksItemDto {
  @IsUUID()
  studentId: string;

  @IsNumber()
  marksObtained: number;

  @IsNumber()
  totalMarks: number;
}
