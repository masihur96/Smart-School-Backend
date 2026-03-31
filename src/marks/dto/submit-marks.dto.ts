import {
  IsString,
  IsUUID,
  IsNumber,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class MarkItemDto {
  @IsUUID()
  studentId: string;

  @IsUUID()
  subjectId: string;

  @IsNumber()
  marksObtained: number;

  @IsNumber()
  totalMarks: number;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class SubmitMarksDto {
  @IsUUID()
  examId: string;

  @IsUUID()
  teacherId: string;

  @IsUUID()
  schoolId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MarkItemDto)
  marks: MarkItemDto[];
}
