import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Class } from '../../classes/entities/class.entity';
import { Subject } from '../../subjects/entities/subject.entity';

@Entity('academic_books')
@Index(['schoolId', 'classId'])
export class AcademicBook {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  schoolId: string;

  @Column('uuid')
  @Index()
  classId: string;

  @ManyToOne(() => Class, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'classId' })
  classEntity?: Class;

  @Column('uuid', { nullable: true })
  @Index()
  subjectId?: string;

  @ManyToOne(() => Subject, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'subjectId' })
  subjectEntity?: Subject;

  @Column({ nullable: true })
  subject?: string;

  @Column()
  title: string;

  @Column()
  author: string;

  @Column({ nullable: true })
  edition?: string;

  @Column({ nullable: true })
  coverImageUrl?: string;

  @Column()
  pdfUrl: string;

  @Column({ nullable: true, type: 'bigint' })
  fileSize?: number;

  @Column({ nullable: true, type: 'text' })
  description?: string;

  @Column({ nullable: true, type: 'int' })
  totalPages?: number;

  @Column({ nullable: true, type: 'int' })
  publishedYear?: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date | null;
}
