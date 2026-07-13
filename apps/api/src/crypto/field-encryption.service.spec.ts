import { FieldEncryptionService } from './field-encryption.service';

describe('FieldEncryptionService', () => {
  const service = new FieldEncryptionService();
  beforeAll(() => {
    process.env.DATA_ENCRYPTION_KEY = `0x${'11'.repeat(32)}`;
    process.env.DATA_ENCRYPTION_KEY_VERSION = 'test';
  });
  it('round trips with bound associated data', () => {
    const encrypted = service.encrypt('1250.50', 'company-a', 'employee-a');
    expect(service.decrypt(encrypted, 'company-a', 'employee-a')).toBe(
      '1250.50',
    );
    expect(encrypted.toString()).not.toContain('1250.50');
  });
  it('rejects tampering and wrong associated data', () => {
    const encrypted = service.encrypt('99', 'company-a', 'employee-a');
    const envelope = JSON.parse(encrypted.toString()) as { ciphertext: string };
    envelope.ciphertext = Buffer.from('tampered').toString('base64');
    expect(() =>
      service.decrypt(
        Buffer.from(JSON.stringify(envelope)),
        'company-a',
        'employee-a',
      ),
    ).toThrow('authenticated');
    expect(() => service.decrypt(encrypted, 'company-b', 'employee-a')).toThrow(
      'authenticated',
    );
  });
});
