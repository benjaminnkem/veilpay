'use client';

import {
  RainbowKitProvider,
  darkTheme,
  lightTheme,
} from '@rainbow-me/rainbowkit';
import { useTheme } from 'next-themes';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { WagmiProvider } from 'wagmi';

import { wagmiConfig } from '@/lib/web3/config';

import '@rainbow-me/rainbowkit/styles.css';

interface Web3ProviderProps {
  children: ReactNode;
}

export function Web3Provider({ children }: Web3ProviderProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <RainbowKitProvider
        theme={
          mounted && resolvedTheme === 'dark'
            ? darkTheme({
                accentColor: '#9ae63b',
                accentColorForeground: '#0f160c',
                borderRadius: 'medium',
              })
            : lightTheme({
                accentColor: '#6fbf1f',
                accentColorForeground: '#142016',
                borderRadius: 'medium',
              })
        }
        modalSize="compact"
        initialChain={wagmiConfig.chains[0]}
      >
        {children}
      </RainbowKitProvider>
    </WagmiProvider>
  );
}
