import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditAction, UserRole } from '@repo/types';
import { UserEntity } from '../../database/entities';
import { buildMeta, PaginationDto } from '../../common/dto/pagination.dto';
import type { JwtPayloadUser } from '../../common/decorators/current-user.decorator';
import { requireOrganizationId } from '../../common/utils/org.util';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { UpdateProfileDto, UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    private readonly auditLogs: AuditLogsService,
  ) {}

  async findAll(actor: JwtPayloadUser, query: PaginationDto) {
    const orgId = requireOrganizationId(actor);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const qb = this.usersRepo
      .createQueryBuilder('u')
      .where('u.organizationId = :orgId', { orgId })
      .orderBy('u.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    if (query.search) {
      qb.andWhere(
        '(u.email ILIKE :s OR u.firstName ILIKE :s OR u.lastName ILIKE :s)',
        { s: `%${query.search}%` },
      );
    }

    const [data, total] = await qb.getManyAndCount();
    return {
      data: data.map((u) => serializeUser(u)),
      meta: buildMeta(page, pageSize, total),
    };
  }

  async findOne(actor: JwtPayloadUser, id: string) {
    const user = await this.usersRepo.findOne({
      where: { id },
      relations: { organization: true },
    });
    if (!user) throw new NotFoundException('User not found');

    if (
      actor.role !== UserRole.SUPER_ADMIN &&
      user.organizationId !== actor.organizationId &&
      user.id !== actor.id
    ) {
      throw new ForbiddenException();
    }

    return serializeUser(user, user.organization?.name ?? null);
  }

  async updateProfile(actor: JwtPayloadUser, dto: UpdateProfileDto) {
    const user = await this.usersRepo.findOne({ where: { id: actor.id } });
    if (!user) throw new NotFoundException('User not found');

    Object.assign(user, {
      firstName: dto.firstName ?? user.firstName,
      lastName: dto.lastName ?? user.lastName,
      avatarUrl:
        dto.avatarUrl !== undefined ? dto.avatarUrl : user.avatarUrl,
      walletAddress:
        dto.walletAddress !== undefined
          ? dto.walletAddress
          : user.walletAddress,
    });

    await this.usersRepo.save(user);

    await this.auditLogs.log({
      organizationId: user.organizationId,
      actorId: actor.id,
      actorEmail: actor.email,
      action: AuditAction.USER_UPDATED,
      entityType: 'User',
      entityId: user.id,
      metadata: { fields: Object.keys(dto) },
    });

    return serializeUser(user);
  }

  async update(actor: JwtPayloadUser, id: string, dto: UpdateUserDto) {
    if (
      ![UserRole.OWNER, UserRole.HR, UserRole.SUPER_ADMIN].includes(actor.role)
    ) {
      throw new ForbiddenException();
    }

    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    if (
      actor.role !== UserRole.SUPER_ADMIN &&
      user.organizationId !== actor.organizationId
    ) {
      throw new ForbiddenException();
    }

    if (dto.role && actor.role !== UserRole.OWNER && actor.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only owners can change roles');
    }

    Object.assign(user, {
      firstName: dto.firstName ?? user.firstName,
      lastName: dto.lastName ?? user.lastName,
      avatarUrl:
        dto.avatarUrl !== undefined ? dto.avatarUrl : user.avatarUrl,
      walletAddress:
        dto.walletAddress !== undefined
          ? dto.walletAddress
          : user.walletAddress,
      role: dto.role ?? user.role,
      isActive: dto.isActive ?? user.isActive,
    });

    await this.usersRepo.save(user);

    await this.auditLogs.log({
      organizationId: user.organizationId,
      actorId: actor.id,
      actorEmail: actor.email,
      action: AuditAction.USER_UPDATED,
      entityType: 'User',
      entityId: user.id,
      metadata: { fields: Object.keys(dto) },
    });

    return serializeUser(user);
  }
}

function serializeUser(user: UserEntity, organizationName?: string | null) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    name: `${user.firstName} ${user.lastName}`.trim(),
    role: user.role,
    organizationId: user.organizationId,
    organizationName: organizationName ?? null,
    avatarUrl: user.avatarUrl,
    walletAddress: user.walletAddress,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
