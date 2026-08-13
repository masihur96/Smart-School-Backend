import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { IssuedBook } from '../entities/issued-book.entity';
import { Book } from '../entities/book.entity';
import { IssueBookDto } from '../dto/issue-book.dto';

@Injectable()
export class IssuedBooksService {
  constructor(
    @InjectRepository(IssuedBook)
    private issuedBookRepository: Repository<IssuedBook>,
    @InjectRepository(Book)
    private bookRepository: Repository<Book>,
  ) {}

  async issueBook(issueBookDto: IssueBookDto, schoolId: string): Promise<IssuedBook> {
    const { bookId, studentId, dueDate } = issueBookDto;

    // Use a transaction or sequential checks
    const book = await this.bookRepository.findOne({ where: { id: bookId, schoolId } });
    if (!book) {
      throw new NotFoundException('Book not found');
    }
    if (!book.isAvailable) {
      throw new BadRequestException('Book is already issued or not available');
    }

    // Set book as unavailable
    book.isAvailable = false;
    await this.bookRepository.save(book);

    // Create issued book record
    const issuedBook = this.issuedBookRepository.create({
      bookId,
      schoolId,
      studentId,
      dueDate,
    });

    return this.issuedBookRepository.save(issuedBook);
  }

  async findAll(schoolId: string, status?: string): Promise<IssuedBook[]> {
    const where: any = { schoolId };
    
    if (status === 'active') {
      where.returnDate = IsNull();
    } else if (status === 'overdue') {
      // Overdue is active AND dueDate < now
      // This requires query builder for accurate time comparison in TypeORM, 
      // but for simplicity we can use query builder for this condition.
      return this.issuedBookRepository
        .createQueryBuilder('issuedBook')
        .leftJoinAndSelect('issuedBook.book', 'book')
        .leftJoinAndSelect('issuedBook.student', 'student')
        .where('issuedBook.schoolId = :schoolId', { schoolId })
        .andWhere('issuedBook.returnDate IS NULL')
        .andWhere('issuedBook.dueDate < :now', { now: new Date() })
        .getMany();
    }

    return this.issuedBookRepository.find({
      where,
      relations: ['book', 'student'],
      order: { issueDate: 'DESC' },
    });
  }

  async returnBook(id: string, schoolId: string): Promise<IssuedBook> {
    const issuedBook = await this.issuedBookRepository.findOne({
      where: { id, schoolId },
      relations: ['book'],
    });

    if (!issuedBook) {
      throw new NotFoundException('Issued book record not found');
    }
    if (issuedBook.returnDate) {
      throw new BadRequestException('Book has already been returned');
    }

    issuedBook.returnDate = new Date();
    await this.issuedBookRepository.save(issuedBook);

    if (issuedBook.book) {
      issuedBook.book.isAvailable = true;
      await this.bookRepository.save(issuedBook.book);
    }

    return issuedBook;
  }
}
