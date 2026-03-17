import { IsString, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubjectDto {
  @ApiProperty({ example: 'Mathematics' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'MATH101', required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ example: 'uuid', required: false })
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiProperty({ example: 'uuid', required: false })
  @IsOptional()
  @IsUUID()
  schoolId?: string;
}

export class UpdateSubjectDto {
  @ApiProperty({ example: 'Mathematics', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'MATH101', required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ example: 'uuid', required: false })
  @IsOptional()
  @IsUUID()
  classId?: string;

  @ApiProperty({ example: 'uuid', required: false })
  @IsOptional()
  @IsUUID()
  schoolId?: string;
}
