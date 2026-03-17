import { IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSectionDto {
  @ApiProperty({ example: 'Section A', description: 'The name of the section' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'uuid', description: 'The ID of the class this section belongs to' })
  @IsUUID()
  classId: string;
}

export class UpdateSectionDto {
  @ApiProperty({ example: 'Section B', description: 'The name of the section', required: false })
  @IsString()
  name?: string;

  @ApiProperty({ example: 'uuid', description: 'The ID of the class this section belongs to', required: false })
  @IsUUID()
  classId?: string;
}
