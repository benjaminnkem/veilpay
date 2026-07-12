'use client';

import { ImageIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

interface ImagePlaceholderProps {
  title: string;
  searchHint: string;
  aspect?: 'video' | 'square' | 'portrait' | 'wide' | 'auto';
  className?: string;
}

const ASPECT: Record<NonNullable<ImagePlaceholderProps['aspect']>, string> = {
  video: 'aspect-video',
  square: 'aspect-square',
  portrait: 'aspect-[3/4]',
  wide: 'aspect-[21/9]',
  auto: 'h-full min-h-[220px]',
};

export function ImagePlaceholder({
  title,
  searchHint,
  aspect = 'video',
  className,
}: ImagePlaceholderProps) {
  return (
    <figure
      className={cn(
        'group relative flex w-full flex-col overflow-hidden border border-white/10 bg-[linear-gradient(145deg,rgba(99,102,241,0.08),rgba(15,16,22,0.9)_45%,rgba(24,24,32,0.95))]',
        ASPECT[aspect],
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.08)_1px,transparent_0)] [background-size:18px_18px]" />
      <div className="relative flex h-full flex-col justify-between gap-4 p-4 sm:p-5">
        <div className="flex items-center gap-1.5 text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
          <ImageIcon className="size-3.5" aria-hidden />
          Free stock image
        </div>
        <figcaption className="max-w-md space-y-1.5">
          <p className="text-sm font-medium tracking-tight text-foreground">
            {title}
          </p>
          <p className="text-xs leading-5 text-muted-foreground">{searchHint}</p>
        </figcaption>
      </div>
    </figure>
  );
}
