import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AddCommentDto {
  @ApiProperty({
    example: 'Please make sure to submit homework assignments upon return.',
    description: 'Message or comment content',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    example: ['https://example.com/uploads/response-doc.pdf'],
    description: 'Optional attachment URLs',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}
