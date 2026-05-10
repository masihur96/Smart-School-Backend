import {
  IsString,
  IsUUID,
  IsNumber,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MarkItemDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-4g7h-8i9j-0k1l2m3n4o5p' })
  @IsUUID()
  studentId: string;

  @ApiProperty({ example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d' })
  @IsUUID()
  subjectId: string;

  @ApiProperty({ example: 85.5 })
  @IsNumber()
  marksObtained: number;

  @ApiProperty({ example: 100 })
  @IsNumber()
  totalMarks: number;

  @ApiPropertyOptional({ example: 'Excellent performance' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class SubmitMarksDto {
  @ApiProperty({ example: '79b88307-59d4-42f0-9b6f-7f7e9a8d2e8b' })
  @IsUUID()
  examId: string;

  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  @IsUUID()
  teacherId: string;

  @ApiProperty({ example: 'd1a8e234-789a-4cde-b567-f8e9d0c1b2a3' })
  @IsUUID()
  schoolId: string;

  @ApiProperty({ type: [MarkItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MarkItemDto)
  marks: MarkItemDto[];
}
