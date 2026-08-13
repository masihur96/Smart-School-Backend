import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BooksService } from './books/books.service';
import { BooksController } from './books/books.controller';
import { BookRequestsService } from './book-requests/book-requests.service';
import { BookRequestsController } from './book-requests/book-requests.controller';
import { IssuedBooksService } from './issued-books/issued-books.service';
import { IssuedBooksController } from './issued-books/issued-books.controller';
import { Book } from './entities/book.entity';
import { BookRequest } from './entities/book-request.entity';
import { IssuedBook } from './entities/issued-book.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Book, BookRequest, IssuedBook])],
  controllers: [BooksController, BookRequestsController, IssuedBooksController],
  providers: [BooksService, BookRequestsService, IssuedBooksService]
})
export class LibraryModule {}
