
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '../../auth/entities/User.entity';
import { Project } from '../../project/entities/Project.entity';
import { Transaction } from './Transaction.entity';

export enum ManualWithdrawalStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
}

@Entity('manual_withdrawal_request')
export class ManualWithdrawalRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  user_id: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid', name: 'project_id' })
  project_id: string;

  @ManyToOne(() => Project, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ type: 'uuid', name: 'transaction_id' })
  transaction_id: string;

  @OneToOne(() => Transaction, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction;

  @Column({ type: 'varchar', length: 20, name: 'payment_method' })
  payment_method: 'Telebirr' | 'CBE Birr';

  @Column({ type: 'varchar', length: 20, name: 'phone_number' })
  phone_number: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: ManualWithdrawalStatus.PENDING,
  })
  status: ManualWithdrawalStatus;

  @Column({ type: 'text', nullable: true, name: 'rejection_reason' })
  rejection_reason: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'reviewed_by' })
  reviewed_by: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'reviewed_by' })
  reviewer: User | null;

  @Column({ type: 'timestamp', nullable: true, name: 'reviewed_at' })
  reviewed_at: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
