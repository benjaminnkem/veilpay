import { AuditService } from '../audit/audit.service';
import { CompaniesService } from '../companies/companies.service';
import { FieldEncryptionService } from '../crypto/field-encryption.service';
import { PrismaService } from '../database/prisma.service';
import { EmailService } from '../email/email.service';
import { EmployeesService } from './employees.service';

describe('EmployeesService invitation compensation', () => {
  const crypto = new FieldEncryptionService();

  interface InvitationCreateData {
    id: string;
    companyId: string;
    inviterUserId: string;
    displayName: string;
    email: string;
    emailNormalized: string;
    tokenHash: string;
    salaryCiphertext: Uint8Array;
    payFrequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
    expiresAt: Date;
  }

  interface StoredInvitation extends InvitationCreateData {
    status: 'PENDING';
    acceptedAt: Date | null;
    revokedAt: Date | null;
    createdAt: Date;
  }

  interface EmployeeCreateData {
    id: string;
    salaryCiphertext?: Uint8Array;
    salaryTokenAddress?: string;
    payFrequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  }

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    process.env.DATA_ENCRYPTION_KEY = `0x${'22'.repeat(32)}`;
    process.env.DATA_ENCRYPTION_KEY_VERSION = 'test';
    process.env.CONFIDENTIAL_TOKEN_ADDRESS =
      '0x2222222222222222222222222222222222222222';
  });

  it('encrypts salary on invite and re-encrypts it for the accepted employee', async () => {
    let storedInvitation: StoredInvitation | undefined;
    let createdProfile: EmployeeCreateData | undefined;
    const transaction = {
      employeeInvitation: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      companyMember: {
        upsert: jest.fn().mockResolvedValue({ id: 'member-id' }),
      },
      employeeProfile: {
        create: jest
          .fn()
          .mockImplementation(({ data }: { data: EmployeeCreateData }) => {
            createdProfile = data;
            return Promise.resolve({
              ...data,
              salaryCiphertext: data.salaryCiphertext ?? null,
            });
          }),
      },
    };
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          id: 'employee-user-id',
          emailNormalized: 'grace@example.com',
          wallets: [{ id: 'wallet-id' }],
        }),
      },
      employeeInvitation: {
        create: jest
          .fn()
          .mockImplementation(({ data }: { data: InvitationCreateData }) => {
            storedInvitation = {
              ...data,
              status: 'PENDING',
              acceptedAt: null,
              revokedAt: null,
              createdAt: new Date(),
            };
            return Promise.resolve(storedInvitation);
          }),
        findUnique: jest.fn().mockImplementation(() => storedInvitation),
        findMany: jest
          .fn()
          .mockImplementation(() =>
            Promise.resolve(storedInvitation ? [storedInvitation] : []),
          ),
      },
      $transaction: jest
        .fn()
        .mockImplementation(
          (callback: (client: typeof transaction) => unknown) =>
            callback(transaction),
        ),
    };
    const service = new EmployeesService(
      prisma as unknown as PrismaService,
      {
        assertRole: jest.fn().mockResolvedValue(undefined),
      } as unknown as CompaniesService,
      crypto,
      {
        enqueue: jest.fn().mockResolvedValue(undefined),
      } as unknown as EmailService,
      {
        record: jest.fn().mockResolvedValue(undefined),
      } as unknown as AuditService,
    );

    const invite = await service.invite('inviter-id', 'company-id', {
      displayName: 'Grace Hopper',
      email: 'Grace@Example.com',
      salary: '4250.50',
      payFrequency: 'BIWEEKLY',
    });

    expect(invite.salaryCiphertext).toBe('[ENCRYPTED]');
    expect(invite.payFrequency).toBe('BIWEEKLY');
    expect(storedInvitation).toBeDefined();
    const persistedInvitation = storedInvitation!;
    expect(
      Buffer.from(persistedInvitation.salaryCiphertext).toString(),
    ).not.toContain('4250.50');
    expect(
      crypto.decryptInvitationSalary(
        persistedInvitation.salaryCiphertext,
        'company-id',
        persistedInvitation.id,
      ),
    ).toBe('4250.5');
    await expect(service.invitations('inviter-id', 'company-id')).resolves.toEqual([
      expect.objectContaining({ salaryCiphertext: '[ENCRYPTED]' }),
    ]);

    const accepted = await service.accept(
      'employee-user-id',
      invite.testToken!,
    );

    expect(accepted.salaryCiphertext).toBe('[ENCRYPTED]');
    expect(createdProfile).toBeDefined();
    const persistedProfile = createdProfile!;
    expect(persistedProfile.payFrequency).toBe('BIWEEKLY');
    expect(persistedProfile.salaryTokenAddress).toBe(
      process.env.CONFIDENTIAL_TOKEN_ADDRESS,
    );
    expect(
      crypto.decrypt(
        persistedProfile.salaryCiphertext!,
        'company-id',
        persistedProfile.id,
      ),
    ).toBe('4250.5');
    expect(persistedProfile.salaryCiphertext).not.toEqual(
      persistedInvitation.salaryCiphertext,
    );
  });
});
