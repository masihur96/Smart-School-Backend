import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { PricingPlan } from '../../pricing/entities/pricing-plan.entity';
import { School } from '../../schools/entities/school.entity';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  schoolId: string;

  @ManyToOne(() => School, { eager: false, createForeignKeyConstraints: false })
  @JoinColumn({ name: 'schoolId', referencedColumnName: 'schoolId' })
  school: School;

  @ManyToOne(() => PricingPlan, { eager: true })
  pricingPlan: PricingPlan;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  startDate: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endDate: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  lastStudentCount: number;

  @Column({ nullable: true })
  paymentMethod: string;

  @Index({ unique: true, sparse: true })
  @Column({ nullable: true, unique: true })
  transactionId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  amount: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date | null;
}
