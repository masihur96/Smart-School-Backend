import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMode } from '../entities/fee-invoice.entity';

export class PersonalPaymentInfoDto {
  @ApiPropertyOptional({ example: 'Sonali Bank PLC' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ example: 'Dhaka Ideal School & College' })
  @IsOptional()
  @IsString()
  accountName?: string;

  @ApiPropertyOptional({ example: '1234567890123' })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional({ example: 'Motijheel Branch' })
  @IsOptional()
  @IsString()
  branch?: string;

  @ApiPropertyOptional({ example: '125272635' })
  @IsOptional()
  @IsString()
  routingNumber?: string;

  @ApiPropertyOptional({ example: '01712345678' })
  @IsOptional()
  @IsString()
  bkashNumber?: string;

  @ApiPropertyOptional({ example: '01812345678' })
  @IsOptional()
  @IsString()
  nagadNumber?: string;

  @ApiPropertyOptional({ example: '01912345678' })
  @IsOptional()
  @IsString()
  rocketNumber?: string;

  @ApiPropertyOptional({ example: 'Accounts Office, Room 102 (9 AM - 2 PM)' })
  @IsOptional()
  @IsString()
  cashCounterLocation?: string;

  @ApiPropertyOptional({
    example:
      'Please send money to our bKash/Nagad number with Student Roll Number as Reference, or deposit directly into our bank account.',
  })
  @IsOptional()
  @IsString()
  instructions?: string;
}

export class SchoolCarePaymentInfoDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  enabled?: boolean;

  @ApiPropertyOptional({ example: 'SCHOOL_CARE_MERCHANT_001' })
  @IsOptional()
  @IsString()
  merchantId?: string;

  @ApiPropertyOptional({ example: 'https://gateway.schoolcare.app/api/v1' })
  @IsOptional()
  @IsString()
  gatewayUrl?: string;

  @ApiPropertyOptional({
    example: 'Pay seamlessly using automated School Care online payment gateway.',
  })
  @IsOptional()
  @IsString()
  instructions?: string;
}

export class UpdateFeeSettingDto {
  @ApiPropertyOptional({
    enum: PaymentMode,
    example: PaymentMode.PERSONAL_PAYMENT,
    description: 'Default payment collection mode: PERSONAL_PAYMENT or SCHOOL_CARE_PAYMENT',
  })
  @IsOptional()
  @IsEnum(PaymentMode)
  defaultPaymentMode?: PaymentMode;

  @ApiPropertyOptional({
    description: 'Personal payment banking and mobile money configuration',
    type: PersonalPaymentInfoDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PersonalPaymentInfoDto)
  personalPaymentInfo?: PersonalPaymentInfoDto;

  @ApiPropertyOptional({
    description: 'Automated School Care payment gateway configuration',
    type: SchoolCarePaymentInfoDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SchoolCarePaymentInfoDto)
  schoolCarePaymentInfo?: SchoolCarePaymentInfoDto;

  @ApiPropertyOptional({
    example: 10,
    description: 'Late fine in currency units per day after due date',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lateFeeFinePerDay?: number;

  @ApiPropertyOptional({
    example: 'BDT',
    description: 'Default currency symbol/code',
  })
  @IsOptional()
  @IsString()
  currency?: string;
}
