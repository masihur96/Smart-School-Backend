import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
} from 'class-validator';

export class StartConversationDto {
  @ApiProperty({
    example: '11111111-2222-3333-4444-555555555555',
    description: 'Target recipient user UUID to start a conversation with',
  })
  @IsUUID()
  @IsNotEmpty()
  recipientId: string;

  @ApiPropertyOptional({
    example: 'Hello! I have a question regarding today’s class.',
    description: 'Optional initial message to send immediately',
  })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({
    example: ['https://example.com/uploads/homework.png'],
    description: 'Optional attachment URLs',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}
