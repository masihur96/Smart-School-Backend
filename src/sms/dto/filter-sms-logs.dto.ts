import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { SmsStatus, SmsTargetAudience } from '../entities/sms-log.entity';

export class FilterSmsLogsDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({ enum: SmsStatus })
  @IsEnum(SmsStatus)
  @IsOptional()
  status?: SmsStatus;

  @ApiPropertyOptional({ enum: SmsTargetAudience })
  @IsEnum(SmsTargetAudience)
  @IsOptional()
  targetAudience?: SmsTargetAudience;

  @ApiPropertyOptional({ description: 'Search in campaignName or message or senderId' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by start date (ISO string / YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter by end date (ISO string / YYYY-MM-DD)' })
  @IsString()
  @IsOptional()
  endDate?: string;
}
