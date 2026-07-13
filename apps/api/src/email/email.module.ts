import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailDeliveryService } from './email-delivery.service';
@Global()
@Module({
  providers: [EmailService, EmailDeliveryService],
  exports: [EmailService, EmailDeliveryService],
})
export class EmailModule {}
