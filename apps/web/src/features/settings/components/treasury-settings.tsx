'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2Icon,
  ExternalLinkIcon,
  LinkIcon,
  RefreshCwIcon,
  ShieldIcon,
  UnplugIcon,
  WalletIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SettingsSection } from '@/features/settings/components/settings-section';
import { TreasuryBalancesPanel } from '@/features/settings/components/treasury-balances-panel';
import { treasuryBalancesQueryKey } from '@/features/settings/hooks/use-treasury-balances';
import {
  getOrganization,
  updateOrganization,
} from '@/features/settings/services/updateProfile';
import {
  NETWORK_OPTIONS,
  getNetworkByChainId,
  getNetworkByKey,
  getWalletConnectProjectId,
  type NetworkOption,
} from '@/lib/web3/config';
import {
  fetchSafesForOwner,
  formatAddress,
  isValidSafeAddress,
  safeExplorerUrl,
} from '@/lib/web3/safe';
import { notify } from '@/lib/toast';
import { cn } from '@/lib/utils';

interface TreasurySettingsProps {
  /** First step number when embedded under Organization tab. */
  startStep?: number;
}

export function TreasurySettings({ startStep = 1 }: TreasurySettingsProps) {
  const treasuryStep = startStep;
  const noxStep = startStep + 1;
  const qc = useQueryClient();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const orgQuery = useQuery({
    queryKey: ['organization', 'me'],
    queryFn: getOrganization,
  });

  const linkedNetwork = useMemo(
    () =>
      getNetworkByKey(orgQuery.data?.network) ?? getNetworkByChainId(chainId),
    [orgQuery.data?.network, chainId],
  );

  // Local drafts overlay server values — avoids syncing server → state in an effect.
  const [networkDraft, setNetworkDraft] = useState<string | null>(null);
  const [selectedSafeDraft, setSelectedSafeDraft] = useState<string | null>(
    null,
  );
  const [manualSafeDraft, setManualSafeDraft] = useState<string | null>(null);
  const [cTokenDraft, setCTokenDraft] = useState<string | null>(null);
  const [executionModeDraft, setExecutionModeDraft] = useState<
    'blockchain' | 'nox' | null
  >(null);
  const [saving, setSaving] = useState(false);
  const [savingNox, setSavingNox] = useState(false);

  const selectedNetworkKey =
    networkDraft ??
    getNetworkByKey(orgQuery.data?.network)?.key ??
    'sepolia';
  const selectedSafe =
    selectedSafeDraft ?? orgQuery.data?.safeAddress ?? '';
  const manualSafe = manualSafeDraft ?? orgQuery.data?.safeAddress ?? '';
  const cTokenAddress =
    cTokenDraft ?? orgQuery.data?.confidentialTokenAddress ?? '';
  const executionMode: 'blockchain' | 'nox' =
    executionModeDraft ??
    (orgQuery.data?.executionProvider === 'nox' ? 'nox' : 'blockchain');

  const activeNetwork =
    NETWORK_OPTIONS.find((n) => n.key === selectedNetworkKey) ??
    NETWORK_OPTIONS[0];

  const walletOnCorrectChain = chainId === activeNetwork.id;

  const safesQuery = useQuery({
    queryKey: ['safe-owners', address, activeNetwork.key],
    queryFn: () => fetchSafesForOwner(address!, activeNetwork),
    enabled: Boolean(isConnected && address && walletOnCorrectChain),
    staleTime: 30_000,
    retry: 1,
  });
  const projectIdConfigured = Boolean(getWalletConnectProjectId());

  const candidateSafe = selectedSafe || manualSafe.trim();

  async function saveTreasury(safeAddress: string, network: NetworkOption) {
    if (!isValidSafeAddress(safeAddress)) {
      notify.error('Enter a valid Ethereum address for the Safe');
      return;
    }

    setSaving(true);
    try {
      await updateOrganization({
        safeAddress,
        network: network.key,
        executionProvider: 'blockchain',
      });
      await qc.invalidateQueries({ queryKey: ['organization', 'me'] });
      await qc.invalidateQueries({ queryKey: ['dashboard'] });
      await qc.invalidateQueries({
        queryKey: treasuryBalancesQueryKey(safeAddress, network.key),
      });
      setSelectedSafeDraft(safeAddress);
      setManualSafeDraft(safeAddress);
      setNetworkDraft(network.key);
      notify.success(
        'Treasury linked',
        `${formatAddress(safeAddress)} on ${network.name}`,
      );
    } catch (error) {
      notify.error(error);
    } finally {
      setSaving(false);
    }
  }

  async function clearTreasury() {
    setSaving(true);
    try {
      await updateOrganization({
        safeAddress: null,
        network: null,
        executionProvider: 'mock',
      });
      await qc.invalidateQueries({ queryKey: ['organization', 'me'] });
      await qc.invalidateQueries({ queryKey: ['dashboard'] });
      await qc.invalidateQueries({ queryKey: ['treasury-balances'] });
      setSelectedSafeDraft('');
      setManualSafeDraft('');
      notify.success('Treasury disconnected');
    } catch (error) {
      notify.error(error);
    } finally {
      setSaving(false);
    }
  }

  async function saveNoxSettings() {
    const token = cTokenAddress.trim();
    if (token && !isValidSafeAddress(token)) {
      notify.error('Enter a valid confidential token contract address');
      return;
    }
    setSavingNox(true);
    try {
      await updateOrganization({
        confidentialTokenAddress: token || null,
        network: selectedNetworkKey || 'sepolia',
        executionProvider: executionMode,
      });
      await qc.invalidateQueries({ queryKey: ['organization', 'me'] });
      await qc.invalidateQueries({ queryKey: ['dashboard'] });
      notify.success(
        executionMode === 'nox'
          ? 'Nox confidential payroll enabled'
          : 'Execution settings saved',
        token
          ? `cToken ${formatAddress(token)} on ${selectedNetworkKey}`
          : 'No confidential token address set',
      );
    } catch (error) {
      notify.error(error);
    } finally {
      setSavingNox(false);
    }
  }

  const linkedSafe = orgQuery.data?.safeAddress;
  const linkedCToken = orgQuery.data?.confidentialTokenAddress;

  return (
    <>
      <SettingsSection
        step={treasuryStep}
        title="Treasury"
        description="Connect a wallet that owns your Safe, pick the multisig, and save it as this organization’s treasury."
        action={
          linkedSafe ? (
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2Icon className="size-3" />
              Linked
            </Badge>
          ) : (
            <Badge variant="outline">Not linked</Badge>
          )
        }
      >
        <Card className="border-border/60 shadow-none">
          <CardHeader className="flex-row items-center gap-2 space-y-0 pb-2">
            <ShieldIcon className="size-4 text-primary" />
            <CardTitle className="text-sm font-medium">Safe treasury</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {!projectIdConfigured ? (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
                WalletConnect is not configured in this environment. You can
                still paste a Safe address manually below, or use an injected
                wallet such as MetaMask.
              </div>
            ) : null}

            {linkedSafe ? (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      Connected Safe
                    </p>
                    <p className="font-mono text-sm break-all">{linkedSafe}</p>
                    <p className="text-sm text-muted-foreground">
                      Network:{' '}
                      <span className="font-medium text-foreground">
                        {linkedNetwork?.name ??
                          orgQuery.data?.network ??
                          'Unknown'}
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {linkedNetwork ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        nativeButton={false}
                        render={
                          <a
                            href={safeExplorerUrl(linkedNetwork, linkedSafe)}
                            target="_blank"
                            rel="noreferrer"
                          />
                        }
                      >
                        <ExternalLinkIcon className="size-3.5" />
                        Explorer
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void clearTreasury()}
                      disabled={saving}
                    >
                      <UnplugIcon className="size-3.5" />
                      Disconnect
                    </Button>
                  </div>
                </div>
                <div className="mt-4">
                  <TreasuryBalancesPanel
                    safeAddress={linkedSafe}
                    network={orgQuery.data?.network}
                  />
                </div>
              </div>
            ) : null}

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="treasury-network">Network</Label>
                <Select
                  value={selectedNetworkKey}
                  onValueChange={(value) => {
                    if (value) {
                      setNetworkDraft(value);
                      setSelectedSafeDraft('');
                      setManualSafeDraft('');
                    }
                  }}
                >
                  <SelectTrigger id="treasury-network" className="w-full">
                    <SelectValue placeholder="Select network" />
                  </SelectTrigger>
                  <SelectContent>
                    {NETWORK_OPTIONS.map((network) => (
                      <SelectItem key={network.key} value={network.key}>
                        {network.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Use Ethereum Sepolia for test ETH and Circle test USDC.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Owner wallet</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <ConnectButton
                    chainStatus="icon"
                    accountStatus="address"
                    showBalance={false}
                  />
                  {isConnected && !walletOnCorrectChain ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={isSwitching || !switchChain}
                      onClick={() =>
                        switchChain?.({ chainId: activeNetwork.id })
                      }
                    >
                      Switch to {activeNetwork.name}
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="space-y-3 border-t border-border/60 pt-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Label>Safes owned by connected wallet</Label>
                  <p className="text-xs text-muted-foreground">
                    Loaded from Safe Transaction Service for this network.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={!isConnected || safesQuery.isFetching}
                  onClick={() => void safesQuery.refetch()}
                >
                  <RefreshCwIcon
                    className={cn(
                      'size-3.5',
                      safesQuery.isFetching && 'animate-spin',
                    )}
                  />
                  Refresh
                </Button>
              </div>

              {!isConnected ? (
                <div className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-6 text-sm text-muted-foreground">
                  <WalletIcon className="size-4 shrink-0" />
                  Connect a wallet that is an owner of your Safe to list
                  treasuries.
                </div>
              ) : !walletOnCorrectChain ? (
                <div className="rounded-lg border border-border px-3 py-4 text-sm text-muted-foreground">
                  Switch your wallet to <strong>{activeNetwork.name}</strong> to
                  load Safes on that network.
                </div>
              ) : safesQuery.isLoading ? (
                <div className="rounded-lg border border-border px-3 py-4 text-sm text-muted-foreground">
                  Loading Safes…
                </div>
              ) : safesQuery.isError ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-4 text-sm text-destructive">
                  {(safesQuery.error as Error)?.message ||
                    'Could not load Safes for this owner.'}
                </div>
              ) : (safesQuery.data?.length ?? 0) === 0 ? (
                <div className="rounded-lg border border-border px-3 py-4 text-sm text-muted-foreground">
                  No Safes found for{' '}
                  <span className="font-mono">
                    {address ? formatAddress(address) : 'this wallet'}
                  </span>{' '}
                  on {activeNetwork.name}. Create one at app.safe.global or paste
                  the address manually.
                </div>
              ) : (
                <div className="grid gap-2">
                  {safesQuery.data!.map((safe) => {
                    const active =
                      selectedSafe.toLowerCase() === safe.toLowerCase();
                    return (
                      <button
                        key={safe}
                        type="button"
                        onClick={() => {
                          setSelectedSafeDraft(safe);
                          setManualSafeDraft(safe);
                        }}
                        className={cn(
                          'flex items-center justify-between gap-3 rounded-lg border px-3 py-3 text-left transition-colors',
                          active
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:bg-muted/40',
                        )}
                      >
                        <div className="min-w-0">
                          <p className="font-mono text-sm break-all">{safe}</p>
                          <p className="text-xs text-muted-foreground">
                            {activeNetwork.name}
                          </p>
                        </div>
                        {active ? (
                          <CheckCircle2Icon className="size-4 shrink-0 text-primary" />
                        ) : (
                          <LinkIcon className="size-4 shrink-0 text-muted-foreground" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2 border-t border-border/60 pt-5">
              <Label htmlFor="manual-safe">Or paste Safe address</Label>
              <Input
                id="manual-safe"
                placeholder="0x…"
                value={manualSafe}
                onChange={(e) => {
                  setManualSafeDraft(e.target.value.trim());
                  setSelectedSafeDraft('');
                }}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Must be a valid Safe contract address on the selected network.
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={saving || !candidateSafe}
              onClick={() => void saveTreasury(candidateSafe, activeNetwork)}
            >
              {saving ? 'Saving…' : 'Save treasury'}
            </Button>
            {candidateSafe && isValidSafeAddress(candidateSafe) ? (
              <Button
                type="button"
                variant="outline"
                nativeButton={false}
                render={
                  <a
                    href={safeExplorerUrl(activeNetwork, candidateSafe)}
                    target="_blank"
                    rel="noreferrer"
                  />
                }
              >
                <ExternalLinkIcon className="size-3.5" />
                View on explorer
              </Button>
            ) : null}
          </CardFooter>
        </Card>
      </SettingsSection>

      <SettingsSection
        step={noxStep}
        title="Nox confidential payroll"
        description="Settle payroll as confidential on-chain transfers from your linked Safe. Amounts stay encrypted end to end."
        action={
          orgQuery.data?.executionProvider === 'nox' && linkedCToken ? (
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2Icon className="size-3" />
              Nox active
            </Badge>
          ) : (
            <Badge variant="outline">Public USDC / mock</Badge>
          )
        }
      >
        <Card className="border-border/60 shadow-none">
          <CardHeader className="flex-row items-center gap-2 space-y-0 pb-2">
            <ShieldIcon className="size-4 text-primary" />
            <CardTitle className="text-sm font-medium">
              Execution settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="execution-mode">Execution mode</Label>
              <Select
                value={executionMode}
                onValueChange={(value) => {
                  if (value === 'nox' || value === 'blockchain') {
                    setExecutionModeDraft(value);
                  }
                }}
              >
                <SelectTrigger id="execution-mode" className="w-full">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blockchain">
                    Public Safe multi-send (USDC)
                  </SelectItem>
                  <SelectItem value="nox">
                    Confidential Nox (amounts hidden)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ctoken-address">Confidential token address</Label>
              <Input
                id="ctoken-address"
                placeholder="0x…"
                value={cTokenAddress}
                onChange={(e) => setCTokenDraft(e.target.value.trim())}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Contract used for encrypted payroll balances on the selected
                network. Ensure the Safe holds enough USDC and a little ETH for
                execution fees.
              </p>
            </div>
            {linkedCToken ? (
              <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                <p className="text-xs text-muted-foreground">Saved token</p>
                <p className="font-mono text-xs break-all">{linkedCToken}</p>
              </div>
            ) : null}
          </CardContent>
          <CardFooter>
            <Button
              type="button"
              disabled={savingNox}
              onClick={() => void saveNoxSettings()}
            >
              {savingNox ? 'Saving…' : 'Save execution settings'}
            </Button>
          </CardFooter>
        </Card>
      </SettingsSection>
    </>
  );
}
