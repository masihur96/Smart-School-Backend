import { IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitTeacherAttendanceDto {
  @ApiProperty({ example: 23.8103, description: 'Current latitude' })
  @IsNumber()
  @IsNotEmpty()
  lat: number;

  @ApiProperty({ example: 90.4125, description: 'Current longitude' })
  @IsNumber()
  @IsNotEmpty()
  lon: number;
}
