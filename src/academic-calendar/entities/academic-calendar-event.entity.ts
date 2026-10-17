import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

export enum AcademicCalendarCategory {
  HOLIDAY = 'HOLIDAY',
  EXAM = 'EXAM',
  EVENT = 'EVENT',
  VACATION = 'VACATION',
  ACADEMIC = 'ACADEMIC',
  MEETING = 'MEETING',
  SPORTS = 'SPORTS',
  OTHER = 'OTHER',
}

export enum TargetAudience {
  ALL = 'ALL',
  STUDENTS = 'STUDENTS',
  TEACHERS = 'TEACHERS',
  ADMIN = 'ADMIN',
}

@Entity('academic_calendar_events')
@Index(['schoolId', 'startDate', 'endDate'])
@Index(['schoolId', 'category'])
@Index(['schoolId', 'academicYear'])
export class AcademicCalendarEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  schoolId: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'varchar',
    default: AcademicCalendarCategory.EVENT,
  })
  @Index()
  category: AcademicCalendarCategory;

  @Column({ type: 'timestamptz' })
  @Index()
  startDate: Date;

  @Column({ type: 'timestamptz' })
  @Index()
  endDate: Date;

  @Column({ nullable: true })
  startTime?: string;

  @Column({ nullable: true })
  endTime?: string;

  @Column({ default: true })
  isAllDay: boolean;

  @Column({ default: false })
  @Index()
  isHoliday: boolean;

  @Column({
    type: 'varchar',
    default: TargetAudience.ALL,
  })
  targetAudience: TargetAudience;

  @Column('simple-array', { nullable: true })
  classIds?: string[];

  @Column({ nullable: true })
  color?: string;

  @Column({ nullable: true })
  location?: string;

  @Column({ nullable: true })
  attachmentUrl?: string;

  @Column({ nullable: true })
  @Index()
  academicYear?: string;

  @Column({ nullable: true })
  term?: string;

  @Column('uuid', { nullable: true })
  createdById?: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date | null;
}
