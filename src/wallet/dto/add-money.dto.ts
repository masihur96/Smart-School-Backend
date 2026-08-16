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

export class AddMoneyDto {
  @ApiProperty({
    description: 'Amount to deposit into the school treasury wallet',
    example: 50000,
  })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  @IsNotEmpty()
  amount: number;

  @ApiProperty({
    description: 'Income category (e.g. Tuition Fee, Donation, Govt Grant, Sponsorship, Other)',
    example: 'Tuition Fee Collection',
  })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({
    description: 'Short title/purpose of the income',
    example: 'Monthly student tuition fees batch August 2026',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Optional detailed description or remarks',
    example: 'Collected via offline counter and bank deposits',
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
    description: 'Receipt number, invoice number, bank transaction ID, or voucher reference',
    example: 'DEP-2026-08-001',
  })
  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @ApiPropertyOptional({
    description: 'Date of the transaction (ISO string). Defaults to current date/time if omitted.',
    example: '2026-08-16T10:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  transactionDate?: string;

  @ApiPropertyOptional({
    description: 'URL of uploaded receipt or supporting document image/PDF',
    example: 'https://storage.googleapis.com/smart-school/receipts/deposit-001.pdf',
  })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}
