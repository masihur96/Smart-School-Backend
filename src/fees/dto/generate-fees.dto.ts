import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  IsDateString,
  IsArray,
} from 'class-validator';
import { FeeType } from '../entities/fee-structure.entity';
import { PaymentMode } from '../entities/fee-invoice.entity';

export class GenerateFeesDto {
  @ApiPropertyOptional({
    example: 'class-uuid-1',
    description: 'Target class UUID to generate fees for all enrolled students in bulk',
  })
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiPropertyOptional({
    example: 'section-uuid-1',
    description: 'Optional section UUID to restrict bulk class generation',
  })
  @IsOptional()
  @IsUUID()
  sectionId?: string;

  @ApiPropertyOptional({
    example: 'student-uuid-1',
    description: 'Specific student UUID to generate fee for an individual student',
  })
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @ApiPropertyOptional({
    example: ['student-uuid-1', 'student-uuid-2'],
    description: 'Array of specific student UUIDs for selective batch generation',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  studentIds?: string[];

  @ApiProperty({
    example: 'Monthly Tuition Fee - October 2026',
    description: 'Title of the fee invoice',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    example: 'Includes computer lab fee and library charges',
    description: 'Detailed description or note',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    enum: FeeType,
    example: FeeType.TUITION,
    description: 'Type of fee (TUITION, ADMISSION, EXAM, REGISTRATION, SESSION, etc.)',
    default: FeeType.TUITION,
  })
  @IsEnum(FeeType)
  feeType: FeeType;

  @ApiPropertyOptional({
    example: 'fee-structure-uuid-1',
    description: 'Optional ID of the base FeeStructure template',
  })
  @IsOptional()
  @IsUUID()
  feeStructureId?: string;

  @ApiProperty({
    example: 1500,
    description: 'Base fee amount per student',
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({
    example: 0,
    description: 'Default discount or waiver amount',
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional({
    example: 'October',
    description: 'Billing month (e.g., October, November)',
  })
  @IsOptional()
  @IsString()
  month?: string;

  @ApiProperty({
    example: 2026,
    description: 'Billing academic year',
  })
  @IsNumber()
  year: number;

  @ApiProperty({
    example: '2026-10-31T23:59:59.000Z',
    description: 'Payment due date',
  })
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({
    enum: PaymentMode,
    example: PaymentMode.PERSONAL_PAYMENT,
    description:
      'Payment collection mode (PERSONAL_PAYMENT or SCHOOL_CARE_PAYMENT). If omitted, uses school default setting.',
  })
  @IsOptional()
  @IsEnum(PaymentMode)
  paymentMode?: PaymentMode;
}
