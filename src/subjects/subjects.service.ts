import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from './entities/subject.entity';
import { CreateSubjectDto, UpdateSubjectDto } from './dto/create-subject.dto';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectRepository(Subject)
    private subjectRepository: Repository<Subject>,
  ) {}

  async create(data: CreateSubjectDto) {
    const newSubject = this.subjectRepository.create(data);
    return await this.subjectRepository.save(newSubject);
  }

  async findAll() {
    return await this.subjectRepository.find();
  }

  async findById(id: string) {
    return await this.subjectRepository.findOne({ where: { id } });
  }

  async update(id: string, data: UpdateSubjectDto) {
    await this.subjectRepository.update(id, data);
    return await this.subjectRepository.findOne({ where: { id } });
  }

  async delete(id: string) {
    return await this.subjectRepository.softDelete(id);
  }

  async findAllDeleted() {
    return await this.subjectRepository
      .createQueryBuilder('subject')
      .withDeleted()
      .where('subject.deletedAt IS NOT NULL')
      .orderBy('subject.deletedAt', 'DESC')
      .getMany();
  }

  async restore(id: string) {
    const result = await this.subjectRepository.restore(id);
    if (!result.affected) {
      throw new Error(`Subject ${id} not found or not deleted`);
    }
    return await this.subjectRepository.findOne({ where: { id } });
  }
}
