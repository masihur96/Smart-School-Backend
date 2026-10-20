import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
} from 'class-validator';

export class SendMessageDto {
  @ApiPropertyOptional({
    example: '11111111-2222-3333-4444-555555555555',
    description:
      'Conversation UUID (optional if recipientId is specified, or when posting to /chat/conversations/:id/messages)',
  })
  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @ApiPropertyOptional({
    example: '22222222-3333-4444-5555-666666666666',
    description: 'Target recipient user UUID (optional if conversationId is provided)',
  })
  @IsOptional()
  @IsUUID()
  recipientId?: string;

  @ApiProperty({
    example: 'Thank you for explaining, I understand now!',
    description: 'Text content of the message',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    example: ['https://example.com/uploads/notes.pdf'],
    description: 'Optional document or image attachment URLs',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}
