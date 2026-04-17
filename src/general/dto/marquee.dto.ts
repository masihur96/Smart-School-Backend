import { IsString, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MarqueeType } from '../entities/marquee.entity';

export class SetMarqueeDto {
  @ApiProperty({ example: 'Welcome to our school!', description: 'The marquee text content' })
  @IsString()
  text: string;

  @ApiProperty({ enum: MarqueeType, example: MarqueeType.STUDENT })
  @IsEnum(MarqueeType)
  type: MarqueeType;

  @ApiProperty({ example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  @IsUUID()
  schoolId: string;
}
