import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { PayrollStatus } from '@repo/types';
import { BaseEntity } from './base.entity';
import { OrganizationEntity } from './organization.entity';
import { UserEntity } from './user.entity';
import { PayrollItemEntity } from './payroll-item.entity';
import { ApprovalEntity } from './approval.entity';

@Entity('payrolls')
@Index(['organizationId', 'status'])
export class PayrollEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  organizationId!: string;

  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization!: OrganizationEntity;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'date' })
  periodStart!: string;

  @Column({ type: 'date' })
  periodEnd!: string;

  @Column({ type: 'date' })
  payDate!: string;

  @Column({
    type: 'enum',
    enum: PayrollStatus,
    default: PayrollStatus.DRAFT,
  })
  status!: PayrollStatus;

  @Column({ type: 'int', default: 0 })
  employeeCount!: number;

  @Column({ type: 'bigint', default: '0' })
  totalBaseSalaryCents!: string;

  @Column({ type: 'bigint', default: '0' })
  totalBonusCents!: string;

  @Column({ type: 'bigint', default: '0' })
  totalAllowanceCents!: string;

  @Column({ type: 'bigint', default: '0' })
  totalDeductionsCents!: string;

  @Column({ type: 'bigint', default: '0' })
  totalNetPayCents!: string;

  @Column({ type: 'varchar', length: 8, default: 'USD' })
  currency!: string;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  submittedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  approvedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  executedAt!: Date | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  transactionHash!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  network!: string | null;

  @Column({ type: 'uuid' })
  createdById!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'createdById' })
  createdBy!: UserEntity;

  @OneToMany(() => PayrollItemEntity, (item) => item.payroll)
  items!: PayrollItemEntity[];

  @OneToMany(() => ApprovalEntity, (approval) => approval.payroll)
  approvals!: ApprovalEntity[];
}
