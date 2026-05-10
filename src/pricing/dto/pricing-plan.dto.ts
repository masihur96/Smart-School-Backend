import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreatePricingPlanDto {
  @ApiProperty({
    example: 'Starter',
    description: 'The name of the pricing plan',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 100,
    description: 'Maximum number of students',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  maxStudents?: number;

  @ApiProperty({
    example: 0,
    description: 'Minimum number of students',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  minStudents?: number;

  @ApiProperty({
    example: '1000',
    description: 'Monthly price in BDT',
    required: false,
  })
  @IsString()
  @IsOptional()
  pricePerMonth?: string;

  @ApiProperty({
    example: '10',
    description: 'Price per student in BDT',
    required: false,
  })
  @IsString()
  @IsOptional()
  pricePerStudent?: string;

  @ApiProperty({
    example: 'Perfect for small schools',
    description: 'Plan description',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: false,
    description: 'Whether this is a custom enterprise plan',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isCustom?: boolean;
}

export class UpdatePricingPlanDto {
  @ApiProperty({ example: 'Updated Starter', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 150, required: false })
  @IsNumber()
  @IsOptional()
  maxStudents?: number;

  @ApiProperty({ example: 10, required: false })
  @IsNumber()
  @IsOptional()
  minStudents?: number;

  @ApiProperty({ example: '1200', required: false })
  @IsString()
  @IsOptional()
  pricePerMonth?: string;

  @ApiProperty({ example: '12', required: false })
  @IsString()
  @IsOptional()
  pricePerStudent?: string;

  @ApiProperty({ example: 'Expanded plan description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isCustom?: boolean;
}
