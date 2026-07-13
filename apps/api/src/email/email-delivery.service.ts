import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';

export interface EmailJobPayload {
  to: string;
  template: 'verify-email' | 'reset-password' | 'invitation';
  variables: Record<string, string>;
}

interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}

function appUrl(
  webAppUrl: string,
  pathname: string,
  parameters: Record<string, string>,
): string {
  const url = new URL(pathname, webAppUrl);
  Object.entries(parameters).forEach(([name, value]) => {
    url.searchParams.set(name, value);
  });
  return url.toString();
}

function linkHtml(label: string, url: string): string {
  const escapedUrl = url
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
  return `<p><a href="${escapedUrl}">${label}</a></p>`;
}

function requiredVariable(payload: EmailJobPayload, name: string): string {
  const value = payload.variables[name];
  if (!value) {
    throw new Error(`Email job ${payload.template} is missing ${name}`);
  }
  return value;
}

export function renderEmail(
  payload: EmailJobPayload,
  webAppUrl: string,
): RenderedEmail {
  const token = requiredVariable(payload, 'token');
  switch (payload.template) {
    case 'verify-email': {
      const url = appUrl(webAppUrl, '/verify-email', { token });
      return {
        subject: 'Verify your VeilPay email',
        text: `Verify your email: ${url}`,
        html: linkHtml('Verify email', url),
      };
    }
    case 'reset-password': {
      const url = appUrl(webAppUrl, '/reset-password', { token });
      return {
        subject: 'Reset your VeilPay password',
        text: `Reset your password: ${url}`,
        html: linkHtml('Reset password', url),
      };
    }
    case 'invitation': {
      const invitationPath = appUrl(webAppUrl, '/invitation/accept', {
        token,
      });
      const invitationUrl = new URL(invitationPath);
      const redirectUri = `${invitationUrl.pathname}${invitationUrl.search}`;
      const entrypoint =
        payload.variables.entrypoint === 'sign-in' ? '/sign-in' : '/sign-up';
      const url = appUrl(webAppUrl, entrypoint, {
        redirect_uri: redirectUri,
      });
      return {
        subject: 'You have been invited to VeilPay',
        text: `Accept your invitation: ${url}`,
        html: linkHtml('Accept invitation', url),
      };
    }
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
      ...renderEmail(payload, this.config.getOrThrow<string>('WEB_APP_URL')),
    });
  }
}
