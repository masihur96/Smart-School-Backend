import {
  IsOptional,
  IsString,
  IsEnum,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  AcademicCalendarCategory,
  TargetAudience,
} from '../entities/academic-calendar-event.entity';

export class FilterAcademicCalendarDto {
  @ApiPropertyOptional({
    example: 2026,
    description: 'Filter events occurring in a specific calendar year',
  })
  @IsOptional()
  @Type(() => Number)
  year?: number;

  @ApiPropertyOptional({
    example: 5,
    description: 'Filter events in a specific month (1 - 12)',
  })
  @IsOptional()
  @Type(() => Number)
  month?: number;

  @ApiPropertyOptional({
    example: '2026-01-01',
    description: 'Range start date filter (inclusive)',
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-12-31',
    description: 'Range end date filter (inclusive)',
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({
    enum: AcademicCalendarCategory,
    description: 'Filter by event category',
  })
  @IsOptional()
  @IsEnum(AcademicCalendarCategory)
  category?: AcademicCalendarCategory;

  @ApiPropertyOptional({
    example: true,
    description: 'Filter only holidays (true) or non-holidays (false)',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true || value === 1 || value === '1') return true;
    if (value === 'false' || value === false || value === 0 || value === '0') return false;
    return undefined;
  })
  @IsBoolean()
  isHoliday?: boolean;

  @ApiPropertyOptional({
    example: '2026-2027',
    description: 'Filter by academic year',
  })
  @IsOptional()
  @IsString()
  academicYear?: string;

  @ApiPropertyOptional({
    example: 'First Term',
    description: 'Filter by term / semester',
  })
  @IsOptional()
  @IsString()
  term?: string;

  @ApiPropertyOptional({
    example: 'uuid-class-id',
    description: 'Filter events applicable to a specific class ID',
  })
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiPropertyOptional({
    enum: TargetAudience,
    description: 'Filter by target audience',
  })
  @IsOptional()
  @IsEnum(TargetAudience)
  targetAudience?: TargetAudience;

  @ApiPropertyOptional({
    example: 'uuid-school-id',
    description: 'School UUID override (SuperAdmin only)',
  })
  @IsOptional()
  @IsUUID()
  schoolId?: string;
}
