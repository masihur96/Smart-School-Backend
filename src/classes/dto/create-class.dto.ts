import { IsString, IsUUID, IsOptional } from 'class-validator';

export class CreateClassDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  section: string;

  @IsOptional()
  @IsUUID()
  schoolId: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateClassDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  section?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

