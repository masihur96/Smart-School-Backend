import { IsInt, IsOptional, IsBoolean, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateReadingProgressDto {
  @ApiProperty({ example: 25, description: 'Current page number reached by the reader' })
  @IsInt()
  @Min(1)
  lastPage: number;

  @ApiPropertyOptional({ example: 280, description: 'Total number of pages (if known or updated)' })
  @IsInt()
  @Min(1)
  @IsOptional()
  totalPages?: number;

  @ApiPropertyOptional({ example: false, description: 'Mark whether user has completed reading the book' })
  @IsBoolean()
  @IsOptional()
  isCompleted?: boolean;
}
