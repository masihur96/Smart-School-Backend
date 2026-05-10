import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { StudentHomework } from './student-homework.entity';
import { Class } from '../../classes/entities/class.entity';
import { Subject } from '../../subjects/entities/subject.entity';
import { Section } from '../../sections/entities/section.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Homework {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  classId: string;

  @ManyToOne(() => Class)
  @JoinColumn({ name: 'classId' })
  class: Class;

  @Column()
  subjectId: string;

  @ManyToOne(() => Subject)
  @JoinColumn({ name: 'subjectId' })
  subject: Subject;

  @Column()
  teacherId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'teacherId' })
  teacher: User;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'date' })
  dueDate: Date;

  @Column({ nullable: true })
  sectionId: string;

  @ManyToOne(() => Section)
  @JoinColumn({ name: 'sectionId' })
  section: Section;

  @Column()
  schoolId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  @OneToMany(() => StudentHomework, (sh) => sh.homework)
  studentHomeworks: StudentHomework[];
}

