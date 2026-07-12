'use client';

import { motion, useReducedMotion } from 'framer-motion';

import { LANDING_MARQUEE } from '@/features/landing/constants/content';

export function MarqueeSection() {
  const reduced = useReducedMotion();
  const items = [...LANDING_MARQUEE, ...LANDING_MARQUEE];

  return (
    <section
      aria-label="Capabilities"
      className="border-y border-white/8 bg-white/[0.015] py-5 overflow-hidden"
    >
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent sm:w-28" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent sm:w-28" />
        <motion.div
          className="flex w-max gap-10 whitespace-nowrap px-4"
          animate={reduced ? undefined : { x: ['0%', '-50%'] }}
          transition={
            reduced
              ? undefined
              : { duration: 28, ease: 'linear', repeat: Infinity }
          }
        >
          {items.map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="inline-flex items-center gap-3 text-sm text-muted-foreground"
            >
              <span className="size-1 rounded-full bg-primary/80" />
              {item}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
