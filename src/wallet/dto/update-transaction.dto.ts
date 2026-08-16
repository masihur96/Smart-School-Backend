import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '../entities/wallet-transaction.entity';

export class UpdateTransactionDto {
  @ApiPropertyOptional({
    description: 'Updated category name',
    example: 'Office Supplies',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Updated title/purpose',
    example: 'Stationery and printer papers',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Updated description or remarks',
    example: 'Purchased 10 reams of A4 paper',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Updated payment method',
    enum: PaymentMethod,
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Updated voucher / invoice / cheque / reference number',
    example: 'REF-998822',
  })
  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @ApiPropertyOptional({
    description: 'Updated transaction date (ISO string)',
    example: '2026-08-15T09:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  transactionDate?: string;

  @ApiPropertyOptional({
    description: 'Updated attachment URL',
    example: 'https://storage.googleapis.com/smart-school/receipts/new-receipt.jpg',
  })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}
