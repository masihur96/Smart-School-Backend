import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BooksService } from './books/books.service';
import { BooksController } from './books/books.controller';
import { IssuedBooksService } from './issued-books/issued-books.service';
import { IssuedBooksController } from './issued-books/issued-books.controller';
import { Book } from './entities/book.entity';
import { IssuedBook } from './entities/issued-book.entity';
import { Class } from '../classes/entities/class.entity';
import { Section } from '../sections/entities/section.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Book, IssuedBook, Class, Section])],
  controllers: [BooksController, IssuedBooksController],
  providers: [BooksService, IssuedBooksService],
})
export class LibraryModule {}
