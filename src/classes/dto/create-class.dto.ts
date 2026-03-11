import { IsString, IsUUID } from 'class-validator';

export class CreateClassDto {
  @IsString()
  name: string;

  @IsString()
  section: string;

  @IsUUID()
  schoolId: string;
}

export class UpdateClassDto {
  @IsString()
  name?: string;

  @IsString()
  section?: string;
}
