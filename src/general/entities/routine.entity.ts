import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Class } from '../../classes/entities/class.entity';
import { Subject } from '../../subjects/entities/subject.entity';
import { User } from '../../users/entities/user.entity';
import { Section } from '../../sections/entities/section.entity';

export enum Day {
  MONDAY = 'Monday',
  TUESDAY = 'Tuesday',
  WEDNESDAY = 'Wednesday',
  THURSDAY = 'Thursday',
  FRIDAY = 'Friday',
  SATURDAY = 'Saturday',
  SUNDAY = 'Sunday',
}

@Entity()
export class Routine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  classId: string;

  @Column()
  subjectId: string;

  @Column({ nullable: true })
  teacherId: string;

  @Column({ nullable: true })
  sectionId: string;

  @Column({ type: 'enum', enum: Day })
  day: Day;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column()
  roomNumber: string;

  @Column()
  schoolId: string;

  @ManyToOne(() => Class, (classEntity) => classEntity.routines)
  @JoinColumn({ name: 'classId' })
  classEntity: Class;

  @ManyToOne(() => Subject)
  @JoinColumn({ name: 'subjectId' })
  subjectEntity: Subject;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'teacherId' })
  teacherEntity: User;

  @ManyToOne(() => Section, (section) => section.routines)
  @JoinColumn({ name: 'sectionId' })
  sectionEntity: Section;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
