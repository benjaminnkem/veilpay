'use client';

import type { Session } from 'next-auth';
import type { ReactNode } from 'react';

import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/providers/AuthProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { Web3Provider } from '@/providers/Web3Provider';

interface AppProvidersProps {
  children: ReactNode;
  session?: Session | null;
}

export function AppProviders({ children, session }: AppProvidersProps) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <AuthProvider session={session}>
          <Web3Provider>
            <TooltipProvider delay={200}>
              {children}
              <Toaster position="top-right" richColors closeButton />
            </TooltipProvider>
          </Web3Provider>
        </AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
