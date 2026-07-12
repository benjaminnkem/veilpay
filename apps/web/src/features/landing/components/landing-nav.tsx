'use client';

import { motion, useMotionValueEvent, useScroll } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { LANDING_NAV } from '@/features/landing/constants/content';
import { cn } from '@/lib/utils';

export function LandingNav() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, 'change', (value) => {
    setScrolled(value > 12);
  });

  return (
    <motion.header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-[background,border-color,backdrop-filter] duration-300',
        scrolled
          ? 'border-b border-white/8 bg-[#0b0c10]/72 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-4 sm:px-6">
        <Link
          href={ROUTES.home}
          className="flex items-center gap-2 text-sm font-semibold tracking-tight"
        >
          <span className="flex size-7 items-center justify-center bg-primary text-xs font-bold text-primary-foreground">
            V
          </span>
          VeilPay
        </Link>

        <nav
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 md:flex"
          aria-label="Landing"
        >
          {LANDING_NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

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
      </div>
    </motion.header>
  );
}
