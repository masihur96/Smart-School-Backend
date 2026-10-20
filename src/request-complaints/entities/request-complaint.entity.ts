import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User, UserRole } from '../../users/entities/user.entity';
import { RequestComplaintComment } from './request-complaint-comment.entity';

export enum RequestComplaintType {
  REQUEST = 'REQUEST',
  COMPLAINT = 'COMPLAINT',
}

export enum RequestComplaintStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum RequestComplaintPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum RequestComplaintCategory {
  ACADEMIC = 'ACADEMIC',
  ATTENDANCE = 'ATTENDANCE',
  LEAVE = 'LEAVE',
  FACILITY = 'FACILITY',
  FEE = 'FEE',
  DISCIPLINE = 'DISCIPLINE',
  BEHAVIOR = 'BEHAVIOR',
  EXAM = 'EXAM',
  OTHER = 'OTHER',
}

@Entity('request_complaints')
@Index(['schoolId', 'status'])
@Index(['schoolId', 'type'])
@Index(['schoolId', 'createdAt'])
export class RequestComplaint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  schoolId: string;

  @Column('uuid')
  @Index()
  senderId: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @Column('uuid', { nullable: true })
  @Index()
  recipientId?: string | null;

  @ManyToOne(() => User, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'recipientId' })
  recipient?: User | null;

  /**
   * When recipientId is null, targetRole specifies the group (e.g. 'admin' for school administration queue)
   */
  @Column({ nullable: true })
  targetRole?: UserRole | string | null;

  @Column({
    type: 'varchar',
    default: RequestComplaintType.REQUEST,
  })
  @Index()
  type: RequestComplaintType;

  @Column({
    type: 'varchar',
    default: RequestComplaintCategory.OTHER,
  })
  category: RequestComplaintCategory | string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'varchar',
    default: RequestComplaintPriority.MEDIUM,
  })
  priority: RequestComplaintPriority;

  @Column({
    type: 'varchar',
    default: RequestComplaintStatus.PENDING,
  })
  @Index()
  status: RequestComplaintStatus;

  @Column('simple-json', { nullable: true })
  attachments?: string[] | null;

  @Column('text', { nullable: true })
  resolutionNote?: string | null;

  @Column('uuid', { nullable: true })
  resolvedById?: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'resolvedById' })
  resolvedBy?: User | null;

  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt?: Date | null;

  @OneToMany(
    () => RequestComplaintComment,
    (comment) => comment.requestComplaint,
  )
  comments?: RequestComplaintComment[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt?: Date | null;
}
