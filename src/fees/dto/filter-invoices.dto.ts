import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { FeeStatus, PaymentMode } from '../entities/fee-invoice.entity';
import { FeeType } from '../entities/fee-structure.entity';

export class FilterInvoicesDto {
  @ApiPropertyOptional({
    description: 'Filter by student UUID',
  })
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiPropertyOptional({
    description: 'Filter by class UUID',
  })
  @IsOptional()
  @IsString()
  classId?: string;

  @ApiPropertyOptional({
    enum: FeeType,
    description: 'Filter by fee type',
  })
  @IsOptional()
  @IsEnum(FeeType)
  feeType?: FeeType;

  @ApiPropertyOptional({
    enum: FeeStatus,
    description: 'Filter by invoice status (PAID, UNPAID, PARTIALLY_PAID, OVERDUE, WAIVED)',
  })
  @IsOptional()
  @IsEnum(FeeStatus)
  status?: FeeStatus;

  @ApiPropertyOptional({
    enum: PaymentMode,
    description: 'Filter by payment mode (PERSONAL_PAYMENT or SCHOOL_CARE_PAYMENT)',
  })
  @IsOptional()
  @IsEnum(PaymentMode)
  paymentMode?: PaymentMode;

  @ApiPropertyOptional({
    example: 'October',
    description: 'Filter by billing month',
  })
  @IsOptional()
  @IsString()
  month?: string;

  @ApiPropertyOptional({
    example: 2026,
    description: 'Filter by billing year',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number;

  @ApiPropertyOptional({
    description: 'Search by invoice number or student name/roll number',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
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
