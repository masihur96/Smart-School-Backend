import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookRequestDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'UUID of the book to request' })
  @IsUUID()
  @IsNotEmpty()
  bookId: string;
}
