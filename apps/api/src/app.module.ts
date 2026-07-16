import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';
import { entities } from './database/entities';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { CompensationModule } from './modules/compensation/compensation.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { ApprovalsModule } from './modules/approvals/approvals.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { InvitationsModule } from './modules/invitations/invitations.module';
import { SettingsModule } from './modules/settings/settings.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env', 'apps/api/.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.username'),
        password: config.get<string>('database.password'),
        database: config.get<string>('database.database'),
        entities,
        synchronize: config.get<boolean>('database.synchronize'),
        logging: config.get<boolean>('database.logging'),
      }),
    }),
    HealthModule,
    AuthModule,
    UsersModule,
    OrganizationsModule,
    EmployeesModule,
    CompensationModule,
    PayrollModule,
    ApprovalsModule,
    AuditLogsModule,
    NotificationsModule,
    InvitationsModule,
    SettingsModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
