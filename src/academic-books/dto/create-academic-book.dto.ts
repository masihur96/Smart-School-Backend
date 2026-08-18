import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAcademicBookDto {
  @ApiProperty({ example: 'Class 9 Higher Mathematics', description: 'Title of the academic book' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'National Curriculum and Textbook Board (NCTB)', description: 'Author or publisher of the book' })
  @IsString()
  author: string;

  @ApiProperty({ example: 'uuid-of-class', description: 'Class ID this book belongs to' })
  @IsUUID()
  classId: string;

  @ApiPropertyOptional({ example: 'uuid-of-subject', description: 'Subject ID if linked to a registered subject' })
  @IsUUID()
  @IsOptional()
  subjectId?: string;

  @ApiPropertyOptional({ example: 'Higher Mathematics', description: 'Subject name fallback' })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiPropertyOptional({ example: '2024 Edition' })
  @IsString()
  @IsOptional()
  edition?: string;

  @ApiPropertyOptional({
    example: 'https://example.supabase.co/storage/v1/object/public/uploads/cover.jpg',
    description: 'URL of the book cover thumbnail image',
  })
  @IsString()
  @IsOptional()
  coverImageUrl?: string;

  @ApiProperty({
    example: 'https://example.supabase.co/storage/v1/object/public/uploads/book.pdf',
    description: 'URL of the uploaded PDF book',
  })
  @IsString()
  pdfUrl: string;

  @ApiPropertyOptional({ example: 15485760, description: 'File size in bytes' })
  @IsInt()
  @IsOptional()
  fileSize?: number;

  @ApiPropertyOptional({ example: 'Standard syllabus textbook for secondary education.', description: 'Description or synopsis' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 280, description: 'Total number of pages in the PDF' })
  @IsInt()
  @Min(1)
  @IsOptional()
  totalPages?: number;

  @ApiPropertyOptional({ example: 2024, description: 'Year of publication' })
  @IsInt()
  @Min(1900)
  @Max(2100)
  @IsOptional()
  publishedYear?: number;

  @ApiPropertyOptional({ example: true, default: true, description: 'Whether the book is active and accessible' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
