import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcademicBook } from './entities/academic-book.entity';
import { AcademicBookReadingProgress } from './entities/academic-book-progress.entity';
import { Class } from '../classes/entities/class.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { AcademicBooksService } from './academic-books.service';
import { AcademicBooksController } from './academic-books.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AcademicBook,
      AcademicBookReadingProgress,
      Class,
      Subject,
    ]),
  ],
  controllers: [AcademicBooksController],
  providers: [AcademicBooksService],
  exports: [AcademicBooksService],
})
export class AcademicBooksModule {}
