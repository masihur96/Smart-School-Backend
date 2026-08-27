import { IsString, IsNotEmpty, IsOptional, IsDate, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOnlineClassDto {
  @ApiProperty({ example: 'Math Class 101' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Introduction to Algebra' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'https://meet.google.com/abc-defg-hij' })
  @IsString()
  @IsNotEmpty()
  meetLink: string;

  @ApiProperty({ example: '2026-08-15T10:00:00Z' })
  @IsDate()
  @IsNotEmpty()
  date: Date;

  @ApiPropertyOptional({ example: '10:00 AM' })
  @IsString()
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional({ example: '11:00 AM' })
  @IsString()
  @IsOptional()
  endTime?: string;

  @ApiPropertyOptional({ example: 'c4d3269b-1234-4a21-93e1-456789abcdef' })
  @IsString()
  @IsOptional()
  classId?: string;

  @ApiPropertyOptional({ example: 'b1a2345c-5678-4b32-82d2-123456abcdef' })
  @IsString()
  @IsOptional()
  sectionId?: string;

  @ApiPropertyOptional({ example: 'd9c8765e-9876-4c43-91e3-abcdef123456' })
  @IsString()
  @IsOptional()
  subjectId?: string;

  @ApiPropertyOptional({ example: ['c4d3269b-1234-4a21-93e1-456789abcdef'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  participantUuids?: string[];
}
