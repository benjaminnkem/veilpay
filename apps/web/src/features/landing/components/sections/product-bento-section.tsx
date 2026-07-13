'use client';

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';
import { useRef } from 'react';

import { LANDING_BENTO } from '@/features/landing/constants/content';

const VEILED_ROWS = [
  { name: 'Engineering', count: '42 people', amount: '••••••' },
  { name: 'Finance', count: '11 people', amount: '••••••' },
  { name: 'People', count: '8 people', amount: '••••••' },
  { name: 'Operations', count: '19 people', amount: '••••••' },
] as const;

const APPROVALS = [
  { title: 'March payroll', status: 'Waiting', tone: 'pending' },
  { title: 'Band update · L5', status: 'In review', tone: 'review' },
  { title: 'Export grant', status: 'Approved', tone: 'done' },
] as const;

export function ProductBentoSection() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const headingX = useTransform(scrollYProgress, [0, 1], [-40, 40]);

  return (
    <section
      id="product"
      ref={ref}
      className="scroll-mt-20 px-4 py-24 sm:px-6 lg:py-32"
    >
      <div className="mx-auto w-full max-w-[1200px]">
        <div className="mb-12 flex flex-col gap-6 lg:mb-16 lg:flex-row lg:items-end lg:justify-between">
          <motion.div
            style={reduced ? undefined : { x: headingX }}
            className="max-w-2xl space-y-4"
          >
            <p className="text-[11px] tracking-[0.22em] text-muted-foreground uppercase">
              Product
            </p>
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-balance sm:text-4xl lg:text-5xl">
              Not another HR suite.
              <span className="block text-muted-foreground">
                A privacy surface for money.
              </span>
            </h2>
          </motion.div>
          <p className="max-w-sm text-sm leading-7 text-muted-foreground lg:text-right">
            Sections that actually do different jobs: overview, control, and
            evidence. Not six identical cards in a grid.
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-12 lg:grid-rows-[auto_auto]">
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col justify-between border border-white/8 bg-white/[0.02] p-6 sm:p-8 lg:col-span-7 lg:row-span-2 lg:min-h-[420px]"
          >
            <div className="space-y-4">
              <p className="text-[11px] tracking-[0.18em] text-primary/90 uppercase">
                Core idea
              </p>
              <h3 className="max-w-md text-2xl font-medium tracking-tight sm:text-3xl">
                {LANDING_BENTO.lead.title}
              </h3>
              <p className="max-w-md text-sm leading-7 text-muted-foreground">
                {LANDING_BENTO.lead.body}
              </p>
            </div>

            <div className="mt-10 border border-white/8 bg-black/20">
              <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
                <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                  Payroll draft
                </p>
                <span className="border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] tracking-wide text-primary uppercase">
                  Confidential
                </span>
              </div>
              <div className="divide-y divide-white/6">
                {VEILED_ROWS.map((row) => (
                  <div
                    key={row.name}
                    className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-4 py-3 text-sm"
                  >
                    <span className="font-medium">{row.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {row.count}
                    </span>
                    <span className="font-mono text-xs tracking-[0.2em] text-muted-foreground">
                      {row.amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={reduced ? false : { opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{
              duration: 0.7,
              delay: 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="border border-white/8 bg-white/[0.02] p-6 sm:p-7 lg:col-span-5"
          >
            <h3 className="text-lg font-medium tracking-tight">
              {LANDING_BENTO.tiles[0].title}
            </h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {LANDING_BENTO.tiles[0].body}
            </p>
            <div className="mt-6 space-y-2">
              {APPROVALS.map((item) => (
                <div
                  key={item.title}
                  className="flex items-center justify-between gap-3 border border-white/8 bg-black/15 px-3 py-2.5"
                >
                  <p className="text-sm">{item.title}</p>
                  <span
                    className={
                      item.tone === 'done'
                        ? 'text-[11px] text-emerald-400'
                        : item.tone === 'review'
                          ? 'text-[11px] text-amber-300'
                          : 'text-[11px] text-muted-foreground'
                    }
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={reduced ? false : { opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10%' }}
            transition={{
              duration: 0.7,
              delay: 0.14,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="border border-white/8 bg-gradient-to-br from-primary/10 via-transparent to-transparent p-6 sm:p-7 lg:col-span-5"
          >
            <h3 className="text-lg font-medium tracking-tight">
              {LANDING_BENTO.tiles[1].title}
            </h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {LANDING_BENTO.tiles[1].body}
            </p>
            <ul className="mt-6 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="size-1 bg-primary" />
                Actor · action · resource
              </li>
              <li className="flex items-center gap-2">
                <span className="size-1 bg-primary" />
                Exportable for compliance
              </li>
              <li className="flex items-center gap-2">
                <span className="size-1 bg-primary" />
                No silent privilege changes
              </li>
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
