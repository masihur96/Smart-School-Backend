import { IsUUID, IsNotEmpty } from 'class-validator';

export class CreateBookRequestDto {
  @IsUUID()
  @IsNotEmpty()
  bookId: string;
}
