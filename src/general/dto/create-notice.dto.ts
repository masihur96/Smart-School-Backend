import { IsString, IsUUID } from 'class-validator';

export class CreateNoticeDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  postedBy?: string;

  @IsUUID()
  schoolId: string;
}

export class UpdateNoticeDto {
  @IsString()
  title?: string;

  @IsString()
  description?: string;
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
}

export class UpdateRoutineDto {
  @IsString()
  day?: string;

  @IsString()
  startTime?: string;

  @IsString()
  endTime?: string;
}
