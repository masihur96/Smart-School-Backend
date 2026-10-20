import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export class GetContactsDto {
  @ApiPropertyOptional({
    description: 'Filter contacts by search keyword (name, email, or roll number)',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: UserRole,
    description: 'Filter contacts by role (Admin only)',
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Filter students by classId (Admin or Teacher)',
  })
  @IsOptional()
  @IsString()
  classId?: string;
}
