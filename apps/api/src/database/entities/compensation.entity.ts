import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { CompensationFrequency, CompensationType } from '@repo/types';
import { BaseEntity } from './base.entity';
import { EmployeeEntity } from './employee.entity';
import { OrganizationEntity } from './organization.entity';

@Entity('compensations')
@Index(['employeeId', 'isCurrent'])
export class CompensationEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  employeeId!: string;

  @ManyToOne(() => EmployeeEntity, (employee) => employee.compensations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'employeeId' })
  employee!: EmployeeEntity;

  @Column({ type: 'uuid' })
  organizationId!: string;

  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization!: OrganizationEntity;

  @Column({ type: 'enum', enum: CompensationType })
  type!: CompensationType;

  @Column({ type: 'bigint' })
  amountCents!: string;

  @Column({ type: 'varchar', length: 8, default: 'USD' })
  currency!: string;

  @Column({ type: 'enum', enum: CompensationFrequency })
  frequency!: CompensationFrequency;

  @Column({ type: 'date' })
  effectiveDate!: string;

  @Column({ type: 'date', nullable: true })
  endDate!: string | null;

  @Column({ type: 'boolean', default: true })
  isCurrent!: boolean;

  @Column({ type: 'text', nullable: true })
  description!: string | null;
}
