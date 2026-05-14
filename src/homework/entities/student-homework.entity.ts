import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
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

  @Column({ type: 'uuid' })
  homeworkId: string;

  @ManyToOne(() => Homework, (homework) => homework.studentHomeworks, {
    onDelete: 'CASCADE',
  })
  homework: Homework;

  @Column({ type: 'uuid' })
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

  @DeleteDateColumn()
  deletedAt: Date | null;
}
