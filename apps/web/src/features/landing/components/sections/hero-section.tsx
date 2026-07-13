'use client';

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';
import { ArrowDownRightIcon, ArrowRightIcon } from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';

import { HeroCanvas } from '@/components/three/hero-canvas';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';

export function HeroSection() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  const copyY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);
  const sceneScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const sceneY = useTransform(scrollYProgress, [0, 1], [0, -60]);

  return (
    <section
      ref={ref}
      className="relative min-h-[100svh] overflow-hidden pt-16"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(99,102,241,0.18),transparent_42%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_90%_30%,rgba(167,139,250,0.1),transparent_35%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="relative mx-auto grid min-h-[calc(100svh-4rem)] w-full max-w-[1200px] items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-4 lg:py-0">
        <motion.div
          style={reduced ? undefined : { y: copyY, opacity: copyOpacity }}
          className="relative z-10 max-w-xl space-y-8"
        >
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6"
          >
            <p className="inline-flex items-center gap-2 border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
              Private payroll infrastructure
            </p>
            <h1 className="text-[2.6rem] leading-[0.98] font-semibold tracking-[-0.04em] text-balance sm:text-5xl lg:text-[3.75rem]">
              Payroll that
              <span className="block text-muted-foreground">stays veiled.</span>
            </h1>
            <p className="max-w-md text-base leading-7 text-muted-foreground sm:text-lg">
              VeilPay is the operating system for confidential compensation.
              Encrypted runs, multi-party approvals, and audit trails for teams
              that treat numbers as infrastructure.
            </p>
          </motion.div>

          <motion.div
            initial={reduced ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.7,
              delay: 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="flex flex-wrap items-center gap-3"
          >
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
              Open demo
            </Button>
          </motion.div>

          <motion.a
            href="#product"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.6 }}
            className="inline-flex items-center gap-2 text-xs tracking-[0.16em] text-muted-foreground uppercase transition-colors hover:text-foreground"
          >
            Explore the product
            <ArrowDownRightIcon className="size-3.5" />
          </motion.a>
        </motion.div>

        <motion.div
          style={reduced ? undefined : { scale: sceneScale, y: sceneY }}
          className="relative h-[48vh] min-h-[320px] w-full lg:h-[72vh] lg:min-h-[520px]"
        >
          <div className="absolute -inset-6 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.16),transparent_60%)] blur-2xl" />
          <div className="absolute inset-0 overflow-hidden border border-white/8 bg-[#0a0b10]/40">
            <HeroCanvas className="h-full w-full" />
          </div>
          <div className="pointer-events-none absolute top-4 right-4 border border-white/10 bg-black/40 px-3 py-2 text-[10px] tracking-[0.16em] text-muted-foreground uppercase backdrop-blur-md">
            Interactive shield
          </div>
          <div className="pointer-events-none absolute bottom-4 left-4 max-w-[12rem] border border-white/10 bg-black/40 px-3 py-2 text-[11px] leading-5 text-muted-foreground backdrop-blur-md">
            Move the cursor to orbit. Built for privacy-first storytelling.
          </div>
        </motion.div>
      </div>
    </section>
  );
}
