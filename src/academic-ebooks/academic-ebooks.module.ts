import { Module } from '@nestjs/common';
import { AcademicBooksModule } from '../academic-books/academic-books.module';
import { AcademicEbooksController } from './academic-ebooks.controller';

@Module({
  imports: [AcademicBooksModule],
  controllers: [AcademicEbooksController],
})
export class AcademicEbooksModule {}
