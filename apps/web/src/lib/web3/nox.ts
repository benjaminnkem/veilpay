import { createViemHandleClient } from '@iexec-nox/handle';
import {
  type Address,
  type Hex,
  type PublicClient,
  type WalletClient,
  decodeEventLog,
  formatUnits,
  isAddress,
} from 'viem';
import { sepolia } from 'viem/chains';

export const ZERO_HANDLE =
  '0x0000000000000000000000000000000000000000000000000000000000000000' as const;

export const CTOKEN_ABI = [
  {
    type: 'function',
    name: 'confidentialBalanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'bytes32' }],
  },
  {
    type: 'function',
    name: 'underlying',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }],
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8' }],
  },
  {
    type: 'function',
    name: 'symbol',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }],
  },
  {
    type: 'function',
    name: 'unwrap',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'bytes32' },
    ],
    outputs: [{ type: 'bytes32' }],
  },
  {
    type: 'function',
    name: 'finalizeUnwrap',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'unwrapRequestId', type: 'bytes32' },
      { name: 'decryptedAmountAndProof', type: 'bytes' },
    ],
    outputs: [],
  },
  {
    type: 'event',
    name: 'UnwrapRequested',
    inputs: [
      { name: 'receiver', type: 'address', indexed: true },
      { name: 'amount', type: 'bytes32', indexed: false },
    ],
  },
] as const;

export const ERC20_BALANCE_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8' }],
  },
  {
    type: 'function',
    name: 'symbol',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }],
  },
] as const;

export function isZeroHandle(handle?: string | null): boolean {
  if (!handle) return true;
  return handle.toLowerCase() === ZERO_HANDLE;
}

export async function createNoxHandleClient(walletClient: WalletClient) {
  if (!walletClient.account) {
    throw new Error('Wallet client has no account');
  }
  return createViemHandleClient(walletClient);
}

export async function readConfidentialBalanceHandle(
  publicClient: PublicClient,
  cToken: Address,
  account: Address,
): Promise<Hex> {
  return (await publicClient.readContract({
    address: cToken,
    abi: CTOKEN_ABI,
    functionName: 'confidentialBalanceOf',
    args: [account],
  })) as Hex;
}

export async function decryptConfidentialBalance(params: {
  walletClient: WalletClient;
  publicClient: PublicClient;
  cToken: Address;
  account: Address;
}): Promise<{
  handle: Hex;
  amount: bigint;
  formatted: string;
  decimals: number;
  symbol: string;
}> {
  const { walletClient, publicClient, cToken, account } = params;
  const handle = await readConfidentialBalanceHandle(
    publicClient,
    cToken,
    account,
  );
  if (isZeroHandle(handle)) {
    return {
      handle,
      amount: 0n,
      formatted: '0',
      decimals: 6,
      symbol: 'wcUSDC',
    };
  }

  const [decimals, symbol] = await Promise.all([
    publicClient.readContract({
      address: cToken,
      abi: CTOKEN_ABI,
      functionName: 'decimals',
    }) as Promise<number>,
    publicClient
      .readContract({
        address: cToken,
        abi: CTOKEN_ABI,
        functionName: 'symbol',
      })
      .catch(() => 'wcUSDC') as Promise<string>,
  ]);

  const handleClient = await createNoxHandleClient(walletClient);
  const { value } = await handleClient.decrypt(handle as `0x${string}`);
  const amount = typeof value === 'bigint' ? value : BigInt(String(value));

  return {
    handle,
    amount,
    formatted: formatUnits(amount, decimals),
    decimals,
    symbol,
  };
}

export async function unwrapConfidentialBalance(params: {
  walletClient: WalletClient;
  publicClient: PublicClient;
  cToken: Address;
  account: Address;
  onStatus?: (message: string) => void;
}): Promise<{
  unwrapRequestId: Hex;
  amount: bigint;
  formatted: string;
  unwrapTx: Hex;
  finalizeTx: Hex;
  underlying: Address;
}> {
  const { walletClient, publicClient, cToken, account, onStatus } = params;
  if (!walletClient.account) {
    throw new Error('Connect a wallet first');
  }
  if (walletClient.chain?.id && walletClient.chain.id !== sepolia.id) {
    throw new Error('Switch your wallet to Ethereum Sepolia to unwrap');
  }

  onStatus?.('Reading confidential balance…');
  const handle = await readConfidentialBalanceHandle(
    publicClient,
    cToken,
    account,
  );
  if (isZeroHandle(handle)) {
    throw new Error('No confidential cToken balance to unwrap on this wallet');
  }

  const [decimals, underlying] = await Promise.all([
    publicClient.readContract({
      address: cToken,
      abi: CTOKEN_ABI,
      functionName: 'decimals',
    }) as Promise<number>,
    publicClient.readContract({
      address: cToken,
      abi: CTOKEN_ABI,
      functionName: 'underlying',
    }) as Promise<Address>,
  ]);

  onStatus?.('Requesting unwrap (burn confidential balance)…');
  const unwrapTx = await writeContractSafe(walletClient, publicClient, {
    address: cToken,
    abi: CTOKEN_ABI,
    functionName: 'unwrap',
    args: [account, account, handle],
  });

  const unwrapReceipt = await publicClient.waitForTransactionReceipt({
    hash: unwrapTx,
    timeout: 120_000,
    pollingInterval: 2_000,
  });
  if (unwrapReceipt.status !== 'success') {
    throw new Error(`Unwrap request failed (tx ${unwrapTx})`);
  }

  let unwrapRequestId: Hex | null = null;
  for (const log of unwrapReceipt.logs) {
    if (log.address.toLowerCase() !== cToken.toLowerCase()) continue;
    try {
      const decoded = decodeEventLog({
        abi: CTOKEN_ABI,
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName === 'UnwrapRequested') {
        unwrapRequestId = decoded.args.amount as Hex;
        break;
      }
    } catch {
      /* skip */
    }
  }

  if (!unwrapRequestId) {
    throw new Error(
      'Unwrap mined but UnwrapRequested event was not found. Check the tx on explorer.',
    );
  }

  try {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(
        pendingUnwrapKey(cToken, account),
        JSON.stringify({ unwrapRequestId, unwrapTx }),
      );
    }
  } catch {
    /* ignore storage errors */
  }

  onStatus?.('Waiting for Nox public decryption of burn amount…');
  const handleClient = await createNoxHandleClient(walletClient);
  const { value, decryptionProof } = await pollPublicDecrypt(
    handleClient,
    unwrapRequestId,
    onStatus,
  );
  const amount = typeof value === 'bigint' ? value : BigInt(String(value));

  if (!decryptionProof || decryptionProof.length < 2 + 65 * 2 + 2) {
    throw new Error(
      'Nox publicDecrypt returned an invalid decryption proof. Wait a few seconds and use Finalize pending unwrap.',
    );
  }

  onStatus?.('Finalizing unwrap to plain USDC…');
  const finalizeTx = await finalizeUnwrapWithProof({
    walletClient,
    publicClient,
    cToken,
    unwrapRequestId,
    decryptionProof: decryptionProof as Hex,
  });

  try {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(pendingUnwrapKey(cToken, account));
    }
  } catch {
    /* ignore */
  }

  return {
    unwrapRequestId,
    amount,
    formatted: formatUnits(amount, decimals),
    unwrapTx,
    finalizeTx,
    underlying,
  };
}

export async function finalizePendingUnwrap(params: {
  walletClient: WalletClient;
  publicClient: PublicClient;
  cToken: Address;
  account: Address;
  unwrapRequestId?: Hex | null;
  onStatus?: (message: string) => void;
}): Promise<{
  unwrapRequestId: Hex;
  amount: bigint;
  formatted: string;
  finalizeTx: Hex;
}> {
  const { walletClient, publicClient, cToken, account, onStatus } = params;
  if (!walletClient.account) {
    throw new Error('Connect a wallet first');
  }

  let unwrapRequestId = params.unwrapRequestId ?? null;
  if (!unwrapRequestId && typeof window !== 'undefined') {
    try {
      const raw = window.sessionStorage.getItem(
        pendingUnwrapKey(cToken, account),
      );
      if (raw) {
        const parsed = JSON.parse(raw) as { unwrapRequestId?: string };
        if (parsed.unwrapRequestId) {
          unwrapRequestId = parsed.unwrapRequestId as Hex;
        }
      }
    } catch {
      /* ignore */
    }
  }

  if (!unwrapRequestId) {
    throw new Error(
      'No pending unwrap request id. Run Unwrap all first, or paste the request id from the unwrap tx event.',
    );
  }

  onStatus?.('Fetching Nox public decryption proof…');
  const handleClient = await createNoxHandleClient(walletClient);
  const { value, decryptionProof } = await pollPublicDecrypt(
    handleClient,
    unwrapRequestId,
    onStatus,
  );
  const amount = typeof value === 'bigint' ? value : BigInt(String(value));

  const decimals = (await publicClient.readContract({
    address: cToken,
    abi: CTOKEN_ABI,
    functionName: 'decimals',
  })) as number;

  onStatus?.('Finalizing unwrap to plain USDC…');
  const finalizeTx = await finalizeUnwrapWithProof({
    walletClient,
    publicClient,
    cToken,
    unwrapRequestId,
    decryptionProof: decryptionProof as Hex,
  });

  try {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(pendingUnwrapKey(cToken, account));
    }
  } catch {
    /* ignore */
  }

  return {
    unwrapRequestId,
    amount,
    formatted: formatUnits(amount, decimals),
    finalizeTx,
  };
}

async function finalizeUnwrapWithProof(params: {
  walletClient: WalletClient;
  publicClient: PublicClient;
  cToken: Address;
  unwrapRequestId: Hex;
  decryptionProof: Hex;
}): Promise<Hex> {
  const {
    walletClient,
    publicClient,
    cToken,
    unwrapRequestId,
    decryptionProof,
  } = params;

  const proof = normalizeDecryptionProof(decryptionProof);

  const finalizeTx = await writeContractSafe(walletClient, publicClient, {
    address: cToken,
    abi: CTOKEN_ABI,
    functionName: 'finalizeUnwrap',
    args: [unwrapRequestId, proof],
  });

  const finalizeReceipt = await publicClient.waitForTransactionReceipt({
    hash: finalizeTx,
    timeout: 120_000,
    pollingInterval: 2_000,
  });
  if (finalizeReceipt.status !== 'success') {
    throw new Error(`finalizeUnwrap failed on-chain (tx ${finalizeTx})`);
  }
  return finalizeTx;
}

/**
 * Nox validateDecryptionProof expects: 65-byte ECDSA signature || plaintext bytes.
 * Some gateways return a longer blob; keep as-is if already valid length.
 */
function normalizeDecryptionProof(proof: string): Hex {
  const hex = proof.startsWith('0x') ? proof : `0x${proof}`;
  if (hex.length < 2 + 65 * 2 + 2) {
    throw new Error(`Decryption proof too short (${hex.length} chars)`);
  }
  return hex as Hex;
}

function pendingUnwrapKey(cToken: Address, account: Address): string {
  return `veilpay:pending-unwrap:${cToken.toLowerCase()}:${account.toLowerCase()}`;
}

async function writeContractSafe(
  walletClient: WalletClient,
  publicClient: PublicClient,
  params: {
    address: Address;
    abi: typeof CTOKEN_ABI;
    functionName: 'unwrap' | 'finalizeUnwrap';
    args: readonly unknown[];
  },
): Promise<Hex> {
  if (!walletClient.account) {
    throw new Error('Wallet has no account');
  }

  try {
    const { request } = await publicClient.simulateContract({
      address: params.address,
      abi: params.abi,
      functionName: params.functionName,
      args: params.args as never,
      account: walletClient.account,
      chain: sepolia,
    });
    return walletClient.writeContract(request);
  } catch (simErr) {
    const simMessage =
      simErr instanceof Error ? simErr.message : String(simErr);

    if (/gasLimit|estimate|null/i.test(simMessage)) {
      try {
        const hash = await walletClient.writeContract({
          address: params.address,
          abi: params.abi,
          functionName: params.functionName,
          args: params.args as never,
          account: walletClient.account,
          chain: sepolia,
          gas: 800_000n,
        });
        return hash;
      } catch (writeErr) {
        throw new Error(explainContractError(writeErr, params.functionName));
      }
    }

    throw new Error(explainContractError(simErr, params.functionName));
  }
}

function explainContractError(err: unknown, fn: string): string {
  if (!(err instanceof Error)) return `${fn} failed: ${String(err)}`;
  const msg = err.message;
  if (/InvalidUnwrapRequest|unwrapRequest/i.test(msg)) {
    return `${fn} failed: unwrap request is missing or already finalized. Run a fresh Unwrap all.`;
  }
  if (/InvalidProof|Invalid signature|Proof/i.test(msg)) {
    return `${fn} failed: Nox decryption proof was rejected. Wait for the runner, then Finalize pending unwrap.`;
  }
  if (/gasLimit.*null|Cannot destructure property 'gasLimit'/i.test(msg)) {
    return `${fn} failed during gas estimation (RPC returned null). Usually the call would revert — often an invalid/expired decryption proof or already-finalized unwrap. Try Finalize pending unwrap in a few seconds.`;
  }
  return `${fn} failed: ${msg.slice(0, 500)}`;
}

async function pollPublicDecrypt(
  handleClient: Awaited<ReturnType<typeof createNoxHandleClient>>,
  handle: Hex,
  onStatus?: (message: string) => void,
): Promise<{ value: bigint | string | boolean; decryptionProof: string }> {
  const maxAttempts = 20;
  for (let i = 0; i < maxAttempts; i += 1) {
    try {
      const result = await handleClient.publicDecrypt(handle as `0x${string}`);
      return result;
    } catch (err) {
      const name = err instanceof Error ? err.name : '';
      const message = err instanceof Error ? err.message : String(err);
      const pending =
        name === 'NotYetComputedHandleError' ||
        /not yet computed|not computed|pending/i.test(message);
      if (!pending || i === maxAttempts - 1) {
        throw err instanceof Error ? err : new Error(message);
      }
      onStatus?.(
        `Nox runner still computing unwrap amount (${i + 1}/${maxAttempts})…`,
      );
      await sleep(2_000);
    }
  }
  throw new Error('Timed out waiting for Nox public decryption');
}

export function resolveCtokenAddress(
  orgAddress?: string | null,
  envAddress?: string | null,
): Address | null {
  const raw = (orgAddress || envAddress || '').trim();
  if (!raw || !isAddress(raw)) return null;
  return raw as Address;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
