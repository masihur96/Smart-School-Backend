import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { ClassesModule } from '../classes/classes.module';
import { SectionsModule } from '../sections/sections.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), ClassesModule, SectionsModule],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
