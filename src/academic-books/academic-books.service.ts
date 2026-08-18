import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AcademicBook } from './entities/academic-book.entity';
import { AcademicBookReadingProgress } from './entities/academic-book-progress.entity';
import { Class } from '../classes/entities/class.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { CreateAcademicBookDto } from './dto/create-academic-book.dto';
import { UpdateAcademicBookDto } from './dto/update-academic-book.dto';
import { UpdateReadingProgressDto } from './dto/update-reading-progress.dto';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class AcademicBooksService {
  private readonly logger = new Logger(AcademicBooksService.name);
  private supabase: SupabaseClient | null = null;

  constructor(
    @InjectRepository(AcademicBook)
    private readonly bookRepository: Repository<AcademicBook>,
    @InjectRepository(AcademicBookReadingProgress)
    private readonly progressRepository: Repository<AcademicBookReadingProgress>,
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
    private readonly configService: ConfigService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }

  /**
   * Create a new Academic Book
   */
  async create(
    createDto: CreateAcademicBookDto,
    schoolId: string,
  ): Promise<AcademicBook> {
    try {
      this.logger.log(
        `Creating academic book for schoolId: ${schoolId}, classId: ${createDto.classId}`,
      );

      // Validate class exists
      const classEntity = await this.classRepository.findOne({
        where: { id: createDto.classId, schoolId },
      });
      if (!classEntity) {
        throw new NotFoundException(`Class with ID ${createDto.classId} not found in this school`);
      }

      // If subjectId is provided, populate subject name if not already set
      if (createDto.subjectId && !createDto.subject) {
        const subject = await this.subjectRepository.findOne({
          where: { id: createDto.subjectId, schoolId },
        });
        if (subject) {
          createDto.subject = subject.name;
        }
      }

      const book = this.bookRepository.create({
        ...createDto,
        schoolId,
      });

      const saved = await this.bookRepository.save(book);
      this.logger.log(`Academic book created successfully: ${saved.id}`);
      return this.findOne(saved.id, schoolId);
    } catch (error) {
      this.logger.error(`Failed to create book for schoolId ${schoolId}:`, error);
      throw error;
    }
  }

  /**
   * Find all books with optional class, subject, and search filters
   */
  async findAll(
    schoolId: string,
    filters?: {
      classId?: string;
      subjectId?: string;
      subject?: string;
      search?: string;
      user?: any;
    },
  ): Promise<AcademicBook[]> {
    const query = this.bookRepository
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.classEntity', 'class')
      .leftJoinAndSelect('book.subjectEntity', 'subject')
      .where('book.schoolId = :schoolId', { schoolId })
      .andWhere('book.isActive = :isActive', { isActive: true });

    // Role-based class filtering for students
    if (filters?.user?.role === UserRole.STUDENT && !filters.classId) {
      const studentClassIds = filters.user.classIds || [];
      if (studentClassIds.length > 0) {
        query.andWhere('book.classId IN (:...studentClassIds)', {
          studentClassIds,
        });
      }
    } else if (filters?.classId) {
      query.andWhere('book.classId = :classId', { classId: filters.classId });
    }

    if (filters?.subjectId) {
      query.andWhere('book.subjectId = :subjectId', {
        subjectId: filters.subjectId,
      });
    }

    if (filters?.subject) {
      query.andWhere('LOWER(book.subject) = LOWER(:subject)', {
        subject: filters.subject,
      });
    }

    if (filters?.search) {
      query.andWhere(
        '(LOWER(book.title) LIKE :search OR LOWER(book.author) LIKE :search OR LOWER(book.description) LIKE :search)',
        { search: `%${filters.search.toLowerCase()}%` },
      );
    }

    query.orderBy('book.createdAt', 'DESC');
    return query.getMany();
  }

  /**
   * Get academic books grouped class-wise
   */
  async getBooksByClass(schoolId: string) {
    const classes = await this.classRepository.find({
      where: { schoolId },
      order: { name: 'ASC' },
    });

    const books = await this.bookRepository.find({
      where: { schoolId, isActive: true },
      relations: ['subjectEntity'],
      order: { title: 'ASC' },
    });

    // Group books by classId
    const classBookMap = new Map<string, AcademicBook[]>();
    for (const book of books) {
      const list = classBookMap.get(book.classId) || [];
      list.push(book);
      classBookMap.set(book.classId, list);
    }

    return classes.map((cls) => {
      const classBooks = classBookMap.get(cls.id) || [];
      return {
        classId: cls.id,
        className: cls.name,
        description: cls.description,
        totalBooks: classBooks.length,
        books: classBooks,
      };
    });
  }

  /**
   * Get single book by ID, optionally fetching reading progress for current user
   */
  async findOne(
    id: string,
    schoolId: string,
    userId?: string,
  ): Promise<any> {
    const book = await this.bookRepository.findOne({
      where: { id, schoolId },
      relations: ['classEntity', 'subjectEntity'],
    });

    if (!book) {
      throw new NotFoundException(`Academic book with ID ${id} not found`);
    }

    let readingProgress: AcademicBookReadingProgress | null = null;
    if (userId) {
      readingProgress = await this.progressRepository.findOne({
        where: { bookId: id, userId },
      });
    }

    return {
      ...book,
      readingProgress: readingProgress
        ? {
            lastPage: readingProgress.lastPage,
            totalPages: readingProgress.totalPages || book.totalPages,
            isCompleted: readingProgress.isCompleted,
            progressPercentage:
              readingProgress.totalPages || book.totalPages
                ? Math.min(
                    100,
                    Math.round(
                      (readingProgress.lastPage /
                        (readingProgress.totalPages || book.totalPages || 1)) *
                        100,
                    ),
                  )
                : 0,
            lastReadAt: readingProgress.lastReadAt,
          }
        : null,
    };
  }

  /**
   * Update academic book
   */
  async update(
    id: string,
    updateDto: UpdateAcademicBookDto,
    schoolId: string,
  ): Promise<AcademicBook> {
    const book = await this.bookRepository.findOne({
      where: { id, schoolId },
    });
    if (!book) {
      throw new NotFoundException(`Academic book with ID ${id} not found`);
    }

    if (updateDto.classId && updateDto.classId !== book.classId) {
      const classEntity = await this.classRepository.findOne({
        where: { id: updateDto.classId, schoolId },
      });
      if (!classEntity) {
        throw new NotFoundException(`Class with ID ${updateDto.classId} not found`);
      }
    }

    Object.assign(book, updateDto);
    await this.bookRepository.save(book);
    return this.findOne(id, schoolId);
  }

  /**
   * Delete academic book
   */
  async remove(id: string, schoolId: string): Promise<void> {
    const book = await this.bookRepository.findOne({
      where: { id, schoolId },
    });
    if (!book) {
      throw new NotFoundException(`Academic book with ID ${id} not found`);
    }
    await this.bookRepository.softRemove(book);
  }

  /**
   * Save user reading progress (e.g., page 24 of 200)
   */
  async saveProgress(
    bookId: string,
    userId: string,
    schoolId: string,
    dto: UpdateReadingProgressDto,
  ): Promise<AcademicBookReadingProgress> {
    const book = await this.bookRepository.findOne({
      where: { id: bookId, schoolId },
    });
    if (!book) {
      throw new NotFoundException(`Academic book with ID ${bookId} not found`);
    }

    let progress = await this.progressRepository.findOne({
      where: { bookId, userId },
    });

    const totalPages = dto.totalPages || book.totalPages;
    const isCompleted =
      dto.isCompleted !== undefined
        ? dto.isCompleted
        : totalPages
        ? dto.lastPage >= totalPages
        : false;

    if (progress) {
      progress.lastPage = dto.lastPage;
      if (totalPages) progress.totalPages = totalPages;
      progress.isCompleted = isCompleted;
      progress.lastReadAt = new Date();
    } else {
      progress = this.progressRepository.create({
        bookId,
        userId,
        lastPage: dto.lastPage,
        totalPages,
        isCompleted,
        lastReadAt: new Date(),
      });
    }

    return this.progressRepository.save(progress);
  }

  /**
   * Get reading progress for current user on a book
   */
  async getReadingProgress(
    bookId: string,
    userId: string,
  ): Promise<AcademicBookReadingProgress | null> {
    return this.progressRepository.findOne({
      where: { bookId, userId },
    });
  }

  /**
   * Get list of books the user recently read to continue reading
   */
  async getContinueReading(
    userId: string,
    schoolId: string,
    limit = 10,
  ) {
    const progressList = await this.progressRepository.find({
      where: { userId },
      relations: ['book', 'book.classEntity', 'book.subjectEntity'],
      order: { lastReadAt: 'DESC' },
      take: limit,
    });

    // Filter books belonging to the active school and active books
    return progressList
      .filter((p) => p.book && p.book.schoolId === schoolId && p.book.isActive)
      .map((p) => ({
        bookId: p.book.id,
        title: p.book.title,
        author: p.book.author,
        coverImageUrl: p.book.coverImageUrl,
        pdfUrl: p.book.pdfUrl,
        class: p.book.classEntity
          ? { id: p.book.classEntity.id, name: p.book.classEntity.name }
          : null,
        subject: p.book.subject || p.book.subjectEntity?.name || null,
        lastPage: p.lastPage,
        totalPages: p.totalPages || p.book.totalPages,
        isCompleted: p.isCompleted,
        progressPercentage:
          p.totalPages || p.book.totalPages
            ? Math.min(
                100,
                Math.round(
                  (p.lastPage / (p.totalPages || p.book.totalPages || 1)) * 100,
                ),
              )
            : 0,
        lastReadAt: p.lastReadAt,
      }));
  }

  /**
   * Upload PDF Book or Cover Image file to Supabase Storage
   */
  async uploadFile(file: Express.Multer.File) {
    if (!this.supabase) {
      throw new BadRequestException('Supabase storage is not configured');
    }

    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const fileExt = file.originalname.split('.').pop();
    const fileName = `academic-books/${uniqueSuffix}.${fileExt}`;
    const bucketName =
      this.configService.get<string>('SUPABASE_BUCKET_NAME') || 'uploads';

    const { data, error } = await this.supabase.storage
      .from(bucketName)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }

    const {
      data: { publicUrl },
    } = this.supabase.storage.from(bucketName).getPublicUrl(fileName);

    return {
      url: publicUrl,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
    };
  }
}
