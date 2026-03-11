import { IsString, IsEmail, IsEnum, IsUUID } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsUUID()
  schoolId: string;

  @IsString()
  phone?: string;
}

export class UpdateUserDto {
  @IsString()
  name?: string;

  @IsString()
  password?: string;

  @IsString()
  phone?: string;
}
