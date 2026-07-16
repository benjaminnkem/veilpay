import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ApprovalLevel, ApprovalStatus } from '@repo/types';
import { BaseEntity } from './base.entity';
import { PayrollEntity } from './payroll.entity';
import { OrganizationEntity } from './organization.entity';
import { UserEntity } from './user.entity';

@Entity('approvals')
@Index(['payrollId', 'sequence'], { unique: true })
export class ApprovalEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  payrollId!: string;

  @ManyToOne(() => PayrollEntity, (payroll) => payroll.approvals, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'payrollId' })
  payroll!: PayrollEntity;

  @Column({ type: 'uuid' })
  organizationId!: string;

  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization!: OrganizationEntity;

  @Column({ type: 'enum', enum: ApprovalLevel })
  level!: ApprovalLevel;

  @Column({ type: 'int' })
  sequence!: number;

  @Column({
    type: 'enum',
    enum: ApprovalStatus,
    default: ApprovalStatus.PENDING,
  })
  status!: ApprovalStatus;

  @Column({ type: 'uuid', nullable: true })
  approverId!: string | null;

  @ManyToOne(() => UserEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'approverId' })
  approver!: UserEntity | null;

  @Column({ type: 'text', nullable: true })
  comments!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  actedAt!: Date | null;
}
