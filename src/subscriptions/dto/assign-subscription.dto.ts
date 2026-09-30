import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDate,
  IsBoolean,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AssignSubscriptionDto {
  @ApiProperty({
    example: 'SCHOOL_123',
    description: 'The unique ID of the school',
  })
  @IsString()
  @IsNotEmpty()
  schoolId: string;

  @ApiProperty({
    example: 'uuid-of-pricing-plan',
    description: 'The ID of the Pricing Plan',
  })
  @IsString()
  @IsNotEmpty()
  pricingPlanId: string;

  @ApiProperty({ example: '2026-04-10T00:00:00Z', required: false })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @ApiProperty({ example: '2027-04-10T00:00:00Z', required: false })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  endDate?: Date;

  @ApiProperty({ example: true, required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    example: 'credit_card',
    description: 'Payment method used (e.g. credit_card, bank_transfer, cash)',
    required: false,
  })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiProperty({
    example: 'TXN-20260401-ABC123',
    description: 'Unique transaction ID from the payment gateway',
    required: false,
  })
  @IsString()
  @IsOptional()
  transactionId?: string;

  @ApiProperty({
    example: 1200.00,
    description: 'Amount paid for this subscription',
    required: false,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  amount?: number;
}
