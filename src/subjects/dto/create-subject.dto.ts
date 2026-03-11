import { IsString, IsUUID, IsOptional } from 'class-validator';

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
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsUUID()
  classId?: string;
}
