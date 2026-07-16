import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationType } from '@repo/types';
import { NotificationEntity } from '../../database/entities';
import { buildMeta, PaginationDto } from '../../common/dto/pagination.dto';

export interface CreateNotificationInput {
  userId: string;
  organizationId?: string | null;
  type?: NotificationType;
  title: string;
  body: string;
  link?: string | null;
  metadata?: Record<string, unknown> | null;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepo: Repository<NotificationEntity>,
  ) {}

  async create(input: CreateNotificationInput): Promise<NotificationEntity> {
    const n = this.notificationRepo.create({
      userId: input.userId,
      organizationId: input.organizationId ?? null,
      type: input.type ?? NotificationType.INFO,
      title: input.title,
      body: input.body,
      link: input.link ?? null,
      metadata: input.metadata ?? null,
      isRead: false,
      readAt: null,
    });
    return this.notificationRepo.save(n);
  }

  async findAll(
    userId: string,
    query: PaginationDto & { isRead?: boolean; type?: NotificationType },
  ) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const qb = this.notificationRepo
      .createQueryBuilder('n')
      .where('n.userId = :userId', { userId })
      .orderBy('n.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    if (typeof query.isRead === 'boolean') {
      qb.andWhere('n.isRead = :isRead', { isRead: query.isRead });
    }
    if (query.type) {
      qb.andWhere('n.type = :type', { type: query.type });
    }

    const [data, total] = await qb.getManyAndCount();
    return {
      data: data.map(serializeNotification),
      meta: buildMeta(page, pageSize, total),
    };
  }

  async unreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.notificationRepo.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  async markRead(userId: string, id: string) {
    const n = await this.notificationRepo.findOne({ where: { id, userId } });
    if (!n) throw new NotFoundException('Notification not found');
    n.isRead = true;
    n.readAt = new Date();
    await this.notificationRepo.save(n);
    return serializeNotification(n);
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    const result = await this.notificationRepo.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
    return { updated: result.affected ?? 0 };
  }
}

function serializeNotification(n: NotificationEntity) {
  return {
    id: n.id,
    userId: n.userId,
    organizationId: n.organizationId,
    type: n.type,
    title: n.title,
    body: n.body,
    link: n.link,
    isRead: n.isRead,
    readAt: n.readAt?.toISOString() ?? null,
    metadata: n.metadata,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
  };
}
