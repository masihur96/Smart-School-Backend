import { IsString, IsDate, IsUUID, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateHomeworkDto {
  @IsUUID()
  classId: string;

  @IsUUID()
  subjectId: string;

  @IsUUID()
  teacherId: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsDate()
  @Type(() => Date)
  dueDate: Date;

  @IsUUID()
  @IsOptional()
  sectionId?: string;

  @IsUUID()
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
