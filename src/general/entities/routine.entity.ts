import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Class } from '../../classes/entities/class.entity';
import { Subject } from '../../subjects/entities/subject.entity';

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

  @Column({ nullable: true })
  classId: string;

  @Column({ nullable: true })
  subjectId: string;

  @Column()
  teacherId: string;

  @Column({ type: 'enum', enum: Day })
  day: Day;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({ nullable: true })
  roomNumber: string;

  @Column()
  schoolId: string;

  @ManyToOne(() => Class, (classEntity) => classEntity.routines)
  @JoinColumn({ name: 'classId' })
  classEntity: Class;

  @ManyToOne(() => Subject)
  @JoinColumn({ name: 'subjectId' })
  subjectEntity: Subject;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
