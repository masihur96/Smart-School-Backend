import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BookRequestStatus } from '../entities/book-request.entity';

export class UpdateBookRequestDto {
  @ApiProperty({ example: BookRequestStatus.ACCEPTED, enum: BookRequestStatus, description: 'The new status of the book request' })
  @IsEnum(BookRequestStatus)
  @IsNotEmpty()
  status: BookRequestStatus;
}
