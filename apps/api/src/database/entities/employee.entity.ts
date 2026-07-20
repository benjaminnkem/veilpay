import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { EmploymentStatus } from '@repo/types';
import { BaseEntity } from './base.entity';
import { OrganizationEntity } from './organization.entity';
import { UserEntity } from './user.entity';
import { CompensationEntity } from './compensation.entity';

@Entity('employees')
@Index(['organizationId', 'email'], { unique: true })
export class EmployeeEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  organizationId!: string;

  @ManyToOne(
    () => OrganizationEntity,
    (organization) => organization.employees,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'organizationId' })
  organization!: OrganizationEntity;

  @Column({ type: 'uuid', nullable: true })
  userId!: string | null;

  @ManyToOne(() => UserEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  employeeNumber!: string | null;

  @Column({ type: 'varchar', length: 100 })
  firstName!: string;

  @Column({ type: 'varchar', length: 100 })
  lastName!: string;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  department!: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  position!: string | null;

  @Column({
    type: 'enum',
    enum: EmploymentStatus,
    default: EmploymentStatus.ACTIVE,
  })
  status!: EmploymentStatus;

  @Column({ type: 'date', nullable: true })
  hireDate!: string | null;

  @Column({ type: 'date', nullable: true })
  terminationDate!: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  walletAddress!: string | null;

  @Column({ type: 'uuid', nullable: true })
  managerId!: string | null;

  @ManyToOne(() => EmployeeEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'managerId' })
  manager!: EmployeeEntity | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  country!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @OneToMany(() => CompensationEntity, (compensation) => compensation.employee)
  compensations!: CompensationEntity[];
}
