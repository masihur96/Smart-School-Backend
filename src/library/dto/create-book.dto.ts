import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookDto {
  @ApiProperty({ example: 'The Great Gatsby' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'F. Scott Fitzgerald' })
  @IsString()
  author: string;

  @ApiProperty({ example: '9780743273565', required: false })
  @IsString()
  @IsOptional()
  isbn?: string;

  @ApiProperty({ example: 'Fiction', required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ example: 'https://example.com/cover.jpg', required: false })
  @IsString()
  @IsOptional()
  coverImageUrl?: string;

  @ApiProperty({ example: true, required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @ApiProperty({ example: 'A classic novel of the Jazz Age.', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
