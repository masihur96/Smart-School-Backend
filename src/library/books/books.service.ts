import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Book } from '../entities/book.entity';
import { CreateBookDto } from '../dto/create-book.dto';
import { UpdateBookDto } from '../dto/update-book.dto';

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book)
    private bookRepository: Repository<Book>,
  ) {}

  async create(createBookDto: CreateBookDto, schoolId: string): Promise<Book> {
    const book = this.bookRepository.create({
      ...createBookDto,
      schoolId,
    });
    return this.bookRepository.save(book);
  }

  async findAll(schoolId: string, search?: string, category?: string): Promise<Book[]> {
    const where: any = { schoolId };

    if (search) {
      where.title = ILike(`%${search}%`);
      // Optional: search by author as well
      // where = [{ schoolId, title: ILike(`%${search}%`) }, { schoolId, author: ILike(`%${search}%`) }];
    }

    if (category) {
      where.category = category;
    }

    return this.bookRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, schoolId: string): Promise<Book> {
    const book = await this.bookRepository.findOne({ where: { id, schoolId } });
    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }
    return book;
  }

  async update(id: string, updateBookDto: UpdateBookDto, schoolId: string): Promise<Book> {
    const book = await this.findOne(id, schoolId);
    Object.assign(book, updateBookDto);
    return this.bookRepository.save(book);
  }

  async remove(id: string, schoolId: string): Promise<void> {
    const book = await this.findOne(id, schoolId);
    await this.bookRepository.remove(book);
  }
}
