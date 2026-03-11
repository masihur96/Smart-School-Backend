import { IsString, IsDate, IsNumber, IsUUID, IsArray, ValidateNested } from 'class-validator';
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
  @IsString()
  name?: string;

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
