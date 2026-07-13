import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaClient } from '@prisma/client';
import { privateKeyToAccount } from 'viem/accounts';

interface LoginBody {
  accessToken: string;
}

interface ChallengeBody {
  challengeId: string;
  message: string;
}

interface CompanyBody {
  id: string;
}

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  const prisma = new PrismaClient();

  beforeEach(async () => {
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "DurableJob" CASCADE');
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('VeilPay API is running');
  });

  it('returns the documented error envelope', async () => {
    const response = await request(app.getHttpServer())
      .get('/companies')
      .expect(401);
    expect(response.body).toEqual(
      expect.objectContaining({
        code: 'AUTH_REQUIRED',
        message: 'Authentication required',
        statusCode: 401,
        path: '/companies',
        timestamp: expect.any(String) as string,
      }),
    );
  });

  async function onboard(email: string, privateKey: `0x${string}`) {
    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        name: 'Test User',
        email,
        password: 'correct-horse-battery-staple',
      })
      .expect(201);
    const job = await prisma.durableJob.findFirstOrThrow({
      where: { type: 'SEND_EMAIL' },
      orderBy: { createdAt: 'desc' },
    });
    const token = (job.payload as { variables: { token: string } }).variables
      .token;
    await request(app.getHttpServer())
      .post('/auth/verify-email')
      .send({ token })
      .expect(201);
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'correct-horse-battery-staple' })
      .expect(201);
    const { accessToken } = login.body as LoginBody;
    const account = privateKeyToAccount(privateKey);
    const challenge = await request(app.getHttpServer())
      .post('/wallets/challenge')
      .set('authorization', `Bearer ${accessToken}`)
      .send({ address: account.address, chainId: 31337 })
      .expect(201);
    const challengeBody = challenge.body as ChallengeBody;
    const signature = await account.signMessage({
      message: challengeBody.message,
    });
    await request(app.getHttpServer())
      .post('/wallets/verify')
      .set('authorization', `Bearer ${accessToken}`)
      .send({
        challengeId: challengeBody.challengeId,
        message: challengeBody.message,
        signature,
      })
      .expect(201);
    return { accessToken, account };
  }

  it('runs signup -> verification -> login -> SIWE -> company and denies cross-tenant reads', async () => {
    const admin = await onboard('admin@example.test', `0x${'11'.repeat(32)}`);
    const companyResponse = await request(app.getHttpServer())
      .post('/companies')
      .set('authorization', `Bearer ${admin.accessToken}`)
      .set('idempotency-key', 'create-tenant-a')
      .send({ name: 'Tenant A' })
      .expect(201);
    await request(app.getHttpServer())
      .post('/companies')
      .set('authorization', `Bearer ${admin.accessToken}`)
      .set('idempotency-key', 'create-tenant-a')
      .send({ name: 'Tenant A' })
      .expect('idempotent-replayed', 'true')
      .expect(201);
    const companyId = (companyResponse.body as CompanyBody).id;
    await request(app.getHttpServer())
      .get(`/companies/${companyId}`)
      .set('authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    const outsider = await onboard(
      'outsider@example.test',
      `0x${'22'.repeat(32)}`,
    );
    await request(app.getHttpServer())
      .get(`/companies/${companyId}`)
      .set('authorization', `Bearer ${outsider.accessToken}`)
      .expect(403);
  });

  afterEach(async () => {
    await app.close();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
