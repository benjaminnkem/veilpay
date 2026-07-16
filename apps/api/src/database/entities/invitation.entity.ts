import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import {
  CompensationFrequency,
  InvitationStatus,
  InvitationType,
  UserRole,
} from '@repo/types';
import { BaseEntity } from './base.entity';
import { OrganizationEntity } from './organization.entity';
import { UserEntity } from './user.entity';

@Entity('invitations')
@Index(['tokenHash'], { unique: true })
export class InvitationEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  organizationId!: string;

  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization!: OrganizationEntity;

  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'enum', enum: UserRole })
  role!: UserRole;

  @Column({
    type: 'enum',
    enum: InvitationType,
    default: InvitationType.USER,
  })
  type!: InvitationType;

  @Column({
    type: 'enum',
    enum: InvitationStatus,
    default: InvitationStatus.PENDING,
  })
  status!: InvitationStatus;

  @Column({ type: 'varchar', length: 128 })
  tokenHash!: string;

  @Column({ type: 'uuid' })
  invitedById!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invitedById' })
  invitedBy!: UserEntity;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  acceptedAt!: Date | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  firstName!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName!: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  department!: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  position!: string | null;

  @Column({ type: 'bigint', nullable: true })
  startingSalaryCents!: string | null;

  @Column({ type: 'varchar', length: 8, nullable: true, default: 'USD' })
  salaryCurrency!: string | null;

  @Column({
    type: 'enum',
    enum: CompensationFrequency,
    nullable: true,
  })
  salaryFrequency!: CompensationFrequency | null;
}
