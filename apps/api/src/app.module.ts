import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AccessTokenGuard } from './common/auth-context';
import { validateEnv } from './config/env';
import { DatabaseModule } from './database/database.module';
import { AuditModule } from './audit/audit.module';
import { EmailModule } from './email/email.module';
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { WalletsModule } from './wallets/wallets.module';
import { CryptoModule } from './crypto/crypto.module';
import { EmployeesModule } from './employees/employees.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { NoxModule } from './nox/nox.module';
import { SafeModule } from './safe/safe.module';
import { PayrollModule } from './payroll/payroll.module';
import { EmployeePortalModule } from './employee-portal/employee-portal.module';
import { IdempotencyModule } from './idempotency/idempotency.module';
import { JobsModule } from './jobs/jobs.module';
import { SystemModule } from './system/system.module';
import { IdempotencyInterceptor } from './idempotency/idempotency.interceptor';
import { ApiExceptionFilter } from './common/api-exception.filter';
import { JsonSafeInterceptor } from './common/json-safe.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    DatabaseModule,
    AuditModule,
    EmailModule,
    AuthModule,
    CompaniesModule,
    WalletsModule,
    CryptoModule,
    EmployeesModule,
    BlockchainModule,
    NoxModule,
    SafeModule,
    PayrollModule,
    EmployeePortalModule,
    IdempotencyModule,
    JobsModule,
    SystemModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AccessTokenGuard },
    { provide: APP_INTERCEPTOR, useClass: IdempotencyInterceptor },
    { provide: APP_INTERCEPTOR, useClass: JsonSafeInterceptor },
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
  ],
})
export class AppModule {}
