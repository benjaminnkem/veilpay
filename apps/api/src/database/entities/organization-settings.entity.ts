import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { ApprovalLevel } from '@repo/types';
import { BaseEntity } from './base.entity';
import { OrganizationEntity } from './organization.entity';

@Entity('organization_settings')
export class OrganizationSettingsEntity extends BaseEntity {
  @Column({ type: 'uuid', unique: true })
  organizationId!: string;

  @OneToOne(
    () => OrganizationEntity,
    (organization) => organization.settings,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'organizationId' })
  organization!: OrganizationEntity;

  @Column({ type: 'boolean', default: true })
  payrollApprovalRequired!: boolean;

  @Column({
    type: 'simple-array',
    default: `${ApprovalLevel.HR},${ApprovalLevel.FINANCE},${ApprovalLevel.CEO}`,
  })
  defaultApprovalSequence!: string[];

  @Column({ type: 'boolean', default: true })
  autoGeneratePayrollItems!: boolean;

  @Column({ type: 'boolean', default: false })
  notificationEmailEnabled!: boolean;

  @Column({ type: 'int', default: 1 })
  fiscalYearStartMonth!: number;
}
