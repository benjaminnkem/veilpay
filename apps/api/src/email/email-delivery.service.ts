import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

export interface EmailJobPayload {
  to: string;
  template: 'verify-email' | 'reset-password' | 'invitation';
  variables: Record<string, string>;
}

function render(payload: EmailJobPayload): { subject: string; text: string } {
  const token = payload.variables.token;
  switch (payload.template) {
    case 'verify-email':
      return {
        subject: 'Verify your VeilPay email',
        text: `Verify your email with this one-time token: ${token}`,
      };
    case 'reset-password':
      return {
        subject: 'Reset your VeilPay password',
        text: `Reset your password with this one-time token: ${token}`,
      };
    case 'invitation':
      return {
        subject: 'You have been invited to VeilPay',
        text: `Accept your invitation with this one-time token: ${token}`,
      };
  }
}

@Injectable()
export class EmailDeliveryService {
  constructor(private readonly config: ConfigService) {}

  async deliver(payload: EmailJobPayload): Promise<void> {
    if (this.config.get<string>('EMAIL_PROVIDER') === 'console') {
      // Development jobs remain inspectable in PostgreSQL. Sensitive tokens are never logged.
      return;
    }
    const port = this.config.getOrThrow<number>('SMTP_PORT');
    const transport = nodemailer.createTransport({
      host: this.config.getOrThrow<string>('SMTP_HOST'),
      port,
      secure: port === 465,
      auth: {
        user: this.config.getOrThrow<string>('SMTP_USER'),
        pass: this.config.getOrThrow<string>('SMTP_PASSWORD'),
      },
    });
    await transport.sendMail({
      from: this.config.getOrThrow<string>('EMAIL_FROM'),
      to: payload.to,
      ...render(payload),
    });
  }
}
