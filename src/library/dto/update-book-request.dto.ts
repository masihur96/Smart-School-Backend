import { IsEnum, IsNotEmpty } from 'class-validator';
import { BookRequestStatus } from '../entities/book-request.entity';

export class UpdateBookRequestDto {
  @IsEnum(BookRequestStatus)
  @IsNotEmpty()
  status: BookRequestStatus;
}
