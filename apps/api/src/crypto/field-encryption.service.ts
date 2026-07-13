import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ApiError } from '../common/api-error';

interface Envelope {
  v: number;
  alg: 'A256GCM';
  kid: string;
  iv: string;
  ciphertext: string;
  tag: string;
}

@Injectable()
export class FieldEncryptionService {
  private key(): Buffer {
    const key = Buffer.from(process.env.DATA_ENCRYPTION_KEY!.slice(2), 'hex');
    if (key.length !== 32)
      throw new Error('DATA_ENCRYPTION_KEY must be a 32-byte hex key');
    return key;
  }
  aad(companyId: string, employeeId: string): Buffer {
    return Buffer.from(`veilpay|${companyId}|${employeeId}|salary`, 'utf8');
  }
  encrypt(plaintext: string, companyId: string, employeeId: string): Buffer {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key(), iv);
    cipher.setAAD(this.aad(companyId, employeeId));
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const envelope: Envelope = {
      v: 1,
      alg: 'A256GCM',
      kid: process.env.DATA_ENCRYPTION_KEY_VERSION ?? '1',
      iv: iv.toString('base64'),
      ciphertext: ciphertext.toString('base64'),
      tag: cipher.getAuthTag().toString('base64'),
    };
    return Buffer.from(JSON.stringify(envelope), 'utf8');
  }
  decrypt(data: Uint8Array, companyId: string, employeeId: string): string {
    try {
      const e = JSON.parse(Buffer.from(data).toString('utf8')) as Envelope;
      if (e.v !== 1 || e.alg !== 'A256GCM')
        throw new Error('unsupported envelope');
      const decipher = createDecipheriv(
        'aes-256-gcm',
        this.key(),
        Buffer.from(e.iv, 'base64'),
      );
      decipher.setAAD(this.aad(companyId, employeeId));
      decipher.setAuthTag(Buffer.from(e.tag, 'base64'));
      return Buffer.concat([
        decipher.update(Buffer.from(e.ciphertext, 'base64')),
        decipher.final(),
      ]).toString('utf8');
    } catch {
      throw new ApiError(
        'SALARY_DECRYPTION_FAILED',
        'Encrypted salary could not be authenticated',
      );
    }
  }
}
