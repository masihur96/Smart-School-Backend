import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarksService } from './marks.service';
import { MarksController } from './marks.controller';
import { Marks } from './entities/marks.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Marks])],
  providers: [MarksService],
  controllers: [MarksController],
  exports: [MarksService],
})
export class MarksModule {}
