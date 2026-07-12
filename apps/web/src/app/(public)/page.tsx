import type { Metadata } from 'next';

import { siteConfig } from '@/config/site';
import { LandingPage } from '@/features/landing/components/landing-page';

export const metadata: Metadata = {
  title: 'Confidential enterprise payroll',
  description: siteConfig.description,
};

export default function PublicHomePage() {
  return <LandingPage />;
}
