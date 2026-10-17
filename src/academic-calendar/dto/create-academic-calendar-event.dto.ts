import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AcademicCalendarCategory,
  TargetAudience,
} from '../entities/academic-calendar-event.entity';

export class CreateAcademicCalendarEventDto {
  @ApiProperty({
    example: 'Summer Vacation 2026',
    description: 'Title of the calendar event',
  })
  @IsString()
  title: string;

  @ApiPropertyOptional({
    example: 'School will remain closed for summer recess.',
    description: 'Detailed description of the event',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    enum: AcademicCalendarCategory,
    default: AcademicCalendarCategory.EVENT,
    example: AcademicCalendarCategory.VACATION,
    description: 'Category or type of the event',
  })
  @IsEnum(AcademicCalendarCategory)
  @IsOptional()
  category?: AcademicCalendarCategory;

  @ApiProperty({
    example: '2026-06-01',
    description: 'Start date of the event (ISO date string or YYYY-MM-DD)',
  })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({
    example: '2026-06-15',
    description:
      'End date of the event (defaults to startDate if single-day event)',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    example: '09:00',
    description: 'Start time of the event (optional)',
  })
  @IsString()
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional({
    example: '14:00',
    description: 'End time of the event (optional)',
  })
  @IsString()
  @IsOptional()
  endTime?: string;

  @ApiPropertyOptional({
    example: true,
    default: true,
    description: 'Whether the event is an all-day event',
  })
  @IsBoolean()
  @IsOptional()
  isAllDay?: boolean;

  @ApiPropertyOptional({
    example: true,
    default: false,
    description: 'Whether this event represents a school holiday (closed)',
  })
  @IsBoolean()
  @IsOptional()
  isHoliday?: boolean;

  @ApiPropertyOptional({
    enum: TargetAudience,
    default: TargetAudience.ALL,
    example: TargetAudience.ALL,
    description: 'Target audience who should see this event',
  })
  @IsEnum(TargetAudience)
  @IsOptional()
  targetAudience?: TargetAudience;

  @ApiPropertyOptional({
    type: [String],
    example: ['uuid-class-1', 'uuid-class-2'],
    description:
      'Specific class IDs this event applies to (leave empty/null for school-wide)',
  })
  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  classIds?: string[];

  @ApiPropertyOptional({
    example: '#E53935',
    description: 'Hex color code for calendar badge or UI display',
  })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({
    example: 'Main Auditorium',
    description: 'Location or venue of the event',
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/uploads/academic-calendar-2026.pdf',
    description: 'Attachment URL (circular, routine, schedule flyer)',
  })
  @IsString()
  @IsOptional()
  attachmentUrl?: string;

  @ApiPropertyOptional({
    example: '2026-2027',
    description: 'Academic year (e.g. 2026 or 2026-2027)',
  })
  @IsString()
  @IsOptional()
  academicYear?: string;

  @ApiPropertyOptional({
    example: 'First Term',
    description: 'Academic term / semester name',
  })
  @IsString()
  @IsOptional()
  term?: string;
}
