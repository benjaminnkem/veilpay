'use client';

import dynamic from 'next/dynamic';

import { cn } from '@/lib/utils';

const HeroScene = dynamic(
  () => import('@/components/three/hero-scene').then((mod) => mod.HeroScene),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-full min-h-[320px] w-full animate-pulse bg-[radial-gradient(circle_at_50%_40%,rgba(99,102,241,0.14),transparent_55%)]"
        aria-hidden
      />
    ),
  },
);

interface HeroCanvasProps {
  className?: string;
}

export function HeroCanvas({ className }: HeroCanvasProps) {
  return <HeroScene className={cn(className)} />;
}
