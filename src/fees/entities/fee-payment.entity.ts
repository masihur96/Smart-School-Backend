import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { FeeInvoice } from './fee-invoice.entity';
import { PaymentMode, FeePaymentMethod } from './fees.enums';
export { FeePaymentMethod };

@Entity('fee_payments')
@Unique('IDX_fee_payments_school_receipt', ['schoolId', 'receiptNumber'])
@Index(['schoolId', 'paymentDate'])
@Index(['invoiceId'])
@Index(['studentId'])
export class FeePayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  schoolId: string;

  @Column('uuid')
  @Index()
  invoiceId: string;

  @ManyToOne(() => FeeInvoice, (invoice) => invoice.payments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'invoiceId' })
  invoice: FeeInvoice;

  @Column('uuid')
  @Index()
  studentId: string;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: User;

  @Column()
  receiptNumber: string;

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
    type: 'varchar',
    default: PaymentMode.PERSONAL_PAYMENT,
  })
  paymentMode: PaymentMode;

  @Column({
    type: 'varchar',
    default: FeePaymentMethod.CASH,
  })
  paymentMethod: FeePaymentMethod;

  @Column({ nullable: true })
  transactionId?: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  paymentDate: Date;

  @Column('text', { nullable: true })
  note?: string;

  @Column('uuid', { nullable: true })
  collectedById?: string;

  @ManyToOne(() => User, { eager: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'collectedById' })
  collectedBy?: User;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
