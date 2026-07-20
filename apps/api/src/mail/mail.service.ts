import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly mailer: MailerService,
    private readonly config: ConfigService,
  ) {}

  private get appName(): string {
    return this.config.get<string>('app.name') ?? 'VeilPay';
  }

  private get webUrl(): string {
    return (
      this.config.get<string>('app.webUrl') ?? 'http://localhost:3000'
    ).replace(/\/$/, '');
  }

  private async send(
    to: string,
    subject: string,
    template: string,
    context: Record<string, unknown>,
  ): Promise<void> {
    const user = this.config.get<string>('mail.user');
    const pass = this.config.get<string>('mail.pass');

    if (!user || !pass) {
      this.logger.warn(
        `Mail skipped (${template} → ${to}): MAIL_USER / MAIL_PASS not configured`,
      );
      return;
    }

    try {
      await this.mailer.sendMail({
        to,
        subject,
        template,
        context: {
          appName: this.appName,
          webUrl: this.webUrl,
          year: new Date().getFullYear(),
          ...context,
        },
      });
      this.logger.log(`Mail sent: ${template} → ${to}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Mail failed: ${template} → ${to}: ${message}`);
    }
  }

  async sendWelcome(params: {
    to: string;
    firstName: string;
    organizationName: string;
  }): Promise<void> {
    await this.send(params.to, `Welcome to ${this.appName}`, 'welcome', {
      firstName: params.firstName,
      organizationName: params.organizationName,
      loginUrl: `${this.webUrl}/login`,
      dashboardUrl: `${this.webUrl}/dashboard`,
    });
  }

  async sendPasswordChanged(params: {
    to: string;
    firstName: string;
  }): Promise<void> {
    await this.send(
      params.to,
      `Your ${this.appName} password was changed`,
      'password-changed',
      {
        firstName: params.firstName,
        loginUrl: `${this.webUrl}/login`,
      },
    );
  }

  async sendForgotPassword(params: {
    to: string;
    firstName: string;
    resetToken: string;
  }): Promise<void> {
    const resetUrl = `${this.webUrl}/forgot-password?token=${encodeURIComponent(params.resetToken)}`;
    await this.send(
      params.to,
      `Reset your ${this.appName} password`,
      'forgot-password',
      {
        firstName: params.firstName,
        resetUrl,
        expiresInHours: 1,
      },
    );
  }

  async sendInvitation(params: {
    to: string;
    inviteeName?: string | null;
    inviterName: string;
    organizationName: string;
    role: string;
    token: string;
    expiresAt: Date;
  }): Promise<void> {
    const inviteUrl = `${this.webUrl}/invite/${params.token}`;
    await this.send(
      params.to,
      `You're invited to join ${params.organizationName} on ${this.appName}`,
      'invitation',
      {
        inviteeName: params.inviteeName ?? 'there',
        inviterName: params.inviterName,
        organizationName: params.organizationName,
        role: params.role,
        inviteUrl,
        expiresAt: params.expiresAt.toUTCString(),
      },
    );
  }

  async sendInvitationAccepted(params: {
    to: string;
    inviterFirstName: string;
    inviteeName: string;
    inviteeEmail: string;
    organizationName: string;
    role: string;
  }): Promise<void> {
    await this.send(
      params.to,
      `${params.inviteeName} accepted your invitation`,
      'invitation-accepted',
      {
        inviterFirstName: params.inviterFirstName,
        inviteeName: params.inviteeName,
        inviteeEmail: params.inviteeEmail,
        organizationName: params.organizationName,
        role: params.role,
        employeesUrl: `${this.webUrl}/employees`,
      },
    );
  }

  async sendPayrollSubmitted(params: {
    to: string;
    firstName: string;
    payrollName: string;
    payrollId: string;
    employeeCount: number;
  }): Promise<void> {
    await this.send(
      params.to,
      `Payroll submitted: ${params.payrollName}`,
      'payroll-submitted',
      {
        firstName: params.firstName,
        payrollName: params.payrollName,
        employeeCount: params.employeeCount,
        payrollUrl: `${this.webUrl}/payroll/${params.payrollId}`,
      },
    );
  }

  async sendPayrollApproved(params: {
    to: string;
    firstName: string;
    payrollName: string;
    payrollId: string;
  }): Promise<void> {
    await this.send(
      params.to,
      `Payroll approved: ${params.payrollName}`,
      'payroll-approved',
      {
        firstName: params.firstName,
        payrollName: params.payrollName,
        payrollUrl: `${this.webUrl}/payroll/${params.payrollId}`,
      },
    );
  }

  async sendPayrollRejected(params: {
    to: string;
    firstName: string;
    payrollName: string;
    payrollId: string;
    level: string;
    comments?: string | null;
  }): Promise<void> {
    await this.send(
      params.to,
      `Payroll rejected: ${params.payrollName}`,
      'payroll-rejected',
      {
        firstName: params.firstName,
        payrollName: params.payrollName,
        level: params.level,
        comments: params.comments ?? null,
        payrollUrl: `${this.webUrl}/payroll/${params.payrollId}`,
      },
    );
  }

  async sendApprovalRequired(params: {
    to: string;
    firstName: string;
    payrollName: string;
    payrollId: string;
    level: string;
  }): Promise<void> {
    await this.send(
      params.to,
      `Approval needed: ${params.payrollName}`,
      'approval-required',
      {
        firstName: params.firstName,
        payrollName: params.payrollName,
        level: params.level,
        approvalsUrl: `${this.webUrl}/approvals`,
        payrollUrl: `${this.webUrl}/payroll/${params.payrollId}`,
      },
    );
  }
}
