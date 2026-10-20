import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsArray,
} from 'class-validator';
import { FeeType, FeeFrequency } from '../entities/fee-structure.entity';

export class CreateFeeStructureDto {
  @ApiProperty({
    example: 'Monthly Tuition Fee - High School',
    description: 'Name of the fee structure / head',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    enum: FeeType,
    example: FeeType.TUITION,
    description: 'Category / Type of the fee',
    default: FeeType.TUITION,
  })
  @IsEnum(FeeType)
  feeType: FeeType;

  @ApiPropertyOptional({
    example: 'Standard monthly tuition charge for grades 9-10',
    description: 'Description or details',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 1500,
    description: 'Default amount for this fee',
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({
    enum: FeeFrequency,
    example: FeeFrequency.MONTHLY,
    description: 'Billing frequency (MONTHLY, TERM, ANNUAL, ONE_TIME)',
    default: FeeFrequency.MONTHLY,
  })
  @IsOptional()
  @IsEnum(FeeFrequency)
  frequency?: FeeFrequency;

  @ApiPropertyOptional({
    example: ['class-uuid-1', 'class-uuid-2'],
    description: 'Array of class IDs this fee structure applies to (leave empty for school-wide)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  classIds?: string[];
}
