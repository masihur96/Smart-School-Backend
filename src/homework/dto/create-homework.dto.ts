import { IsString, IsDate, IsUUID, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateHomeworkDto {
  @IsString()
  classId: string;

  @IsString()
  subjectId: string;

  @IsString()
  teacherId: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsDate()
  @Type(() => Date)
  dueDate: Date;

  @IsString()
  @IsOptional()
  sectionId?: string;

  @IsString()
  schoolId: string;
}

export class UpdateHomeworkDto {
  @IsString()
  title?: string;

  @IsString()
  description?: string;

  @IsDate()
  @Type(() => Date)
  dueDate?: Date;
}
