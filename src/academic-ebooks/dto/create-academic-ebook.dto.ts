import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsUUID,
  IsUrl,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAcademicEbookDto {
  @ApiProperty({ example: 'Class 6 Mathematics', description: 'Title of the eBook' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'NCTB', description: 'Author or publisher of the book' })
  @IsString()
  author: string;

  @ApiProperty({ example: 'uuid-of-class', description: 'Class ID this book belongs to' })
  @IsUUID()
  classId: string;

  @ApiProperty({ example: 'Mathematics', required: false })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiProperty({
    example: 'https://storage.googleapis.com/bucket/cover.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  coverImageUrl?: string;

  @ApiProperty({
    example: 'https://storage.googleapis.com/bucket/book.pdf',
    description: 'Firebase Storage URL of the uploaded PDF',
  })
  @IsString()
  pdfUrl: string;

  @ApiProperty({ example: 'An official textbook for class 6.', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 220, required: false, description: 'Total number of pages' })
  @IsInt()
  @Min(1)
  @IsOptional()
  totalPages?: number;

  @ApiProperty({ example: 2024, required: false })
  @IsInt()
  @Min(1900)
  @Max(2100)
  @IsOptional()
  publishedYear?: number;

  @ApiProperty({ example: true, required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
