export const LANDING_NAV = [
  { label: 'Product', href: '#product' },
  { label: 'Flow', href: '#flow' },
  { label: 'Security', href: '#security' },
  { label: 'Workspace', href: '#workspace' },
] as const;

export const LANDING_MARQUEE = [
  'Encrypted payroll runs',
  'Role-aware access',
  'Multi-party approvals',
  'Immutable audit trails',
  'Nox privacy rails',
  'Finance-ready controls',
  'People ops workflows',
  'Least-privilege design',
] as const;

export const LANDING_BENTO = {
  lead: {
    title: 'Compensation stays veiled by default',
    body: 'Sensitive amounts never spill into shared dashboards. Only the roles you authorize can pierce the veil. Everyone else sees structure, never numbers.',
  },
  tiles: [
    {
      title: 'Approvals that feel operational',
      body: 'Route payroll, promotions, and access grants through multi-party review without losing speed.',
    },
    {
      title: 'Audit without the noise',
      body: 'Every privileged action leaves a durable trail with actor, resource, and context.',
    },
  ],
} as const;

export const LANDING_FLOW = [
  {
    id: '01',
    title: 'Model the org',
    body: 'Import people, map departments, and assign who can view, prepare, or approve confidential work.',
    points: [
      'Department and role mapping',
      'Least-privilege defaults',
      'Reviewer assignment per run',
    ],
    panel: {
      label: 'Access matrix',
      rows: [
        { role: 'Finance admin', access: 'Full run control' },
        { role: 'People ops', access: 'Structure only' },
        { role: 'Manager', access: 'Team metadata' },
        { role: 'Auditor', access: 'Read-only trail' },
      ],
    },
  },
  {
    id: '02',
    title: 'Assemble a private run',
    body: 'Build encrypted payroll cycles with protected fields. Operators work against status and policy, not raw compensation walls.',
    points: [
      'Period and currency setup',
      'Veiled compensation fields',
      'Policy checks before submit',
    ],
    panel: {
      label: 'Run draft',
      rows: [
        { role: 'Period', access: 'March 2026' },
        { role: 'Employees', access: '128 included' },
        { role: 'Amounts', access: 'Encrypted' },
        { role: 'Status', access: 'Ready for review' },
      ],
    },
  },
  {
    id: '03',
    title: 'Approve, release, prove it',
    body: 'Ship through controlled gates. Reviewers act with confidence, and security keeps an immutable record of what happened.',
    points: [
      'Multi-party approval chain',
      'Release with confirmation',
      'Exportable audit history',
    ],
    panel: {
      label: 'Release checklist',
      rows: [
        { role: 'Controller', access: 'Approved' },
        { role: 'CFO', access: 'Approved' },
        { role: 'Security', access: 'Acknowledged' },
        { role: 'Audit log', access: 'Written' },
      ],
    },
  },
] as const;

export const LANDING_SECURITY_LINES = [
  {
    kicker: 'Visibility',
    title: 'Show structure. Hide amounts.',
    body: 'Finance sees what it needs. Managers see what they should. Everyone else sees nothing sensitive.',
  },
  {
    kicker: 'Identity',
    title: 'Access follows role, not curiosity.',
    body: 'Privileged paths are explicit. Temporary grants expire. Every elevation is intentional.',
  },
  {
    kicker: 'Proof',
    title: 'If it mattered, it is logged.',
    body: 'Approvals, exports, and configuration changes land in a durable trail for compliance.',
  },
] as const;

export const LANDING_WORKSPACE = [
  {
    title: 'Command overview',
    stats: [
      { label: 'Active employees', value: '128' },
      { label: 'Pending approvals', value: '3' },
      { label: 'Next run', value: 'Mar 28' },
      { label: 'Confidential mode', value: 'On' },
    ],
  },
  {
    title: 'Approvals queue',
    items: [
      { title: 'March payroll release', meta: 'Sam Okoye', status: 'Pending' },
      {
        title: 'Compensation band update',
        meta: 'Riley Chen',
        status: 'In review',
      },
      { title: 'Audit export access', meta: 'Jordan Lee', status: 'Approved' },
    ],
  },
  {
    title: 'Audit inspector',
    rows: [
      {
        actor: 'Alex Morgan',
        action: 'payroll.run.viewed',
        time: '12:04',
      },
      {
        actor: 'Sam Okoye',
        action: 'approval.requested',
        time: '10:00',
      },
      {
        actor: 'Jordan Lee',
        action: 'employee.updated',
        time: '16:42',
      },
    ],
  },
] as const;

export const LANDING_STOCK_IMAGE = {
  title: 'Stock photo slot',
  search:
    'Unsplash / Pexels search: "dark abstract architecture glass" or "indigo light geometric building night"',
  why: 'Optional atmospheric still for the security panel. No custom design needed.',
} as const;
