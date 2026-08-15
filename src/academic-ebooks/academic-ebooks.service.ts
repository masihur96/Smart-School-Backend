import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { AcademicEbook } from './entities/academic-ebook.entity';
import { CreateAcademicEbookDto } from './dto/create-academic-ebook.dto';
import { UpdateAcademicEbookDto } from './dto/update-academic-ebook.dto';

@Injectable()
export class AcademicEbooksService {
  private readonly logger = new Logger(AcademicEbooksService.name);

  constructor(
    @InjectRepository(AcademicEbook)
    private readonly ebookRepository: Repository<AcademicEbook>,
  ) {}

  async create(
    createDto: CreateAcademicEbookDto,
    schoolId: string,
  ): Promise<AcademicEbook> {
    try {
      this.logger.log(
        `Creating eBook for schoolId: ${schoolId}, classId: ${createDto.classId}`,
      );
      const ebook = this.ebookRepository.create({ ...createDto, schoolId });
      const saved = await this.ebookRepository.save(ebook);
      this.logger.log(`eBook created successfully: ${saved.id}`);
      return saved;
    } catch (error) {
      this.logger.error(
        `Failed to create eBook for schoolId ${schoolId}:`,
        error,
      );
      throw error;
    }
  }

  async findAll(
    schoolId: string,
    classId?: string,
    search?: string,
    subject?: string,
  ): Promise<AcademicEbook[]> {
    const where: any = { schoolId, isActive: true };

    if (classId) {
      where.classId = classId;
    }

    if (search) {
      where.title = ILike(`%${search}%`);
    }

    if (subject) {
      where.subject = subject;
    }

    return this.ebookRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, schoolId: string): Promise<AcademicEbook> {
    const ebook = await this.ebookRepository.findOne({
      where: { id, schoolId },
    });
    if (!ebook) {
      throw new NotFoundException(`eBook with ID ${id} not found`);
    }
    return ebook;
  }

  async update(
    id: string,
    updateDto: UpdateAcademicEbookDto,
    schoolId: string,
  ): Promise<AcademicEbook> {
    const ebook = await this.findOne(id, schoolId);
    Object.assign(ebook, updateDto);
    return this.ebookRepository.save(ebook);
  }

  async remove(id: string, schoolId: string): Promise<void> {
    const ebook = await this.findOne(id, schoolId);
    await this.ebookRepository.remove(ebook);
  }
}
