import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { RequestComplaintStatus } from '../entities/request-complaint.entity';

export class UpdateRequestComplaintStatusDto {
  @ApiProperty({
    enum: RequestComplaintStatus,
    example: RequestComplaintStatus.RESOLVED,
    description: 'New status for the request or complaint',
  })
  @IsEnum(RequestComplaintStatus)
  @IsNotEmpty()
  status: RequestComplaintStatus;

  @ApiPropertyOptional({
    example: 'Leave application approved for 3 days.',
    description: 'Remarks or reason for resolution / rejection / status change',
  })
  @IsOptional()
  @IsString()
  resolutionNote?: string;
}
