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
import { Wallet } from './wallet.entity';

export enum WalletTransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHEQUE = 'CHEQUE',
  MOBILE_BANKING = 'MOBILE_BANKING',
  ONLINE = 'ONLINE',
  OTHER = 'OTHER',
}

@Entity('wallet_transactions')
@Index(['schoolId', 'transactionDate'])
@Index(['schoolId', 'type'])
export class WalletTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column('uuid')
  walletId: string;

  @Index()
  @Column('uuid')
  schoolId: string;

  @Column({
    type: 'enum',
    enum: WalletTransactionType,
  })
  type: WalletTransactionType;

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

  @Column()
  category: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.CASH,
  })
  paymentMethod: PaymentMethod;

  @Column({ nullable: true })
  referenceNumber: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  transactionDate: Date;

  @Column({ nullable: true })
  performedById: string;

  @Column({ nullable: true })
  performedByName: string;

  @Column({ nullable: true })
  attachmentUrl: string;

  @ManyToOne(() => Wallet, (wallet) => wallet.transactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'walletId' })
  wallet: Wallet;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
