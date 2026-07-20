import type { ReactNode } from 'react';

import { AppHeader } from '@/components/layout/app-header';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { RoleRouteGuard } from '@/components/layout/role-route-guard';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <SidebarProvider className="bg-muted/20 text-foreground">
      <AppSidebar />
      <SidebarInset className="min-w-0 bg-transparent">
        <AppHeader />
        <div className="flex flex-1 flex-col">
          <div className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <RoleRouteGuard>{children}</RoleRouteGuard>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
