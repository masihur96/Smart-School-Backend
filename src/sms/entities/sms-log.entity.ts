import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum SmsTargetAudience {
  DIRECT = 'DIRECT',
  ALL_STUDENTS = 'ALL_STUDENTS',
  CLASS = 'CLASS',
  SECTION = 'SECTION',
  ALL_TEACHERS = 'ALL_TEACHERS',
  ALL_PARENTS = 'ALL_PARENTS',
  ALL_USERS = 'ALL_USERS',
}

export enum SmsStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

@Entity('sms_logs')
export class SmsLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  schoolId: string;

  @Column({ length: 50 })
  senderId: string;

  @Column({ nullable: true })
  campaignName: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: SmsTargetAudience.DIRECT,
  })
  targetAudience: SmsTargetAudience;

  @Column({ type: 'uuid', nullable: true })
  classId: string;

  @Column({ type: 'uuid', nullable: true })
  sectionId: string;

  @Column({ type: 'int', default: 1 })
  recipientCount: number;

  @Column({ type: 'text', array: true, default: '{}' })
  recipients: string[];

  @Column({ type: 'text' })
  message: string;

  @Index()
  @Column({
    type: 'varchar',
    length: 30,
    default: SmsStatus.PENDING,
  })
  status: SmsStatus;

  @Column({ nullable: true })
  batchId: string;

  @Column({ nullable: true })
  messageId: string;

  @Column({ type: 'int', nullable: true })
  responseCode: number;

  @Column({ type: 'jsonb', nullable: true })
  rawResponse: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'uuid', nullable: true })
  sentById: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
