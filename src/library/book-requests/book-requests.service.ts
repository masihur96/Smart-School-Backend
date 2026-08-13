import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookRequest, BookRequestStatus } from '../entities/book-request.entity';
import { Book } from '../entities/book.entity';
import { CreateBookRequestDto } from '../dto/create-book-request.dto';
import { UpdateBookRequestDto } from '../dto/update-book-request.dto';

@Injectable()
export class BookRequestsService {
  constructor(
    @InjectRepository(BookRequest)
    private bookRequestRepository: Repository<BookRequest>,
    @InjectRepository(Book)
    private bookRepository: Repository<Book>,
  ) {}

  async create(createBookRequestDto: CreateBookRequestDto, schoolId: string, studentId: string): Promise<BookRequest> {
    const book = await this.bookRepository.findOne({ where: { id: createBookRequestDto.bookId, schoolId } });
    if (!book) {
      throw new NotFoundException('Book not found');
    }
    if (!book.isAvailable) {
      throw new BadRequestException('Book is not available for request');
    }

    const request = this.bookRequestRepository.create({
      bookId: book.id,
      schoolId,
      studentId,
    });
    
    return this.bookRequestRepository.save(request);
  }

  async findAll(schoolId: string, studentId?: string): Promise<BookRequest[]> {
    const where: any = { schoolId };
    if (studentId) {
      where.studentId = studentId;
    }
    return this.bookRequestRepository.find({
      where,
      relations: ['book', 'student'],
      order: { requestDate: 'DESC' },
    });
  }

  async findOne(id: string, schoolId: string): Promise<BookRequest> {
    const request = await this.bookRequestRepository.findOne({ 
      where: { id, schoolId },
      relations: ['book', 'student'],
    });
    if (!request) {
      throw new NotFoundException(`Book request with ID ${id} not found`);
    }
    return request;
  }

  async updateStatus(id: string, updateBookRequestDto: UpdateBookRequestDto, schoolId: string): Promise<BookRequest> {
    const request = await this.findOne(id, schoolId);
    request.status = updateBookRequestDto.status;
    return this.bookRequestRepository.save(request);
  }
}
