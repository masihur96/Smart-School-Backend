import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../entities/wallet-transaction.entity';

export class AddExpenseDto {
  @ApiProperty({
    description: 'Expense amount to deduct from the school treasury wallet',
    example: 12000,
  })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  @IsNotEmpty()
  amount: number;

  @ApiProperty({
    description: 'Expense category (e.g. Teacher Salary, Electricity, Internet, Maintenance, Stationery, Event, Other)',
    example: 'Electricity Bill',
  })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({
    description: 'Short title/purpose of the expense',
    example: 'Campus electric bill for July 2026',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Optional detailed description or itemization',
    example: 'Paid DESCO electricity bill for building A and B',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Payment method',
    enum: PaymentMethod,
    default: PaymentMethod.CASH,
    example: PaymentMethod.BANK_TRANSFER,
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Voucher number, invoice number, cheque number, or receipt reference',
    example: 'EXP-2026-08-042',
  })
  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @ApiPropertyOptional({
    description: 'Date of the expense (ISO string). Defaults to current date/time if omitted.',
    example: '2026-08-16T11:30:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  transactionDate?: string;

  @ApiPropertyOptional({
    description: 'URL of uploaded voucher, bill, or invoice image/PDF',
    example: 'https://storage.googleapis.com/smart-school/bills/bill-042.jpg',
  })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}
