'use client';

import { useQuery } from '@tanstack/react-query';
import {
  EyeIcon,
  Loader2Icon,
  RefreshCwIcon,
  ShieldIcon,
  UnlockIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { formatUnits, getAddress, isAddress } from 'viem';
import {
  useAccount,
  usePublicClient,
  useSwitchChain,
  useWalletClient,
} from 'wagmi';
import { sepolia } from 'wagmi/chains';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getOrganization } from '@/features/settings/services/updateProfile';
import { getMyEmployee } from '@/features/settings/services/payout-wallet';
import {
  ERC20_BALANCE_ABI,
  decryptConfidentialBalance,
  finalizePendingUnwrap,
  isZeroHandle,
  readConfidentialBalanceHandle,
  resolveCtokenAddress,
  unwrapConfidentialBalance,
} from '@/lib/web3/nox';
import { notify } from '@/lib/toast';
import { cn } from '@/lib/utils';

export function ConfidentialPayoutCard() {
  const { address, isConnected, chainId } = useAccount();
  const publicClient = usePublicClient({ chainId: sepolia.id });
  const { data: walletClient } = useWalletClient({ chainId: sepolia.id });
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState<'decrypt' | 'unwrap' | 'finalize' | null>(
    null,
  );
  const [decrypted, setDecrypted] = useState<{
    formatted: string;
    symbol: string;
    handle: string;
  } | null>(null);

  const orgQuery = useQuery({
    queryKey: ['organization', 'me'],
    queryFn: getOrganization,
  });

  const employeeQuery = useQuery({
    queryKey: ['employees', 'me'],
    queryFn: getMyEmployee,
    retry: false,
  });

  const cToken = useMemo(
    () =>
      resolveCtokenAddress(
        orgQuery.data?.confidentialTokenAddress,
        process.env.NEXT_PUBLIC_NOX_CTOKEN_ADDRESS,
      ),
    [orgQuery.data?.confidentialTokenAddress],
  );

  const linkedWallet = employeeQuery.data?.walletAddress ?? null;
  const connectedMatchesLinked = useMemo(() => {
    if (!linkedWallet || !address || !isAddress(linkedWallet)) return false;
    try {
      return getAddress(linkedWallet) === getAddress(address);
    } catch {
      return false;
    }
  }, [linkedWallet, address]);

  const balanceQuery = useQuery({
    queryKey: ['nox', 'confidential-balance', cToken, address],
    enabled: Boolean(publicClient && cToken && address && isConnected),
    queryFn: async () => {
      if (!publicClient || !cToken || !address) {
        throw new Error('Missing client or addresses');
      }
      const handle = await readConfidentialBalanceHandle(
        publicClient,
        cToken,
        address,
      );
      let usdcFormatted: string | null = null;
      try {
        const underlying = (await publicClient.readContract({
          address: cToken,
          abi: [
            {
              type: 'function',
              name: 'underlying',
              stateMutability: 'view',
              inputs: [],
              outputs: [{ type: 'address' }],
            },
          ],
          functionName: 'underlying',
        })) as `0x${string}`;
        const [raw, decimals, symbol] = await Promise.all([
          publicClient.readContract({
            address: underlying,
            abi: ERC20_BALANCE_ABI,
            functionName: 'balanceOf',
            args: [address],
          }) as Promise<bigint>,
          publicClient.readContract({
            address: underlying,
            abi: ERC20_BALANCE_ABI,
            functionName: 'decimals',
          }) as Promise<number>,
          publicClient.readContract({
            address: underlying,
            abi: ERC20_BALANCE_ABI,
            functionName: 'symbol',
          }) as Promise<string>,
        ]);
        usdcFormatted = `${formatUnits(raw, decimals)} ${symbol}`;
      } catch {
        usdcFormatted = null;
      }
      return {
        handle,
        hasConfidential: !isZeroHandle(handle),
        usdcFormatted,
      };
    },
    refetchInterval: 15_000,
  });

  async function ensureSepolia() {
    if (chainId !== sepolia.id) {
      if (!switchChain) {
        throw new Error('Switch your wallet to Ethereum Sepolia');
      }
      await switchChain({ chainId: sepolia.id });
    }
  }

  async function onDecrypt() {
    if (!publicClient || !walletClient || !cToken || !address) {
      notify.error('Connect the payout wallet on Sepolia first');
      return;
    }
    setBusy('decrypt');
    setStatus('Decrypting confidential balance (Nox ACL)…');
    try {
      await ensureSepolia();
      const result = await decryptConfidentialBalance({
        walletClient,
        publicClient,
        cToken,
        account: address,
      });
      setDecrypted({
        formatted: result.formatted,
        symbol: result.symbol,
        handle: result.handle,
      });
      notify.success(
        'Balance decrypted',
        `${result.formatted} ${result.symbol} (only you can decrypt)`,
      );
      setStatus(null);
    } catch (error) {
      notify.error(error);
      setStatus(null);
    } finally {
      setBusy(null);
    }
  }

  async function onUnwrap() {
    if (!publicClient || !walletClient || !cToken || !address) {
      notify.error('Connect the payout wallet on Sepolia first');
      return;
    }
    setBusy('unwrap');
    setDecrypted(null);
    try {
      await ensureSepolia();
      const result = await unwrapConfidentialBalance({
        walletClient,
        publicClient,
        cToken,
        account: address,
        onStatus: setStatus,
      });
      notify.success(
        'Unwrapped to plain USDC',
        `${result.formatted} USDC sent to your wallet. Finalize tx ${result.finalizeTx.slice(0, 10)}…`,
      );
      setStatus(null);
      setDecrypted(null);
      await balanceQuery.refetch();
    } catch (error) {
      notify.error(error);
      setStatus(null);
    } finally {
      setBusy(null);
    }
  }

  async function onFinalizePending() {
    if (!publicClient || !walletClient || !cToken || !address) {
      notify.error('Connect the payout wallet on Sepolia first');
      return;
    }
    setBusy('finalize');
    try {
      await ensureSepolia();
      const result = await finalizePendingUnwrap({
        walletClient,
        publicClient,
        cToken,
        account: address,
        onStatus: setStatus,
      });
      notify.success(
        'Unwrapped to plain USDC',
        `${result.formatted} USDC. Tx ${result.finalizeTx.slice(0, 10)}…`,
      );
      setStatus(null);
      await balanceQuery.refetch();
    } catch (error) {
      notify.error(error);
      setStatus(null);
    } finally {
      setBusy(null);
    }
  }

  const ready =
    isConnected &&
    address &&
    cToken &&
    connectedMatchesLinked &&
    Boolean(balanceQuery.data?.hasConfidential);

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldIcon className="size-4 text-primary" />
              Confidential payout (Nox)
            </CardTitle>
            <CardDescription>
              After Nox payroll, your pay is an encrypted cToken balance. Decrypt
              to view the amount privately, or unwrap to receive plain Sepolia
              USDC.
            </CardDescription>
          </div>
          {balanceQuery.data?.hasConfidential ? (
            <Badge variant="secondary">cToken balance</Badge>
          ) : (
            <Badge variant="outline">No confidential balance</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4 text-sm">
        {!cToken ? (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-800 dark:text-amber-200">
            Organization has no confidential token configured. Finance must set
            the ERC-7984 cToken under Treasury → Nox.
          </p>
        ) : (
          <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-2">
            <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              cToken
            </div>
            <p className="font-mono text-xs break-all">{cToken}</p>
            <div className="grid gap-2 sm:grid-cols-2 pt-1">
              <div>
                <div className="text-xs text-muted-foreground">
                  Confidential handle
                </div>
                <div className="font-mono text-[11px] break-all">
                  {balanceQuery.isLoading
                    ? 'Reading…'
                    : balanceQuery.data?.hasConfidential
                      ? `${balanceQuery.data.handle.slice(0, 12)}…${balanceQuery.data.handle.slice(-8)}`
                      : 'None (empty)'}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">
                  Plain USDC on this wallet
                </div>
                <div className="font-medium">
                  {balanceQuery.data?.usdcFormatted ?? '—'}
                </div>
              </div>
            </div>
          </div>
        )}

        {!isConnected ? (
          <p className="text-muted-foreground">
            Connect the same wallet you linked as payout address.
          </p>
        ) : !connectedMatchesLinked ? (
          <p className="text-amber-700 dark:text-amber-300">
            Connected wallet does not match your linked payout address
            {linkedWallet ? ` (${linkedWallet.slice(0, 8)}…)` : ''}. Switch
            accounts to decrypt or unwrap.
          </p>
        ) : chainId !== sepolia.id ? (
          <p className="text-amber-700 dark:text-amber-300">
            Switch to Ethereum Sepolia for Nox decrypt / unwrap.
          </p>
        ) : null}

        {decrypted ? (
          <div className="rounded-lg border border-primary/25 bg-primary/5 p-3">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Decrypted confidential balance
            </p>
            <p className="mt-1 text-lg font-semibold">
              {decrypted.formatted}{' '}
              <span className="text-sm font-normal text-muted-foreground">
                {decrypted.symbol}
              </span>
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Visible only after your wallet signed the Nox decrypt request.
              Amounts stay hidden on-chain.
            </p>
          </div>
        ) : null}

        {status ? (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2Icon className="size-3.5 animate-spin" />
            {status}
          </p>
        ) : null}
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={!ready || busy !== null}
          onClick={() => void onDecrypt()}
        >
          {busy === 'decrypt' ? (
            <Loader2Icon className="size-3.5 animate-spin" />
          ) : (
            <EyeIcon className="size-3.5" />
          )}
          Decrypt balance
        </Button>
        <Button
          type="button"
          disabled={!ready || busy !== null}
          onClick={() => void onUnwrap()}
        >
          {busy === 'unwrap' ? (
            <Loader2Icon className="size-3.5 animate-spin" />
          ) : (
            <UnlockIcon className="size-3.5" />
          )}
          Unwrap all to USDC
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={
            busy !== null ||
            !isConnected ||
            !address ||
            !cToken ||
            !connectedMatchesLinked
          }
          onClick={() => void onFinalizePending()}
        >
          {busy === 'finalize' ? (
            <Loader2Icon className="size-3.5 animate-spin" />
          ) : (
            <UnlockIcon className="size-3.5" />
          )}
          Finalize pending unwrap
        </Button>
        {chainId !== sepolia.id && isConnected ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={isSwitching || !switchChain}
            onClick={() => switchChain?.({ chainId: sepolia.id })}
          >
            Switch to Sepolia
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={balanceQuery.isFetching}
          onClick={() => void balanceQuery.refetch()}
        >
          <RefreshCwIcon
            className={cn(
              'size-3.5',
              balanceQuery.isFetching && 'animate-spin',
            )}
          />
          Refresh
        </Button>
      </CardFooter>
    </Card>
  );
}
