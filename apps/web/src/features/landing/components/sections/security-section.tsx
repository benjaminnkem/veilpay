'use client';

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';
import { useRef } from 'react';

import { ImagePlaceholder } from '@/features/landing/components/ui/image-placeholder';
import {
  LANDING_SECURITY_LINES,
  LANDING_STOCK_IMAGE,
} from '@/features/landing/constants/content';

export function SecuritySection() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const bigTypeY = useTransform(scrollYProgress, [0, 1], [80, -80]);
  const bigTypeOpacity = useTransform(
    scrollYProgress,
    [0, 0.25, 0.75, 1],
    [0.15, 0.35, 0.35, 0.1],
  );

  return (
    <section
      id="security"
      ref={ref}
      className="relative scroll-mt-20 overflow-hidden py-24 lg:py-32"
    >
      <motion.p
        aria-hidden
        style={
          reduced ? { opacity: 0.12 } : { y: bigTypeY, opacity: bigTypeOpacity }
        }
        className="pointer-events-none absolute top-1/2 left-1/2 w-[140%] -translate-x-1/2 -translate-y-1/2 text-center text-[18vw] leading-none font-semibold tracking-[-0.06em] text-white select-none"
      >
        VEIL
      </motion.p>

      <div className="relative mx-auto grid w-full max-w-[1200px] gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <div className="space-y-10">
          <div className="space-y-4">
            <p className="text-[11px] tracking-[0.22em] text-muted-foreground uppercase">
              Security
            </p>
            <h2 className="max-w-lg text-3xl font-semibold tracking-[-0.04em] text-balance sm:text-4xl lg:text-5xl">
              Confidentiality is the product surface, not a checkbox.
            </h2>
          </div>

          <div className="space-y-0 border-t border-white/10">
            {LANDING_SECURITY_LINES.map((line, index) => (
              <motion.div
                key={line.title}
                initial={reduced ? false : { opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{
                  duration: 0.55,
                  delay: index * 0.06,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="grid gap-3 border-b border-white/10 py-6 sm:grid-cols-[120px_1fr] sm:gap-8"
              >
                <p className="text-[11px] tracking-[0.18em] text-primary uppercase">
                  {line.kicker}
                </p>
                <div>
                  <h3 className="text-lg font-medium tracking-tight">
                    {line.title}
                  </h3>
                  <p className="mt-2 max-w-md text-sm leading-7 text-muted-foreground">
                    {line.body}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={reduced ? false : { opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative space-y-4"
        >
          <div className="absolute -inset-8 -z-10 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.18),transparent_65%)] blur-2xl" />
          <ImagePlaceholder
            aspect="portrait"
            width={220}
            height={440}
            src={LANDING_STOCK_IMAGE.src}
            className="min-h-[360px] lg:min-h-[480px]"
            title={LANDING_STOCK_IMAGE.title}
            searchHint={LANDING_STOCK_IMAGE.search}
          />
          {/* <p className="text-xs leading-5 text-muted-foreground">
            {LANDING_STOCK_IMAGE.why}
          </p> */}
        </motion.div>
      </div>
    </section>
  );
}
