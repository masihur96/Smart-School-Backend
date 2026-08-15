import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { IssuedBook } from '../entities/issued-book.entity';
import { Book } from '../entities/book.entity';
import { IssueBookDto } from '../dto/issue-book.dto';

@Injectable()
export class IssuedBooksService {
  private readonly logger = new Logger(IssuedBooksService.name);

  constructor(
    @InjectRepository(IssuedBook)
    private issuedBookRepository: Repository<IssuedBook>,
    @InjectRepository(Book)
    private bookRepository: Repository<Book>,
  ) {}

  async issueBook(issueBookDto: IssueBookDto, schoolId: string): Promise<IssuedBook> {
    const { bookId, studentId, dueDate } = issueBookDto;

    const book = await this.bookRepository.findOne({ where: { id: bookId, schoolId } });
    if (!book) {
      throw new NotFoundException('Book not found');
    }
    if (!book.isAvailable) {
      throw new BadRequestException('Book is already issued or not available');
    }

    // Mark book unavailable
    book.isAvailable = false;
    await this.bookRepository.save(book);

    // Create issued book record
    const issuedBook = this.issuedBookRepository.create({
      bookId,
      schoolId,
      studentId,
      dueDate: new Date(dueDate),
    });

    const saved = await this.issuedBookRepository.save(issuedBook);
    this.logger.log(`Book ${bookId} issued to student ${studentId}, due: ${dueDate}`);
    return saved;
  }

  async findAll(schoolId: string, status?: string): Promise<IssuedBook[]> {
    const qb = this.issuedBookRepository
      .createQueryBuilder('issuedBook')
      .leftJoinAndSelect('issuedBook.book', 'book')
      .where('issuedBook.schoolId = :schoolId', { schoolId })
      .orderBy('issuedBook.issueDate', 'DESC');

    if (status === 'active') {
      qb.andWhere('issuedBook.returnDate IS NULL');
    } else if (status === 'returned') {
      qb.andWhere('issuedBook.returnDate IS NOT NULL');
    } else if (status === 'overdue') {
      qb.andWhere('issuedBook.returnDate IS NULL')
        .andWhere('issuedBook.dueDate < :now', { now: new Date() });
    }

    return qb.getMany();
  }

  async findByStudent(studentId: string, schoolId: string): Promise<IssuedBook[]> {
    return this.issuedBookRepository
      .createQueryBuilder('issuedBook')
      .leftJoinAndSelect('issuedBook.book', 'book')
      .where('issuedBook.schoolId = :schoolId', { schoolId })
      .andWhere('issuedBook.studentId = :studentId', { studentId })
      .orderBy('issuedBook.issueDate', 'DESC')
      .getMany();
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

    // Mark book available again
    if (issuedBook.book) {
      issuedBook.book.isAvailable = true;
      await this.bookRepository.save(issuedBook.book);
    } else {
      // Fallback: update directly by bookId
      await this.bookRepository.update({ id: issuedBook.bookId, schoolId }, { isAvailable: true });
    }

    this.logger.log(`Book returned: issuedBook ${id}`);
    return issuedBook;
  }
}
