'use client';

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';
import { useRef, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface ParallaxTextProps {
  children: ReactNode;
  className?: string;
  offset?: number;
}

export function ParallaxText({
  children,
  className,
  offset = 80,
}: ParallaxTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [offset, -offset]);

  return (
    <div ref={ref} className={cn('overflow-hidden', className)}>
      <motion.div style={reduced ? undefined : { y }}>{children}</motion.div>
    </div>
  );
}
