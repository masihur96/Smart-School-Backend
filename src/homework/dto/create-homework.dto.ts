import { IsString, IsDate, IsOptional, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StudentHomeworkStatus } from '../entities/student-homework.entity';

export class CreateHomeworkDto {
  @ApiProperty({ example: 'uuid-class-001' })
  @IsString()
  classId: string;

  @ApiProperty({ example: 'uuid-subject-001' })
  @IsString()
  subjectId: string;

  @ApiProperty({ example: 'uuid-teacher-001' })
  @IsString()
  teacherId: string;

  @ApiProperty({ example: 'Mathematics Chapter 3' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Solve exercises 1 to 10.' })
  @IsString()
  description: string;

  @ApiProperty({ example: '2026-04-20' })
  @IsDate()
  @Type(() => Date)
  dueDate: Date;

  @ApiPropertyOptional({ example: 'uuid-section-001' })
  @IsString()
  @IsOptional()
  sectionId?: string;

  @ApiProperty({ example: 'uuid-school-001' })
  @IsString()
  schoolId: string;
}

export class UpdateHomeworkDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '2026-04-25' })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  dueDate?: Date;
}

export class UpdateStudentHomeworkStatusDto {
  @ApiProperty({ enum: StudentHomeworkStatus })
  @IsEnum(StudentHomeworkStatus)
  status: StudentHomeworkStatus;

  @ApiPropertyOptional({ example: 'Good work!' })
  @IsString()
  @IsOptional()
  comment?: string;
}

export class BulkUpdateHomeworkStatusDto {
  @ApiProperty({ enum: StudentHomeworkStatus })
  @IsEnum(StudentHomeworkStatus)
  status: StudentHomeworkStatus;

  @ApiPropertyOptional({ example: 'All students completed.' })
  @IsString()
  @IsOptional()
  comment?: string;
}
