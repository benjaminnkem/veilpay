import Link from 'next/link';

import { ROUTES } from '@/constants/routes';

export function LandingFooter() {
  return (
    <footer className="border-t border-white/8">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-8 px-4 py-12 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center bg-primary text-xs font-bold text-primary-foreground">
              V
            </span>
            <span className="text-sm font-semibold tracking-tight">
              VeilPay
            </span>
          </div>
          <p className="max-w-xs text-sm leading-6 text-muted-foreground">
            Private payroll infrastructure for modern finance and people ops.
          </p>
        </div>

        <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-muted-foreground">
          <a href="#product" className="hover:text-foreground">
            Product
          </a>
          <a href="#flow" className="hover:text-foreground">
            Flow
          </a>
          <a href="#security" className="hover:text-foreground">
            Security
          </a>
          <Link href={ROUTES.login} className="hover:text-foreground">
            Sign in
          </Link>
          <Link href={ROUTES.register} className="hover:text-foreground">
            Register
          </Link>
        </div>

        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} VeilPay
        </p>
      </div>
    </footer>
  );
}
