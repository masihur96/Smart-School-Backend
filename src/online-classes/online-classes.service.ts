import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { OnlineClass } from './entities/online-class.entity';
import { CreateOnlineClassDto } from './dto/create-online-class.dto';
import { UpdateOnlineClassDto } from './dto/update-online-class.dto';
import { UserRole } from '../users/entities/user.entity';
import { Class } from '../classes/entities/class.entity';
import { Section } from '../sections/entities/section.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class OnlineClassesService {
  constructor(
    @InjectRepository(OnlineClass)
    private readonly onlineClassRepository: Repository<OnlineClass>,
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    @InjectRepository(Section)
    private readonly sectionRepository: Repository<Section>,
    @InjectRepository(Subject)
    private readonly subjectRepository: Repository<Subject>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /** Resolves raw OnlineClass records into enriched response objects. */
  private async enrich(records: OnlineClass[]): Promise<any[]> {
    if (records.length === 0) return [];

    // Collect unique IDs
    const classIds = [...new Set(records.map((r) => r.classId).filter(Boolean))];
    const sectionIds = [...new Set(records.map((r) => r.sectionId).filter(Boolean))];
    const subjectIds = [...new Set(records.map((r) => r.subjectId).filter(Boolean))];
    const participantIds = [
      ...new Set(records.flatMap((r) => (Array.isArray(r.participantUuids) ? r.participantUuids : [])).filter(Boolean)),
    ];

    // Fetch all referenced rows in bulk
    const [classes, sections, subjects, participants] = await Promise.all([
      classIds.length ? this.classRepository.find({ where: { id: In(classIds) }, select: ['id', 'name'] }) : [],
      sectionIds.length ? this.sectionRepository.find({ where: { id: In(sectionIds) }, select: ['id', 'name'] }) : [],
      subjectIds.length ? this.subjectRepository.find({ where: { id: In(subjectIds) }, select: ['id', 'name'] }) : [],
      participantIds.length
        ? this.userRepository.find({ where: { id: In(participantIds) }, select: ['id', 'name', 'avatar'] })
        : [],
    ]);

    // Build lookup maps
    const classMap = new Map<string, { id: string; name: string }>(classes.map((c) => [c.id, { id: c.id, name: c.name }] as [string, { id: string; name: string }]));
    const sectionMap = new Map<string, { id: string; name: string }>(sections.map((s) => [s.id, { id: s.id, name: s.name }] as [string, { id: string; name: string }]));
    const subjectMap = new Map<string, { id: string; name: string }>(subjects.map((s) => [s.id, { id: s.id, name: s.name }] as [string, { id: string; name: string }]));
    const participantMap = new Map<string, { id: string; name: string; avatar: string | null }>(participants.map((u) => [u.id, { id: u.id, name: u.name, avatar: u.avatar }] as [string, { id: string; name: string; avatar: string | null }]));

    return records.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      meetLink: r.meetLink,
      date: r.date,
      startTime: r.startTime,
      endTime: r.endTime,
      hostId: r.hostId,
      schoolId: r.schoolId,
      class: r.classId ? (classMap.get(r.classId) ?? { id: r.classId, name: null }) : null,
      section: r.sectionId ? (sectionMap.get(r.sectionId) ?? { id: r.sectionId, name: null }) : null,
      subject: r.subjectId ? (subjectMap.get(r.subjectId) ?? { id: r.subjectId, name: null }) : null,
      participants: Array.isArray(r.participantUuids)
        ? r.participantUuids.map((uid) => participantMap.get(uid) ?? { id: uid, name: null, avatar: null })
        : [],
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }

  async create(createOnlineClassDto: CreateOnlineClassDto, user: any): Promise<OnlineClass> {
    try {
      const newClass = this.onlineClassRepository.create({
        ...createOnlineClassDto,
        hostId: user.id,
        schoolId: user.schoolId,
      });
      return await this.onlineClassRepository.save(newClass);
    } catch (error) {
      console.error('Error creating online class:', error);
      throw new InternalServerErrorException(`Failed to create online class: ${error.message || error}`);
    }
  }

  async findAll(user: any): Promise<any[]> {
    let records: OnlineClass[] = [];

    if (user.role === UserRole.STUDENT) {
      records = await this.onlineClassRepository
        .createQueryBuilder('onlineClass')
        .where('onlineClass.schoolId = :schoolId', { schoolId: user.schoolId })
        .andWhere('onlineClass.participantUuids LIKE :userId', { userId: `%${user.id}%` })
        .getMany();
    } else if (user.role === UserRole.TEACHER) {
      records = await this.onlineClassRepository
        .createQueryBuilder('onlineClass')
        .where('onlineClass.schoolId = :schoolId', { schoolId: user.schoolId })
        .andWhere('(onlineClass.hostId = :userId OR onlineClass.participantUuids LIKE :likeUserId)', {
          userId: user.id,
          likeUserId: `%${user.id}%`,
        })
        .getMany();
    } else if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
      records = await this.onlineClassRepository.find({
        where: { schoolId: user.schoolId },
      });
    }

    return this.enrich(records);
  }

  async findOne(id: string, user: any): Promise<any> {
    const onlineClass = await this.onlineClassRepository.findOne({ where: { id, schoolId: user.schoolId } });
    if (!onlineClass) {
      throw new NotFoundException('Online class not found');
    }
    const [enriched] = await this.enrich([onlineClass]);
    return enriched;
  }

  async update(id: string, updateOnlineClassDto: UpdateOnlineClassDto, user: any): Promise<OnlineClass> {
    const onlineClass = await this.onlineClassRepository.findOne({ where: { id, schoolId: user.schoolId } });
    if (!onlineClass) throw new NotFoundException('Online class not found');
    Object.assign(onlineClass, updateOnlineClassDto);
    return await this.onlineClassRepository.save(onlineClass);
  }

  async remove(id: string, user: any): Promise<void> {
    const onlineClass = await this.onlineClassRepository.findOne({ where: { id, schoolId: user.schoolId } });
    if (!onlineClass) throw new NotFoundException('Online class not found');
    await this.onlineClassRepository.remove(onlineClass);
  }
}
