import type { DashboardStats } from '@repo/types';

const STATUS_META: Record<
  string,
  { label: string; color: string }
> = {
  DRAFT: { label: 'Draft', color: 'var(--chart-5)' },
  PENDING_APPROVAL: { label: 'Pending approval', color: 'var(--chart-4)' },
  APPROVED: { label: 'Approved', color: 'var(--chart-2)' },
  PROCESSING: { label: 'Processing', color: 'var(--chart-3)' },
  BLOCKCHAIN_PENDING: { label: 'On-chain', color: 'var(--chart-1)' },
  COMPLETED: { label: 'Completed', color: 'var(--primary)' },
  FAILED: { label: 'Failed', color: 'var(--destructive)' },
  CANCELLED: { label: 'Cancelled', color: 'var(--muted-foreground)' },
  REJECTED: { label: 'Rejected', color: 'var(--destructive)' },
};

const FALLBACK_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

export function formatMonthLabel(month: string): string {
  // Expects YYYY-MM
  const [year, mon] = month.split('-');
  if (!year || !mon) return month;
  const date = new Date(Number(year), Number(mon) - 1, 1);
  if (Number.isNaN(date.getTime())) return month;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: '2-digit',
  }).format(date);
}

export function formatStatusLabel(status: string): string {
  return (
    STATUS_META[status.toUpperCase()]?.label ??
    status.replaceAll('_', ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())
  );
}

export function buildPayrollTrendData(
  trend: DashboardStats['payrollTrend'],
) {
  return trend.map((row) => ({
    month: row.month,
    label: formatMonthLabel(row.month),
    amount: row.totalNetPayCents / 100,
    runs: row.runCount,
  }));
}

export function buildPayrollStatusData(
  byStatus: DashboardStats['payrollByStatus'],
) {
  return Object.entries(byStatus)
    .filter(([, count]) => count > 0)
    .map(([status, count], index) => {
      const key = status.toLowerCase().replaceAll('_', '-');
      const meta = STATUS_META[status.toUpperCase()];
      return {
        status: key,
        statusRaw: status,
        label: meta?.label ?? formatStatusLabel(status),
        count,
        fill: `var(--color-${key})`,
        color:
          meta?.color ??
          FALLBACK_COLORS[index % FALLBACK_COLORS.length] ??
          'var(--chart-1)',
      };
    })
    .sort((a, b) => b.count - a.count);
}

export function buildDepartmentData(
  departments: DashboardStats['departmentBreakdown'],
) {
  return departments.map((row, index) => ({
    department: row.department,
    employees: row.employeeCount,
    fill:
      FALLBACK_COLORS[index % FALLBACK_COLORS.length] ?? 'var(--chart-1)',
  }));
}

export function buildStatusChartConfig(
  data: ReturnType<typeof buildPayrollStatusData>,
) {
  const config: Record<string, { label: string; color: string }> = {
    count: { label: 'Runs', color: 'var(--chart-1)' },
  };
  for (const item of data) {
    config[item.status] = {
      label: item.label,
      color: item.color,
    };
  }
  return config;
}
