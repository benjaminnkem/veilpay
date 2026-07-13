'use client';

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';
import { useRef } from 'react';

import { LANDING_WORKSPACE } from '@/features/landing/constants/content';

export function WorkspaceSection() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const trackX = useTransform(scrollYProgress, [0.1, 0.9], ['0%', '-28%']);

  const overview = LANDING_WORKSPACE[0];
  const approvals = LANDING_WORKSPACE[1];
  const audit = LANDING_WORKSPACE[2];

  return (
    <section
      id="workspace"
      ref={ref}
      className="scroll-mt-20 overflow-x-clip border-y border-white/8 py-24 lg:py-32"
    >
      <div className="mx-auto mb-12 w-full max-w-[1200px] px-4 sm:px-6 lg:mb-16">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl space-y-4">
            <p className="text-[11px] tracking-[0.22em] text-muted-foreground uppercase">
              Workspace
            </p>
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-balance sm:text-4xl lg:text-5xl">
              Dense where it matters.
              <span className="block text-muted-foreground">
                Quiet everywhere else.
              </span>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-7 text-muted-foreground">
            Horizontal story strip. Scroll the page and the panels drift. Built
            from live UI patterns so you do not need product screenshots yet.
          </p>
        </div>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-background to-transparent sm:w-16" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-background to-transparent sm:w-16" />
        <motion.div
          style={reduced ? undefined : { x: trackX }}
          className="flex w-max gap-4 px-4 sm:gap-5 sm:px-6"
        >
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="w-[min(84vw,420px)] shrink-0 space-y-4 sm:w-[480px]"
          >
            <div className="min-h-[260px] border border-white/10 bg-white/[0.02] p-5">
              <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                Overview
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {overview.stats?.map((stat) => (
                  <div
                    key={stat.label}
                    className="border border-white/8 bg-black/20 p-3"
                  >
                    <p className="text-[11px] text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="mt-1 text-xl font-medium tracking-tight">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-baseline justify-between gap-4 px-1">
              <p className="text-sm font-medium tracking-tight">
                {overview.title}
              </p>
              <p className="font-mono text-[11px] text-muted-foreground">01</p>
            </div>
          </motion.div>

          <motion.div
            initial={reduced ? false : { opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="w-[min(84vw,420px)] shrink-0 space-y-4 sm:w-[480px]"
          >
            <div className="min-h-[260px] border border-white/10 bg-white/[0.02] p-5">
              <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                Queue
              </p>
              <div className="mt-5 space-y-2">
                {approvals.items?.map((item) => (
                  <div
                    key={item.title}
                    className="flex items-center justify-between gap-3 border border-white/8 bg-black/20 px-3 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.meta}
                      </p>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-baseline justify-between gap-4 px-1">
              <p className="text-sm font-medium tracking-tight">
                {approvals.title}
              </p>
              <p className="font-mono text-[11px] text-muted-foreground">02</p>
            </div>
          </motion.div>

          <motion.div
            initial={reduced ? false : { opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="w-[min(84vw,420px)] shrink-0 space-y-4 sm:w-[480px]"
          >
            <div className="min-h-[260px] border border-white/10 bg-white/[0.02] p-5">
              <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                Events
              </p>
              <div className="mt-5 divide-y divide-white/6 border border-white/8">
                {audit.rows?.map((row) => (
                  <div
                    key={`${row.actor}-${row.action}`}
                    className="grid grid-cols-[1fr_auto] gap-3 px-3 py-3 text-sm sm:grid-cols-[0.9fr_1.2fr_auto]"
                  >
                    <span className="text-muted-foreground">{row.actor}</span>
                    <span className="hidden font-mono text-xs sm:block">
                      {row.action}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {row.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-baseline justify-between gap-4 px-1">
              <p className="text-sm font-medium tracking-tight">
                {audit.title}
              </p>
              <p className="font-mono text-[11px] text-muted-foreground">03</p>
            </div>
          </motion.div>

          <div className="w-[min(70vw,320px)] shrink-0 self-stretch border border-white/10 bg-white/[0.015] p-6">
            <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
              Policy
            </p>
            <p className="mt-4 text-lg font-medium tracking-tight">
              Roles, retention, and release rules
            </p>
            <ul className="mt-5 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="size-1 bg-primary" />
                Role templates for finance and HR
              </li>
              <li className="flex items-center gap-2">
                <span className="size-1 bg-primary" />
                Temporary grants with expiry
              </li>
              <li className="flex items-center gap-2">
                <span className="size-1 bg-primary" />
                Audit retention windows
              </li>
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
