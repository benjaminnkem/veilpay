import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import { buildOpenApiConfig } from '../src/common/openapi.config';

const HTTP_METHODS = ['get', 'post', 'patch', 'put', 'delete'] as const;

function expectConcreteSchema(document: OpenAPIObject, schema: unknown): void {
  expect(schema).toBeTruthy();
  if (!schema || typeof schema !== 'object') return;
  if ('$ref' in schema && typeof schema.$ref === 'string') {
    const name = schema.$ref.split('/').at(-1);
    expect(name).toBeTruthy();
    const component = name ? document.components?.schemas?.[name] : undefined;
    expect(component).toBeTruthy();
    expect(
      component && 'properties' in component ? component.properties : undefined,
    ).toBeTruthy();
    return;
  }
  if ('type' in schema && schema.type === 'array' && 'items' in schema)
    expectConcreteSchema(document, schema.items);
}

describe('OpenAPI contract', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  let document: OpenAPIObject;

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    document = SwaggerModule.createDocument(app, buildOpenApiConfig());
  });

  it('documents every operation with descriptions and explicit success bodies', () => {
    const operations = Object.entries(document.paths).flatMap(([path, item]) =>
      HTTP_METHODS.flatMap((method) => {
        const operation = item?.[method];
        return operation ? [{ path, method, operation }] : [];
      }),
    );
    expect(operations.length).toBeGreaterThanOrEqual(40);

    for (const { operation } of operations) {
      expect(operation.summary).toBeTruthy();
      expect(operation.description).toBeTruthy();
      const success = Object.entries(operation.responses).find(([status]) =>
        /^2\d\d$/.test(status),
      );
      expect(success).toBeDefined();
      const response = success?.[1];
      expect(
        response &&
          'content' in response &&
          response.content?.['application/json']?.schema,
      ).toBeTruthy();
      if (response && 'content' in response)
        expectConcreteSchema(
          document,
          response.content?.['application/json']?.schema,
        );
    }
  });

  it('documents every request body as a referenced schema', () => {
    const bodyOperations = [
      ['post', '/auth/signup'],
      ['post', '/auth/verify-email'],
      ['post', '/auth/login'],
      ['post', '/auth/refresh'],
      ['post', '/auth/forgot-password'],
      ['post', '/auth/reset-password'],
      ['post', '/auth/logout'],
      ['patch', '/auth/me'],
      ['post', '/companies'],
      ['patch', '/companies/{companyId}'],
      ['patch', '/companies/{companyId}/members/{memberId}/role'],
      ['post', '/wallets/challenge'],
      ['post', '/wallets/verify'],
      ['post', '/companies/{companyId}/invitations'],
      ['post', '/invitations/accept'],
      ['patch', '/companies/{companyId}/employees/{id}'],
      [
        'post',
        '/companies/{companyId}/safe/deployment-intents/{intentId}/submit',
      ],
      ['post', '/companies/{companyId}/treasury/funding-intents'],
      [
        'post',
        '/companies/{companyId}/treasury/funding-intents/{intentId}/submit',
      ],
      ['post', '/companies/{companyId}/payroll-runs'],
      ['patch', '/companies/{companyId}/payroll-runs/{id}'],
      ['post', '/companies/{companyId}/payroll-runs/{id}/propose'],
      ['post', '/companies/{companyId}/payroll-runs/{id}/sync-safe-approval'],
    ] as const;

    for (const [method, suffix] of bodyOperations) {
      const [path, pathItem] =
        Object.entries(document.paths).find(([candidate]) =>
          candidate.endsWith(suffix),
        ) ?? [];
      expect(path).toBeDefined();
      const operation = pathItem?.[method];
      const body = operation?.requestBody;
      expect(body && 'content' in body).toBe(true);
      if (body && 'content' in body) {
        expectConcreteSchema(
          document,
          body.content['application/json']?.schema,
        );
      }
    }
  });

  it('does not expose confidential persistence fields in public response models', () => {
    const schemas = document.components?.schemas ?? {};
    for (const model of [
      'EmployeeResponseDto',
      'PayrollResponseDto',
      'PayrollItemResponseDto',
      'InvitationResponseDto',
      'UserResponseDto',
    ]) {
      const schema = schemas[model];
      expect(schema).toBeDefined();
      const serialized = JSON.stringify(schema);
      expect(serialized).not.toContain('passwordHash');
      expect(serialized).not.toContain('tokenHash');
      expect(serialized).not.toContain('salaryCiphertextSnapshot');
      expect(serialized).not.toContain('inputProof');
    }
  });

  it('documents bearer security and idempotency headers on protected critical writes', () => {
    const idempotentSuffixes = [
      '/companies',
      '/companies/{companyId}/invitations',
      '/companies/{companyId}/safe/deployment-intents',
      '/companies/{companyId}/safe/deployment-intents/{intentId}/submit',
      '/companies/{companyId}/treasury/funding-intents',
      '/companies/{companyId}/treasury/funding-intents/{intentId}/submit',
      '/companies/{companyId}/payroll-runs',
      '/companies/{companyId}/payroll-runs/{id}/prepare',
      '/companies/{companyId}/payroll-runs/{id}/safe-transaction',
      '/companies/{companyId}/payroll-runs/{id}/propose',
      '/companies/{companyId}/payroll-runs/{id}/sync-safe-approval',
      '/companies/{companyId}/payroll-runs/{id}/execute',
      '/companies/{companyId}/payroll-runs/{id}/cancel',
      '/companies/{companyId}/payroll-runs/{id}/reconcile',
    ];

    for (const suffix of idempotentSuffixes) {
      const [, pathItem] =
        Object.entries(document.paths).find(([candidate]) =>
          candidate.endsWith(suffix),
        ) ?? [];
      const operation = pathItem?.post;
      expect(operation).toBeDefined();
      expect(operation?.security).toContainEqual({ bearer: [] });
      expect(operation?.parameters).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            in: 'header',
            name: 'Idempotency-Key',
            required: true,
          }),
        ]),
      );
    }
  });

  afterAll(async () => {
    await app?.close();
    await moduleFixture?.close();
  });
});
