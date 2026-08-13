import { IsUUID, IsNotEmpty, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class IssueBookDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'UUID of the book to issue' })
  @IsUUID()
  @IsNotEmpty()
  bookId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001', description: 'UUID of the student receiving the book' })
  @IsUUID()
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ example: '2026-08-30T18:00:00.000Z', description: 'Due date for the book return' })
  @IsDateString()
  @IsNotEmpty()
  dueDate: string;
}
