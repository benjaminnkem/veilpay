'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2Icon,
  LinkIcon,
  UnplugIcon,
  WalletIcon,
} from 'lucide-react';
import { useMemo } from 'react';
import { getAddress, isAddress } from 'viem';
import { useAccount, useSignMessage } from 'wagmi';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  buildPayoutWalletMessage,
  clearMyPayoutWallet,
  getMyEmployee,
  setMyPayoutWallet,
} from '@/features/settings/services/payout-wallet';
import { getWalletConnectProjectId } from '@/lib/web3/config';
import { formatAddress } from '@/lib/web3/safe';
import { notify } from '@/lib/toast';

export function PayoutWalletCard() {
  const { user } = useCurrentUser();
  const qc = useQueryClient();
  const { address, isConnected } = useAccount();
  const { signMessageAsync, isPending: isSigning } = useSignMessage();

  const employeeQuery = useQuery({
    queryKey: ['employees', 'me'],
    queryFn: getMyEmployee,
    retry: false,
  });

  const employee = employeeQuery.data;
  const linkedWallet = employee?.walletAddress ?? null;

  const connectedMatchesLinked = useMemo(() => {
    if (!linkedWallet || !address || !isAddress(linkedWallet)) return false;
    try {
      return getAddress(linkedWallet) === getAddress(address);
    } catch {
      return false;
    }
  }, [linkedWallet, address]);

  const saveMutation = useMutation({
    mutationFn: setMyPayoutWallet,
    onSuccess: async () => {
      notify.success(
        'Payout wallet saved',
        'Your employee record will use this address for payroll.',
      );
      await qc.invalidateQueries({ queryKey: ['employees', 'me'] });
      await qc.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error) => notify.error(error),
  });

  const clearMutation = useMutation({
    mutationFn: clearMyPayoutWallet,
    onSuccess: async () => {
      notify.success('Payout wallet cleared');
      await qc.invalidateQueries({ queryKey: ['employees', 'me'] });
      await qc.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error) => notify.error(error),
  });

  async function linkWallet() {
    if (!employee) {
      notify.error(
        'No employee record is linked to your account. Ask HR to create or invite you as an employee.',
      );
      return;
    }
    if (!address || !isConnected) {
      notify.error('Connect a wallet first');
      return;
    }

    const walletAddress = getAddress(address);
    const issuedAt = new Date().toISOString();
    const message = buildPayoutWalletMessage({
      email: user?.email ?? employee.email,
      employeeId: employee.id,
      walletAddress,
      issuedAt,
    });

    try {
      const signature = await signMessageAsync({ message });
      await saveMutation.mutateAsync({
        walletAddress,
        signature,
        message,
        signedAt: issuedAt,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        /user rejected|denied|rejected the request/i.test(error.message)
      ) {
        notify.error('Signature cancelled');
        return;
      }
      notify.error(error);
    }
  }

  const projectIdConfigured = Boolean(getWalletConnectProjectId());
  const busy =
    isSigning || saveMutation.isPending || clearMutation.isPending;

  return (
    <Card className="border-border/60 shadow-none">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <WalletIcon className="size-4 text-primary" />
          Wallet status
        </div>
        {linkedWallet ? (
          <Badge variant="secondary" className="gap-1">
            <CheckCircle2Icon className="size-3" />
            Linked
          </Badge>
        ) : (
          <Badge variant="outline">Not set</Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-5">
        {!projectIdConfigured ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
            WalletConnect is not configured in this environment. Injected
            wallets like MetaMask still work.
          </div>
        ) : null}

        {employeeQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading employee profile…</p>
        ) : employeeQuery.isError ? (
          <div className="rounded-lg border border-border px-3 py-4 text-sm text-muted-foreground">
            No employee record is linked to this login. If you were invited as a
            user only, ask HR to create an employee profile for your email so
            you can receive payroll.
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-border/70 bg-muted/20 p-4 text-sm">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Current payout address
              </p>
              {linkedWallet ? (
                <p className="mt-1 font-mono text-sm break-all">{linkedWallet}</p>
              ) : (
                <p className="mt-1 text-muted-foreground">
                  Not set. Connect a wallet and verify it below.
                </p>
              )}
              {employee ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Employee: {employee.firstName} {employee.lastName} ·{' '}
                  {employee.email}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ConnectButton
                chainStatus="icon"
                accountStatus="address"
                showBalance={false}
              />
              {isConnected && address ? (
                <span className="text-xs text-muted-foreground">
                  Connected {formatAddress(address)}
                  {connectedMatchesLinked ? ' (matches payout wallet)' : ''}
                </span>
              ) : null}
            </div>
          </>
        )}
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={
            busy ||
            !employee ||
            !isConnected ||
            !address ||
            connectedMatchesLinked
          }
          onClick={() => void linkWallet()}
        >
          <LinkIcon className="size-3.5" />
          {busy
            ? 'Working…'
            : connectedMatchesLinked
              ? 'Wallet already linked'
              : 'Verify & save payout wallet'}
        </Button>
        {linkedWallet ? (
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => {
              if (
                window.confirm(
                  'Remove the payout wallet from your employee record?',
                )
              ) {
                clearMutation.mutate();
              }
            }}
          >
            <UnplugIcon className="size-3.5" />
            Clear
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}
