import {
  IsString,
  IsDateString,
  IsUUID,
  IsArray,
  ValidateNested,
  IsNumber,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExamDto {
  @ApiProperty({ example: 'Mid-Term Exam 2025' })
  @IsString()
  exam_name: string;

  @ApiPropertyOptional({ example: 'First term exam for all classes' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '2025-06-15' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ example: '2025-06-30' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether the exam is published',
  })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdateExamDto {
  @ApiPropertyOptional({ example: 'Final Exam 2025' })
  @IsOptional()
  @IsString()
  exam_name?: string;

  @ApiPropertyOptional({ example: 'Final examination details' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '2025-07-20' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ example: '2025-07-30' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the exam is published',
  })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
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
