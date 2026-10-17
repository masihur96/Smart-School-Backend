import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateAcademicCalendarEventDto } from './create-academic-calendar-event.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateAcademicCalendarEventDto extends PartialType(
  CreateAcademicCalendarEventDto,
) {
  @ApiPropertyOptional({
    example: true,
    description: 'Whether the event is active',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
