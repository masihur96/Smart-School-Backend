import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { RequestComplaint } from './request-complaint.entity';

@Entity('request_complaint_comments')
@Index(['requestComplaintId', 'createdAt'])
export class RequestComplaintComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  requestComplaintId: string;

  @ManyToOne(
    () => RequestComplaint,
    (requestComplaint) => requestComplaint.comments,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'requestComplaintId' })
  requestComplaint: RequestComplaint;

  @Column('uuid')
  @Index()
  senderId: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @Column('text')
  message: string;

  @Column('simple-json', { nullable: true })
  attachments?: string[] | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
