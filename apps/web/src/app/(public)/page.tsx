import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRightIcon,
  LockIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ROUTES } from '@/constants/routes';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: 'Confidential enterprise payroll',
  description: siteConfig.description,
};

const FEATURES = [
  {
    title: 'Confidential by default',
    description:
      'Run payroll with privacy-preserving rails powered by Nox so sensitive compensation stays protected.',
    icon: LockIcon,
  },
  {
    title: 'Enterprise controls',
    description:
      'Approvals, audit logs, and role-aware access built for finance, HR, and security teams.',
    icon: ShieldCheckIcon,
  },
  {
    title: 'Premium operator UX',
    description:
      'A calm, dense workspace inspired by modern fintech tools—fast, accessible, and production-ready.',
    icon: SparklesIcon,
  },
] as const;

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href={ROUTES.home}
          className="flex items-center gap-2 text-sm font-semibold tracking-tight"
        >
          <span className="flex size-7 items-center justify-center bg-primary text-xs font-bold text-primary-foreground">
            V
          </span>
          VeilPay
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            nativeButton={false}
            render={<Link href={ROUTES.login} />}
          >
            Sign in
          </Button>
          <Button nativeButton={false} render={<Link href={ROUTES.register} />}>
            Get started
          </Button>
        </div>
      </header>

      <main>
        <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-20 sm:px-6 lg:py-28">
          <div className="max-w-3xl space-y-6">
            <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
              Enterprise payroll
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Payroll that stays private without slowing your team down.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              VeilPay helps organizations manage confidential payroll with
              encrypted workflows, multi-step approvals, and complete audit
              trails—built for modern finance and people ops.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                nativeButton={false}
                render={<Link href={ROUTES.register} />}
              >
                Start free trial
                <ArrowRightIcon />
              </Button>
              <Button
                size="lg"
                variant="outline"
                nativeButton={false}
                render={<Link href={ROUTES.login} />}
              >
                View demo workspace
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {FEATURES.map((feature) => (
              <Card key={feature.title} className="border-border/60 bg-card/60">
                <CardHeader>
                  <feature.icon
                    className="mb-2 size-4 text-muted-foreground"
                    aria-hidden
                  />
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                  <CardDescription className="leading-6">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent />
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>© {new Date().getFullYear()} VeilPay</span>
          <span>Private payroll infrastructure for modern teams</span>
        </div>
      </footer>
    </div>
  );
}
