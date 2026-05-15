// Period Attendance Entity
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Class } from '../../classes/entities/class.entity';
import { Subject } from '../../subjects/entities/subject.entity';
import { Section } from '../../sections/entities/section.entity';
import { Routine } from '../../general/entities/routine.entity';

export enum PeriodAttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  LEAVE = 'leave',
}

@Index(['routineId', 'date'])
@Index(['studentId'])
@Index(['classId', 'date'])
@Index('idx_period_att_student_name', ['studentName'])
@Entity('period_attendance')
export class PeriodAttendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** The routine/period this attendance belongs to */
  @Column({ type: 'uuid' })
  routineId: string;

  @ManyToOne(() => Routine, { eager: false, nullable: false })
  @JoinColumn({ name: 'routineId' })
  routine: Routine;

  /** The student being marked */
  @Column({ type: 'uuid' })
  studentId: string;

  @ManyToOne(() => User, { eager: false, nullable: false })
  @JoinColumn({ name: 'studentId' })
  student: User;

  /**
   * Denormalised student name for fast ILIKE lookups
   * without joins on large tables.
   */
  @Column({ nullable: true })
  studentName: string;

  /** Resolved from the routine */
  @Column({ type: 'uuid' })
  classId: string;

  @ManyToOne(() => Class, { eager: false })
  @JoinColumn({ name: 'classId' })
  class: Class;

  /** Resolved from the routine */
  @Column({ type: 'uuid', nullable: true })
  sectionId: string;

  @ManyToOne(() => Section, { eager: false, nullable: true })
  @JoinColumn({ name: 'sectionId' })
  section: Section;

  /** Resolved from the routine */
  @Column({ type: 'uuid', nullable: true })
  subjectId: string;

  @ManyToOne(() => Subject, { eager: false, nullable: true })
  @JoinColumn({ name: 'subjectId' })
  subject: Subject;

  /** The teacher who submitted attendance — resolved from JWT or routine */
  @Column({ type: 'uuid', nullable: true })
  teacherId: string;

  @ManyToOne(() => User, { eager: false, nullable: true })
  @JoinColumn({ name: 'teacherId' })
  teacher: User;

  @Column({ type: 'date' })
  date: string;

  @Column({
    type: 'enum',
    enum: PeriodAttendanceStatus,
    default: PeriodAttendanceStatus.ABSENT,
  })
  status: PeriodAttendanceStatus;

  @Column({ nullable: true })
  schoolId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}
