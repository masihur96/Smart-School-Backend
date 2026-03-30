import { IsUUID, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAcademicAssignmentDto {
  @ApiProperty({ example: 'uuid-of-class' })
  @IsUUID()
  class_uid: string;

  @ApiProperty({ example: 'uuid-of-subject' })
  @IsUUID()
  subject_uid: string;

  @ApiProperty({ example: 'uuid-of-examiner-user' })
  @IsUUID()
  examiner_uid: string;

  @ApiProperty({ example: '2025-06-15' })
  @IsDateString()
  date: string;
}
