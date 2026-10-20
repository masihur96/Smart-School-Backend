import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  IsArray,
} from 'class-validator';
import {
  RequestComplaintType,
  RequestComplaintCategory,
  RequestComplaintPriority,
} from '../entities/request-complaint.entity';

export class CreateRequestComplaintDto {
  @ApiProperty({
    enum: RequestComplaintType,
    example: RequestComplaintType.REQUEST,
    description: 'Type of submission: REQUEST or COMPLAINT',
  })
  @IsEnum(RequestComplaintType)
  @IsNotEmpty()
  type: RequestComplaintType;

  @ApiProperty({
    example: 'Leave request for medical reasons',
    description: 'Title of the request or complaint',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  title: string;

  @ApiProperty({
    example: 'I will be unable to attend classes from 2026-10-25 to 2026-10-27 due to illness.',
    description: 'Detailed description of the request or complaint',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  description: string;

  @ApiPropertyOptional({
    enum: RequestComplaintCategory,
    example: RequestComplaintCategory.LEAVE,
    description: 'Category of the request/complaint',
    default: RequestComplaintCategory.OTHER,
  })
  @IsOptional()
  @IsEnum(RequestComplaintCategory)
  category?: RequestComplaintCategory;

  @ApiPropertyOptional({
    enum: RequestComplaintPriority,
    example: RequestComplaintPriority.MEDIUM,
    description: 'Priority level (LOW, MEDIUM, HIGH, URGENT)',
    default: RequestComplaintPriority.MEDIUM,
  })
  @IsOptional()
  @IsEnum(RequestComplaintPriority)
  priority?: RequestComplaintPriority;

  @ApiPropertyOptional({
    example: 'a0b1c2d3-e4f5-6789-0123-456789abcdef',
    description:
      'Recipient user UUID. For student: must be class teacher or admin. For teacher: must be admin. For admin: teacher or student. If omitted by student/teacher, targets school admin queue.',
  })
  @IsOptional()
  @IsUUID()
  recipientId?: string;

  @ApiPropertyOptional({
    example: ['https://example.com/uploads/doctor-note.pdf'],
    description: 'List of document/image attachment URLs',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @ApiPropertyOptional({
    example: 'uuid-of-school',
    description: 'School UUID (Only applicable if submitted by SuperAdmin)',
  })
  @IsOptional()
  @IsUUID()
  schoolId?: string;
}
