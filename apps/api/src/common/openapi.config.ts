import { DocumentBuilder } from '@nestjs/swagger';

export function buildOpenApiConfig() {
  return new DocumentBuilder()
    .setTitle('VeilPay Confidential Payroll API')
    .setDescription(
      'Production-oriented REST API for non-custodial Safe treasuries and Nox ERC-7984 confidential payroll. Salary plaintext, Safe-owner keys, confidential proofs, refresh tokens, and one-time tokens are never exposed in response schemas. All company resources are tenant- and role-scoped. Critical writes require Idempotency-Key.',
    )
    .setVersion('1.0.0')
    .setLicense('Proprietary', '')
    .addServer('/', 'Current host')
    .addServer('http://localhost:3001', 'Local development')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Short-lived access token returned by POST /api/v1/auth/login.',
      },
      'bearer',
    )
    .build();
}
