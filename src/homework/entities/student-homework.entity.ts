import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Homework } from './homework.entity';
import { User } from '../../users/entities/user.entity';

export enum StudentHomeworkStatus {
  PENDING = 'pending',
  DONE = 'done',
}

@Entity()
export class StudentHomework {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  homeworkId: string;

  @ManyToOne(() => Homework, (homework) => homework.studentHomeworks, {
    onDelete: 'CASCADE',
  })
  homework: Homework;

  @Column()
  studentId: string;

  @ManyToOne(() => User)
  student: User;

  @Column({
    type: 'enum',
    enum: StudentHomeworkStatus,
    default: StudentHomeworkStatus.PENDING,
  })
  status: StudentHomeworkStatus;

  @Column({ nullable: true, type: 'text' })
  comment: string;

  @Column({ nullable: true })
  updatedBy: string; // teacherId who updated the status

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
