'use client';

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';
import { useRef } from 'react';

import { LANDING_FLOW } from '@/features/landing/constants/content';

export function FlowSection() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });
  const progressWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  return (
    <section
      id="flow"
      ref={ref}
      className="relative scroll-mt-20 border-y border-white/8"
    >
      <div className="mx-auto flex w-full max-w-[1200px] flex-col lg:flex-row lg:items-start">
        <aside className="border-b border-white/8 px-4 py-16 sm:px-6 lg:sticky lg:top-16 lg:h-[calc(100svh-4rem)] lg:w-[min(38%,420px)] lg:shrink-0 lg:border-r lg:border-b-0 lg:py-24">
          <div className="flex h-full flex-col justify-between gap-12">
            <div className="space-y-5">
              <p className="text-[11px] tracking-[0.22em] text-muted-foreground uppercase">
                Flow
              </p>
              <h2 className="max-w-sm text-3xl font-semibold tracking-[-0.04em] text-balance sm:text-4xl">
                Three moves from roster to release.
              </h2>
              <p className="max-w-sm text-sm leading-7 text-muted-foreground">
                Scroll the sequence. The left rail stays put while the story
                unfolds. Less brochure, more product narrative.
              </p>
            </div>

            <div className="space-y-4">
              <div className="h-px w-full bg-white/10">
                <motion.div
                  className="h-px bg-primary"
                  style={reduced ? { width: '100%' } : { width: progressWidth }}
                />
              </div>
              <p className="text-xs tracking-[0.16em] text-muted-foreground uppercase">
                Scroll progress
              </p>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1 px-4 py-10 sm:px-6 lg:py-16">
          {LANDING_FLOW.map((step, index) => (
            <motion.article
              key={step.id}
              initial={reduced ? false : { opacity: 0, y: 48 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="grid min-h-[70vh] content-center gap-8 border-b border-white/8 py-16 last:border-b-0 lg:min-h-[80vh]"
            >
              <div className="flex items-start justify-between gap-6">
                <div className="space-y-4">
                  <p className="font-mono text-xs tracking-[0.22em] text-primary">
                    {step.id}
                  </p>
                  <h3 className="text-2xl font-medium tracking-tight sm:text-3xl">
                    {step.title}
                  </h3>
                  <p className="max-w-md text-sm leading-7 text-muted-foreground">
                    {step.body}
                  </p>
                  <ul className="space-y-2 pt-2 text-sm text-muted-foreground">
                    {step.points.map((point) => (
                      <li key={point} className="flex items-center gap-2">
                        <span className="size-1 shrink-0 bg-primary" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
                <span className="hidden text-6xl font-semibold tracking-tighter text-white/5 sm:block">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>

              <div className="border border-white/8 bg-white/[0.02]">
                <div className="border-b border-white/8 px-4 py-3">
                  <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
                    {step.panel.label}
                  </p>
                </div>
                <div className="divide-y divide-white/6">
                  {step.panel.rows.map((row) => (
                    <div
                      key={row.role}
                      className="flex items-center justify-between gap-4 px-4 py-3.5 text-sm"
                    >
                      <span className="text-muted-foreground">{row.role}</span>
                      <span className="font-medium tracking-tight">
                        {row.access}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
