import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OnlineClassesService } from './online-classes.service';
import { OnlineClassesController } from './online-classes.controller';
import { OnlineClass } from './entities/online-class.entity';
import { Class } from '../classes/entities/class.entity';
import { Section } from '../sections/entities/section.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OnlineClass, Class, Section, Subject, User])],
  controllers: [OnlineClassesController],
  providers: [OnlineClassesService],
  exports: [OnlineClassesService],
})
export class OnlineClassesModule {}
