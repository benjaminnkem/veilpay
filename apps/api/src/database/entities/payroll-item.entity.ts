import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { PayrollEntity } from './payroll.entity';
import { EmployeeEntity } from './employee.entity';

@Entity('payroll_items')
@Index(['payrollId', 'employeeId'], { unique: true })
export class PayrollItemEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  payrollId!: string;

  @ManyToOne(() => PayrollEntity, (payroll) => payroll.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'payrollId' })
  payroll!: PayrollEntity;

  @Column({ type: 'uuid' })
  employeeId!: string;

  @ManyToOne(() => EmployeeEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employeeId' })
  employee!: EmployeeEntity;

  @Column({ type: 'varchar', length: 255 })
  employeeName!: string;

  @Column({ type: 'bigint', default: '0' })
  baseSalaryCents!: string;

  @Column({ type: 'bigint', default: '0' })
  bonusCents!: string;

  @Column({ type: 'bigint', default: '0' })
  allowanceCents!: string;

  @Column({ type: 'bigint', default: '0' })
  deductionsCents!: string;

  @Column({ type: 'bigint', default: '0' })
  netPayCents!: string;

  @Column({ type: 'varchar', length: 8, default: 'USD' })
  currency!: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  walletAddress!: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  transactionHash!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;
}
