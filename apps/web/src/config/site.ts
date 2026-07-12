export const siteConfig = {
  name: 'VeilPay',
  description:
    'Enterprise payroll platform for confidential payroll management with Nox.',
  url: process.env.NEXTAUTH_URL ?? 'http://localhost:3000',
  links: {
    docs: '#',
    support: 'mailto:support@veilpay.app',
  },
} as const;

export type SiteConfig = typeof siteConfig;
