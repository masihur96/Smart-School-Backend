import { Type } from 'class-transformer';
import { ValidateNested, ArrayMinSize, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateAcademicCalendarEventDto } from './create-academic-calendar-event.dto';

export class BulkCreateAcademicCalendarDto {
  @ApiProperty({
    type: [CreateAcademicCalendarEventDto],
    description: 'Array of academic calendar events to create in bulk',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateAcademicCalendarEventDto)
  events: CreateAcademicCalendarEventDto[];
}
