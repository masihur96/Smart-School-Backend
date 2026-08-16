import {
  IsOptional,
  IsEnum,
  IsString,
  IsInt,
  Min,
  Max,
  IsDateString,
  IsIn,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  WalletTransactionType,
  PaymentMethod,
} from '../entities/wallet-transaction.entity';

export class QueryTransactionDto {
  @ApiPropertyOptional({
    description: 'Filter by transaction type',
    enum: WalletTransactionType,
    example: WalletTransactionType.EXPENSE,
  })
  @IsOptional()
  @IsEnum(WalletTransactionType)
  type?: WalletTransactionType;

  @ApiPropertyOptional({
    description: 'Filter by category (e.g. Salary, Utilities, Tuition Fee)',
    example: 'Electricity Bill',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Filter by payment method',
    enum: PaymentMethod,
    example: PaymentMethod.CASH,
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Filter by month number (1 to 12). Used in conjunction with or defaults to current year if year is omitted.',
    example: 8,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  month?: number;

  @ApiPropertyOptional({
    description: 'Filter by year (e.g. 2026)',
    example: 2026,
  })
  @IsOptional()
  @IsInt()
  @Min(2000)
  @Max(2100)
  @Type(() => Number)
  year?: number;

  @ApiPropertyOptional({
    description: 'Filter by start date (YYYY-MM-DD)',
    example: '2026-08-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by end date (YYYY-MM-DD)',
    example: '2026-08-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Search string across title, reference number, or description',
    example: 'DESCO',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    default: 1,
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Number of records per page',
    default: 20,
    example: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit: number = 20;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: ['transactionDate', 'createdAt', 'amount'],
    default: 'transactionDate',
  })
  @IsOptional()
  @IsIn(['transactionDate', 'createdAt', 'amount'])
  sortBy: 'transactionDate' | 'createdAt' | 'amount' = 'transactionDate';

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder: 'ASC' | 'DESC' = 'DESC';
}
