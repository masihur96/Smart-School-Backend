import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

import { FeeType, FeeFrequency } from './fees.enums';
export { FeeType, FeeFrequency };

@Entity('fee_structures')
@Index(['schoolId', 'feeType'])
export class FeeStructure {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  @Index()
  schoolId: string;

  @Column()
  name: string;

  @Column({
    type: 'varchar',
    default: FeeType.TUITION,
  })
  feeType: FeeType;

  @Column('text', { nullable: true })
  description?: string;

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
    default: FeeFrequency.MONTHLY,
  })
  frequency: FeeFrequency;

  @Column('simple-json', { nullable: true })
  classIds?: string[];

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt?: Date | null;
}
