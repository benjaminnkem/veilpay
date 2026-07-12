'use client';

import { LandingFooter } from '@/features/landing/components/landing-footer';
import { LandingNav } from '@/features/landing/components/landing-nav';
import { SmoothScroll } from '@/features/landing/components/smooth-scroll';
import { CtaSection } from '@/features/landing/components/sections/cta-section';
import { FlowSection } from '@/features/landing/components/sections/flow-section';
import { HeroSection } from '@/features/landing/components/sections/hero-section';
import { MarqueeSection } from '@/features/landing/components/sections/marquee-section';
import { ProductBentoSection } from '@/features/landing/components/sections/product-bento-section';
import { SecuritySection } from '@/features/landing/components/sections/security-section';
import { WorkspaceSection } from '@/features/landing/components/sections/workspace-section';

export function LandingPage() {
  return (
    <SmoothScroll>
      <div className="min-h-screen bg-background text-foreground">
        <LandingNav />
        <main>
          <HeroSection />
          <MarqueeSection />
          <ProductBentoSection />
          <FlowSection />
          <SecuritySection />
          <WorkspaceSection />
          <CtaSection />
        </main>
        <LandingFooter />
      </div>
    </SmoothScroll>
  );
}
