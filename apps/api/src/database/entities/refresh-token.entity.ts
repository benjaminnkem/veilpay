import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { UserEntity } from './user.entity';

@Entity('refresh_tokens')
export class RefreshTokenEntity extends BaseEntity {
  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => UserEntity, (user) => user.refreshTokens, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user!: UserEntity;

  @Index()
  @Column({ type: 'varchar', length: 128 })
  tokenHash!: string;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userAgent!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  ipAddress!: string | null;
}
