import { IsString, IsUUID } from 'class-validator';

export class CreateSubjectDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsUUID()
  classId: string;

  @IsUUID()
  schoolId: string;
}

export class UpdateSubjectDto {
  @IsString()
  name?: string;

  @IsString()
  code?: string;
}
