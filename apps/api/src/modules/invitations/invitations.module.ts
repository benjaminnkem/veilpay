import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  EmployeeEntity,
  InvitationEntity,
  OrganizationEntity,
  UserEntity,
} from '../../database/entities';
import { AuthModule } from '../auth/auth.module';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InvitationEntity,
      UserEntity,
      EmployeeEntity,
      OrganizationEntity,
    ]),
    AuthModule,
  ],
  controllers: [InvitationsController],
  providers: [InvitationsService],
  exports: [InvitationsService],
})
export class InvitationsModule {}
