import { IsString, IsEmail, IsEnum, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe', description: 'The name of the user' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'john@example.com', description: 'The email of the user' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', description: 'The password of the user' })
  @IsString()
  password: string;

  @ApiProperty({ enum: UserRole, example: UserRole.STUDENT, description: 'The role of the user' })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ example: 'uuid-of-school', description: 'The school ID the user belongs to' })
  @IsUUID()
  schoolId: string;

  @ApiProperty({ example: '+1234567890', description: 'The phone number of the user', required: false })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class UpdateUserDto {
  @ApiProperty({ example: 'John Doe', description: 'The name of the user', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'john@example.com', description: 'The email of the user', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'password123', description: 'The password of the user', required: false })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({ enum: UserRole, example: UserRole.STUDENT, description: 'The role of the user', required: false })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ example: '+1234567890', description: 'The phone number of the user', required: false })
  @IsOptional()
  @IsString()
  phone?: string;
}

