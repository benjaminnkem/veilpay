import { Column, Entity, OneToMany, OneToOne } from 'typeorm';
import { OrganizationStatus } from '@repo/types';
import { BaseEntity } from './base.entity';
import { UserEntity } from './user.entity';
import { EmployeeEntity } from './employee.entity';
import { OrganizationSettingsEntity } from './organization-settings.entity';

@Entity('organizations')
export class OrganizationEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  legalName!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  taxId!: string | null;

  @Column({
    type: 'enum',
    enum: OrganizationStatus,
    default: OrganizationStatus.ACTIVE,
  })
  status!: OrganizationStatus;

  /** Placeholder for future Safe treasury */
  @Column({ type: 'varchar', length: 128, nullable: true })
  safeAddress!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  network!: string | null;

  @Column({ type: 'varchar', length: 8, default: 'USD' })
  currency!: string;

  @Column({ type: 'varchar', length: 64, default: 'UTC' })
  timezone!: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  logoUrl!: string | null;

  @OneToMany(() => UserEntity, (user) => user.organization)
  users!: UserEntity[];

  @OneToMany(() => EmployeeEntity, (employee) => employee.organization)
  employees!: EmployeeEntity[];

  @OneToOne(() => OrganizationSettingsEntity, (settings) => settings.organization)
  settings!: OrganizationSettingsEntity;
}
