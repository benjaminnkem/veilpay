import { Module } from '@nestjs/common';
import { EmployeePortalController } from './employee-portal.controller';
@Module({ controllers: [EmployeePortalController] })
export class EmployeePortalModule {}
