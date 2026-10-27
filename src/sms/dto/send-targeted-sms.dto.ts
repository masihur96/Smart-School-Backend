import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { SmsTargetAudience } from '../entities/sms-log.entity';

export class SendTargetedSmsDto {
  @ApiProperty({
    description: 'Target audience group to send SMS to',
    enum: SmsTargetAudience,
    example: SmsTargetAudience.CLASS,
  })
  @IsEnum(SmsTargetAudience)
  @IsNotEmpty()
  targetAudience: SmsTargetAudience;

  @ApiPropertyOptional({
    description: 'Class ID if targeting a specific class or section',
    example: 'd9b2d63d-a233-4f9e-bb9e-28b9fb6b6e40',
  })
  @IsUUID()
  @IsOptional()
  classId?: string;

  @ApiPropertyOptional({
    description: 'Section ID if targeting a specific section',
    example: 'c12920f0-8c22-4bb3-93cf-a0352ff9900c',
  })
  @IsUUID()
  @IsOptional()
  sectionId?: string;

  @ApiPropertyOptional({
    description: 'For students, whether to deliver SMS to guardian phone numbers (default: true)',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  sendToGuardians?: boolean = true;

  @ApiPropertyOptional({
    description: 'For students, whether to deliver SMS also to student personal phones (default: false)',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  sendToStudents?: boolean = false;

  @ApiProperty({
    description: 'The SMS message content (supports English and Bangla/Unicode)',
    example: 'Dear Parent, Monthly exam results have been published in the portal.',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    description: 'Sender ID / CLI registered in White Info BD portal',
    example: '8809639228910',
  })
  @IsString()
  @IsOptional()
  senderId?: string;

  @ApiPropertyOptional({
    description: 'Optional campaign title',
    example: 'Class 9 Exam Result Notification',
  })
  @IsString()
  @IsOptional()
  campaignName?: string;
}
