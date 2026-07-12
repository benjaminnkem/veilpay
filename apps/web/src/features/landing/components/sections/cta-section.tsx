'use client';

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';
import { ArrowRightIcon } from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

export function CtaSection() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end end'],
  });
  const scale = useTransform(scrollYProgress, [0, 1], [0.92, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.35], [0.4, 1]);

  return (
    <section ref={ref} className="px-4 py-24 sm:px-6 lg:py-32">
      <motion.div
        style={reduced ? undefined : { scale, opacity }}
        className="relative mx-auto max-w-[1200px] overflow-hidden border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.22),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] px-6 py-16 sm:px-12 sm:py-20"
      >
        <div className="pointer-events-none absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:48px_48px] opacity-40" />
        <div className="relative max-w-3xl space-y-8">
          <p className="text-[11px] tracking-[0.22em] text-muted-foreground uppercase">
            Ready when you are
          </p>
          <h2 className="text-3xl font-semibold tracking-[-0.045em] text-balance sm:text-5xl lg:text-6xl">
            Ship confidential payroll without rebuilding your company stack.
          </h2>
          <p className="max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
            Create a workspace, invite reviewers, and run your first encrypted
            cycle with full audit coverage.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              size="lg"
              nativeButton={false}
              render={<Link href={ROUTES.register} />}
            >
              Create account
              <ArrowRightIcon />
            </Button>
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={<Link href={ROUTES.login} />}
            >
              Sign in to demo
            </Button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
