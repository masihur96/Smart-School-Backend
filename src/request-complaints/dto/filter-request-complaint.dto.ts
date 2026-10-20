import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import {
  RequestComplaintType,
  RequestComplaintStatus,
  RequestComplaintPriority,
  RequestComplaintCategory,
} from '../entities/request-complaint.entity';

export enum RequestComplaintScope {
  ALL = 'all',
  SENT = 'sent',
  RECEIVED = 'received',
  UNASSIGNED = 'unassigned',
}

export class FilterRequestComplaintDto {
  @ApiPropertyOptional({
    enum: RequestComplaintType,
    description: 'Filter by type: REQUEST or COMPLAINT',
  })
  @IsOptional()
  @IsEnum(RequestComplaintType)
  type?: RequestComplaintType;

  @ApiPropertyOptional({
    enum: RequestComplaintStatus,
    description: 'Filter by status: PENDING, IN_PROGRESS, RESOLVED, REJECTED, CANCELLED',
  })
  @IsOptional()
  @IsEnum(RequestComplaintStatus)
  status?: RequestComplaintStatus;

  @ApiPropertyOptional({
    enum: RequestComplaintPriority,
    description: 'Filter by priority: LOW, MEDIUM, HIGH, URGENT',
  })
  @IsOptional()
  @IsEnum(RequestComplaintPriority)
  priority?: RequestComplaintPriority;

  @ApiPropertyOptional({
    enum: RequestComplaintCategory,
    description: 'Filter by category',
  })
  @IsOptional()
  @IsEnum(RequestComplaintCategory)
  category?: RequestComplaintCategory;

  @ApiPropertyOptional({
    enum: RequestComplaintScope,
    description:
      'Filter scope: "sent" (created by me), "received" (directed to me), "unassigned" (school admin pool), or "all"',
  })
  @IsOptional()
  @IsEnum(RequestComplaintScope)
  scope?: RequestComplaintScope;

  @ApiPropertyOptional({
    description: 'Search keyword matching title or description',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by schoolId (Super Admin only)',
  })
  @IsOptional()
  @IsString()
  schoolId?: string;

  @ApiPropertyOptional({
    description: 'Page number',
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
