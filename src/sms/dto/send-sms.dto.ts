import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SendSmsDto {
  @ApiProperty({
    description: 'Array of mobile numbers to send SMS to',
    example: ['8801XXXXXXXXX', '8801YYYYYYYYY'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  mobNumbers: string[];

  @ApiProperty({
    description: 'The SMS message content',
    example: 'Hello from Smart School!',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    description: 'Whether to use the masked sender name (true) or non-masked (false)',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isMasked?: boolean = false;
}

