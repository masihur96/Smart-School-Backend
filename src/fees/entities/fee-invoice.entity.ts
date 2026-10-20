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
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { FeePayment } from './fee-payment.entity';
import { FeeType } from './fee-structure.entity';

import { FeeStatus, PaymentMode } from './fees.enums';
export { FeeStatus, PaymentMode };

@Entity('fee_invoices')
@Unique('IDX_fee_invoices_school_number', ['schoolId', 'invoiceNumber'])
@Index(['schoolId', 'studentId'])
@Index(['schoolId', 'status'])
@Index(['schoolId', 'dueDate'])
@Index(['schoolId', 'year', 'month'])
export class FeeInvoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  schoolId: string;

  @Column()
  invoiceNumber: string;

  @Column('uuid')
  @Index()
  studentId: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: User;

  @Column({ nullable: true })
  classId?: string;

  @Column({ nullable: true })
  sectionId?: string;

  @Column()
  title: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column({
    type: 'varchar',
    default: FeeType.TUITION,
  })
  feeType: FeeType;

  @Column('uuid', { nullable: true })
  feeStructureId?: string;

  @Column({ nullable: true })
  month?: string;

  @Column('int')
  year: number;

  @Column({ type: 'timestamptz' })
  dueDate: Date;

  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => parseFloat(value as string) || 0,
    },
  })
  amount: number;

  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0.0,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => parseFloat(value as string) || 0,
    },
  })
  discountAmount: number;

  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0.0,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => parseFloat(value as string) || 0,
    },
  })
  fineAmount: number;

  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => parseFloat(value as string) || 0,
    },
  })
  payableAmount: number;

  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    default: 0.0,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => parseFloat(value as string) || 0,
    },
  })
  paidAmount: number;

  @Column({
    type: 'decimal',
    precision: 14,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => parseFloat(value as string) || 0,
    },
  })
  dueAmount: number;

  @Column({
    type: 'varchar',
    default: FeeStatus.UNPAID,
  })
  status: FeeStatus;

  @Column({
    type: 'varchar',
    default: PaymentMode.PERSONAL_PAYMENT,
  })
  paymentMode: PaymentMode;

  @OneToMany(() => FeePayment, (payment) => payment.invoice)
  payments?: FeePayment[];

  @Column('uuid', { nullable: true })
  createdById?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt?: Date | null;
}
