import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OnlineClassesService } from './online-classes.service';
import { OnlineClassesController } from './online-classes.controller';
import { OnlineClass } from './entities/online-class.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OnlineClass])],
  controllers: [OnlineClassesController],
  providers: [OnlineClassesService],
  exports: [OnlineClassesService],
})
export class OnlineClassesModule {}
