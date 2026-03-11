import { IsString, IsDate, IsNumber, IsUUID, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateExamDto {
  @IsString()
  name: string;

  @IsUUID()
  classId: string;

  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsUUID()
  schoolId: string;
}

export class UpdateExamDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  date?: Date;
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
