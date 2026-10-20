import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { PaymentMode } from '../entities/fee-invoice.entity';
import { FeePaymentMethod } from '../entities/fee-payment.entity';

export class CollectPaymentDto {
  @ApiProperty({
    example: 1500,
    description: 'Amount collected / paid in this transaction',
  })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({
    enum: PaymentMode,
    example: PaymentMode.PERSONAL_PAYMENT,
    description: 'Payment collection mode: PERSONAL_PAYMENT or SCHOOL_CARE_PAYMENT',
    default: PaymentMode.PERSONAL_PAYMENT,
  })
  @IsOptional()
  @IsEnum(PaymentMode)
  paymentMode?: PaymentMode;

  @ApiPropertyOptional({
    enum: FeePaymentMethod,
    example: FeePaymentMethod.CASH,
    description: 'Payment instrument (CASH, BKASH, NAGAD, BANK_TRANSFER, ONLINE, WALLET)',
    default: FeePaymentMethod.CASH,
  })
  @IsOptional()
  @IsEnum(FeePaymentMethod)
  paymentMethod?: FeePaymentMethod;

  @ApiPropertyOptional({
    example: 'BKASH-TRX-987654321',
    description: 'Transaction ID, Bank Deposit Slip Number, or Reference',
  })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiPropertyOptional({
    example: '2026-10-21T10:00:00.000Z',
    description: 'Date and time of payment (defaults to current time)',
  })
  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @ApiPropertyOptional({
    example: 'Paid at cash counter by guardian',
    description: 'Remarks or notes regarding this payment',
  })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether to record this fee collection as an INCOME transaction in the Treasury Wallet',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  syncToWallet?: boolean;
}
