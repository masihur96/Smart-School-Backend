import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDateString, IsBoolean } from 'class-validator';

export class AssignSubscriptionDto {
  @ApiProperty({ example: 'SCHOOL_123', description: 'The unique ID of the school' })
  @IsString()
  @IsNotEmpty()
  schoolId: string;

  @ApiProperty({ example: 'uuid-of-pricing-plan', description: 'The ID of the Pricing Plan' })
  @IsString()
  @IsNotEmpty()
  pricingPlanId: string;

  @ApiProperty({ example: '2026-04-10T00:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  startDate?: Date;

  @ApiProperty({ example: '2027-04-10T00:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  endDate?: Date;

  @ApiProperty({ example: true, required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
