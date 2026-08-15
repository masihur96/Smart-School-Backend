import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcademicEbook } from './entities/academic-ebook.entity';
import { AcademicEbooksService } from './academic-ebooks.service';
import { AcademicEbooksController } from './academic-ebooks.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AcademicEbook])],
  controllers: [AcademicEbooksController],
  providers: [AcademicEbooksService],
})
export class AcademicEbooksModule {}
