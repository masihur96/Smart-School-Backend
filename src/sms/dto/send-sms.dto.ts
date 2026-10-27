import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class SendSmsDto {
  @ApiPropertyOptional({
    description: 'Array or comma-separated list of mobile numbers',
    example: ['01713252758', '01800000000'],
  })
  @IsOptional()
  mobNumbers?: string[];

  @ApiPropertyOptional({
    description: 'Array or comma-separated string of mobile numbers (White Info BD format)',
    example: ['01713252758', '8801812345678'],
  })
  @IsOptional()
  numbers?: string[] | string;

  @ApiProperty({
    description: 'The SMS message content (English up to 160 chars / Bangla up to 70 chars per SMS)',
    example: 'Notice: School will remain closed tomorrow due to heavy rain.',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    description: 'Sender ID / Mask / CLI registered in White Info BD portal',
    example: '8809639228910',
  })
  @IsString()
  @IsOptional()
  senderId?: string;

  @ApiPropertyOptional({
    description: 'Optional campaign or batch title for record-keeping',
    example: 'Emergency Weather Notice',
  })
  @IsString()
  @IsOptional()
  campaignName?: string;

  @ApiPropertyOptional({
    description: 'Whether to use masked sender name (legacy compatibility)',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isMasked?: boolean = false;
}
