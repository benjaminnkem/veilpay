import { createHash, randomBytes } from 'node:crypto';
import { HttpStatus, Injectable } from '@nestjs/common';
import { SiweMessage, generateNonce } from 'siwe';
import { getAddress } from 'viem';
import { ApiError } from '../common/api-error';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';

const sha256 = (v: string) => createHash('sha256').update(v).digest('hex');

@Injectable()
export class WalletsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}
  async challenge(userId: string, address: string, chainId: number) {
    if (chainId !== Number(process.env.WEB3_CHAIN_ID))
      throw new ApiError('WALLET_CHAIN_INVALID', 'Unsupported chain');
    const checksum = getAddress(address);
    const nonce = generateNonce() + randomBytes(4).toString('hex');
    const expiresAt = new Date(Date.now() + 5 * 60_000);
    const message = new SiweMessage({
      domain: process.env.SIWE_DOMAIN,
      address: checksum,
      statement: `Verify wallet ownership for VeilPay user ${userId}`,
      uri: process.env.SIWE_URI,
      version: '1',
      chainId,
      nonce,
      issuedAt: new Date().toISOString(),
      expirationTime: expiresAt.toISOString(),
      requestId: userId,
    }).prepareMessage();
    const record = await this.prisma.walletChallenge.create({
      data: {
        userId,
        nonceHash: sha256(nonce),
        message,
        address: checksum,
        domain: process.env.SIWE_DOMAIN!,
        uri: process.env.SIWE_URI!,
        chainId,
        expiresAt,
      },
    });
    return { challengeId: record.id, message, expiresAt };
  }

  async verify(
    userId: string,
    challengeId: string,
    message: string,
    signature: string,
  ) {
    const challenge = await this.prisma.walletChallenge.findFirst({
      where: { id: challengeId, userId },
    });
    if (!challenge || challenge.usedAt)
      throw new ApiError(
        'WALLET_CHALLENGE_REPLAYED',
        'Challenge has already been used',
      );
    if (challenge.expiresAt <= new Date())
      throw new ApiError('WALLET_CHALLENGE_EXPIRED', 'Challenge expired');
    if (message !== challenge.message)
      throw new ApiError(
        'WALLET_CHALLENGE_MISMATCH',
        'Challenge message mismatch',
      );
    const siwe = new SiweMessage(message);
    if (
      siwe.domain !== challenge.domain ||
      siwe.uri !== challenge.uri ||
      BigInt(siwe.chainId) !== challenge.chainId ||
      siwe.requestId !== userId ||
      sha256(siwe.nonce) !== challenge.nonceHash
    )
      throw new ApiError(
        'WALLET_CHALLENGE_MISMATCH',
        'Challenge bindings do not match',
      );
    try {
      await siwe.verify({
        signature,
        domain: challenge.domain,
        nonce: siwe.nonce,
        time: new Date().toISOString(),
      });
    } catch {
      throw new ApiError(
        'WALLET_SIGNATURE_INVALID',
        'Wallet signature is invalid',
      );
    }
    const address = getAddress(siwe.address);
    const linked = await this.prisma.wallet.findUnique({ where: { address } });
    if (linked && linked.userId !== userId)
      throw new ApiError(
        'WALLET_ALREADY_LINKED',
        'Wallet is linked to another account',
        HttpStatus.CONFLICT,
      );
    const wallet = await this.prisma.$transaction(async (tx) => {
      const consumed = await tx.walletChallenge.updateMany({
        where: { id: challenge.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (consumed.count !== 1)
        throw new ApiError(
          'WALLET_CHALLENGE_REPLAYED',
          'Challenge has already been used',
        );
      const count = await tx.wallet.count({ where: { userId } });
      return tx.wallet.upsert({
        where: { address },
        update: { verifiedAt: new Date() },
        create: {
          userId,
          address,
          verifiedAt: new Date(),
          isPrimary: count === 0,
        },
      });
    });
    await this.audit.record(
      userId,
      null,
      'WALLET_VERIFIED',
      'Wallet',
      wallet.id,
      { address },
    );
    return wallet;
  }
  list(userId: string) {
    return this.prisma.wallet.findMany({
      where: { userId },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });
  }
  async primary(userId: string, walletId: string) {
    const wallet = await this.prisma.wallet.findFirst({
      where: { id: walletId, userId },
    });
    if (!wallet)
      throw new ApiError(
        'WALLET_NOT_FOUND',
        'Wallet not found',
        HttpStatus.NOT_FOUND,
      );
    await this.prisma.$transaction([
      this.prisma.wallet.updateMany({
        where: { userId },
        data: { isPrimary: false },
      }),
      this.prisma.wallet.update({
        where: { id: wallet.id },
        data: { isPrimary: true },
      }),
    ]);
    return { selected: true };
  }
  async unlink(userId: string, walletId: string) {
    const wallet = await this.prisma.wallet.findFirst({
      where: { id: walletId, userId },
      include: { deploymentIntents: true, employeeProfiles: true },
    });
    if (!wallet)
      throw new ApiError(
        'WALLET_NOT_FOUND',
        'Wallet not found',
        HttpStatus.NOT_FOUND,
      );
    if (wallet.deploymentIntents.length || wallet.employeeProfiles.length)
      throw new ApiError(
        'WALLET_IN_USE',
        'Wallet is in use and cannot be unlinked',
      );
    await this.prisma.wallet.delete({ where: { id: wallet.id } });
    return { unlinked: true };
  }
}
