import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { PaymentMode } from './fees.enums';

export interface PersonalPaymentInfo {
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  branch?: string;
  routingNumber?: string;
  bkashNumber?: string;
  nagadNumber?: string;
  rocketNumber?: string;
  cashCounterLocation?: string;
  instructions?: string;
}

export interface SchoolCarePaymentInfo {
  enabled: boolean;
  merchantId?: string;
  gatewayUrl?: string;
  instructions?: string;
}

@Entity('fee_settings')
export class FeeSetting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { unique: true })
  @Index()
  schoolId: string;

  @Column({
    type: 'varchar',
    default: PaymentMode.PERSONAL_PAYMENT,
  })
  defaultPaymentMode: PaymentMode;

  @Column('simple-json', { nullable: true })
  personalPaymentInfo?: PersonalPaymentInfo;

  @Column('simple-json', { nullable: true })
  schoolCarePaymentInfo?: SchoolCarePaymentInfo;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
    transformer: {
      to: (value: number) => value,
      from: (value: string | number) => parseFloat(value as string) || 0,
    },
  })
  lateFeeFinePerDay: number;

  @Column({ default: 'BDT' })
  currency: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
