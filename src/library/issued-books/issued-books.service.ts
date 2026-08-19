import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { IssuedBook } from '../entities/issued-book.entity';
import { Book } from '../entities/book.entity';
import { Class } from '../../classes/entities/class.entity';
import { Section } from '../../sections/entities/section.entity';
import { IssueBookDto } from '../dto/issue-book.dto';

@Injectable()
export class IssuedBooksService {
  private readonly logger = new Logger(IssuedBooksService.name);

  constructor(
    @InjectRepository(IssuedBook)
    private issuedBookRepository: Repository<IssuedBook>,
    @InjectRepository(Book)
    private bookRepository: Repository<Book>,
    @InjectRepository(Class)
    private classRepository: Repository<Class>,
    @InjectRepository(Section)
    private sectionRepository: Repository<Section>,
  ) {}

  private async formatIssuedBooks(issuedBooks: IssuedBook[]): Promise<any[]> {
    if (!issuedBooks || issuedBooks.length === 0) {
      return [];
    }

    const allClassIds = new Set<string>();
    const allSectionIds = new Set<string>();

    const normalizeArray = (val: any): string[] => {
      if (!val) return [];
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') {
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) return parsed;
        } catch {
          return [val];
        }
      }
      return [];
    };

    for (const item of issuedBooks) {
      if (item.student) {
        normalizeArray(item.student.classIds).forEach((id) => allClassIds.add(id));
        normalizeArray(item.student.sectionIds).forEach((id) => allSectionIds.add(id));
      }
    }

    const classMap = new Map<string, string>();
    const sectionMap = new Map<string, string>();

    if (allClassIds.size > 0) {
      const classes = await this.classRepository.find({
        where: { id: In(Array.from(allClassIds)) },
      });
      classes.forEach((c) => classMap.set(c.id, c.name));
    }

    if (allSectionIds.size > 0) {
      const sections = await this.sectionRepository.find({
        where: { id: In(Array.from(allSectionIds)) },
      });
      sections.forEach((s) => sectionMap.set(s.id, s.name));
    }

    return issuedBooks.map((item) => {
      let student = null;
      if (item.student) {
        const classNames = normalizeArray(item.student.classIds)
          .map((id) => classMap.get(id))
          .filter(Boolean) as string[];
        const sectionNames = normalizeArray(item.student.sectionIds)
          .map((id) => sectionMap.get(id))
          .filter(Boolean) as string[];

        student = {
          id: item.student.id,
          name: item.student.name,
          phone: item.student.phone ?? null,
          avatar: item.student.avatar ?? null,
          className: classNames.length > 0 ? classNames.join(', ') : null,
          sectionName: sectionNames.length > 0 ? sectionNames.join(', ') : null,
          role: item.student.role,
        };
      }

      return {
        id: item.id,
        schoolId: item.schoolId,
        bookId: item.bookId,
        studentId: item.studentId,
        issueDate: item.issueDate,
        dueDate: item.dueDate,
        returnDate: item.returnDate,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        book: item.book,
        student,
      };
    });
  }

  private async formatIssuedBook(issuedBook: IssuedBook): Promise<any> {
    const [formatted] = await this.formatIssuedBooks([issuedBook]);
    return formatted;
  }

  async issueBook(issueBookDto: IssueBookDto, schoolId: string): Promise<any> {
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

    const result = await this.issuedBookRepository.findOne({
      where: { id: saved.id },
      relations: ['book', 'student'],
    });

    return this.formatIssuedBook(result || saved);
  }

  async findAll(schoolId: string, status?: string): Promise<any[]> {
    const qb = this.issuedBookRepository
      .createQueryBuilder('issuedBook')
      .leftJoinAndSelect('issuedBook.book', 'book')
      .leftJoinAndSelect('issuedBook.student', 'student')
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

    const issuedBooks = await qb.getMany();
    return this.formatIssuedBooks(issuedBooks);
  }

  async findByStudent(studentId: string, schoolId: string): Promise<any[]> {
    const issuedBooks = await this.issuedBookRepository
      .createQueryBuilder('issuedBook')
      .leftJoinAndSelect('issuedBook.book', 'book')
      .leftJoinAndSelect('issuedBook.student', 'student')
      .where('issuedBook.schoolId = :schoolId', { schoolId })
      .andWhere('issuedBook.studentId = :studentId', { studentId })
      .orderBy('issuedBook.issueDate', 'DESC')
      .getMany();

    return this.formatIssuedBooks(issuedBooks);
  }

  async returnBook(id: string, schoolId: string): Promise<any> {
    const issuedBook = await this.issuedBookRepository.findOne({
      where: { id, schoolId },
      relations: ['book', 'student'],
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
    return this.formatIssuedBook(issuedBook);
  }
}
