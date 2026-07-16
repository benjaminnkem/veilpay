import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { NotificationType } from '@repo/types';
import { BaseEntity } from './base.entity';
import { UserEntity } from './user.entity';

@Entity('notifications')
@Index(['userId', 'isRead', 'createdAt'])
export class NotificationEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @Column({ type: 'uuid', nullable: true })
  organizationId!: string | null;

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.INFO,
  })
  type!: NotificationType;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  link!: string | null;

  @Column({ type: 'boolean', default: false })
  isRead!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  readAt!: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;
}
