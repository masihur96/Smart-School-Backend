import { IsString, IsUUID, IsOptional } from 'class-validator';

export class CreateClassDto {
  @IsString()
  name: string;

  @IsString()
  section: string;

  @IsUUID()
  schoolId: string;
}

export class UpdateClassDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  section?: string;
}

