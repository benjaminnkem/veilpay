'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { buildPayrollTrendData } from '@/features/dashboard/utils/chart-helpers';
import { cn, formatCurrency } from '@/lib/utils';
import type { DashboardStats } from '@repo/types';

const chartConfig = {
  amount: {
    label: 'Net payroll',
    color: 'var(--chart-1)',
  },
  runs: {
    label: 'Runs',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig;

interface PayrollTrendChartProps {
  data: DashboardStats['payrollTrend'];
  className?: string;
}

export function PayrollTrendChart({ data, className }: PayrollTrendChartProps) {
  const chartData = buildPayrollTrendData(data);
  const total = chartData.reduce((sum, row) => sum + row.amount, 0);
  const runCount = chartData.reduce((sum, row) => sum + row.runs, 0);

  return (
    <Card
      className={cn(
        'flex h-full flex-col border-border/60 shadow-none',
        className,
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium">Payroll trend</CardTitle>
            <CardDescription>
              Net pay volume across recent payroll runs
            </CardDescription>
          </div>
          {chartData.length > 0 ? (
            <div className="text-right">
              <p className="text-lg font-semibold tabular-nums tracking-tight">
                {formatCurrency(total)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {runCount} run{runCount === 1 ? '' : 's'} · last{' '}
                {chartData.length} mo
              </p>
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col">
        {chartData.length === 0 ? (
          <div className="flex min-h-[260px] flex-1 items-center justify-center rounded-lg border border-dashed border-border/60">
            <p className="text-sm text-muted-foreground">
              Complete a payroll run to see trend analytics
            </p>
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto min-h-[260px] w-full flex-1"
          >
            <AreaChart
              accessibilityLayer
              data={chartData}
              margin={{ left: 4, right: 8, top: 8, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fillAmount" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-amount)"
                    stopOpacity={0.35}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-amount)"
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={24}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={56}
                tickFormatter={(value: number) =>
                  value >= 1000
                    ? `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`
                    : `$${value}`
                }
              />
              <ChartTooltip
                cursor={{ stroke: 'var(--border)', strokeWidth: 1 }}
                content={
                  <ChartTooltipContent
                    indicator="line"
                    labelFormatter={(_, payload) => {
                      const item = payload?.[0]?.payload as
                        | { label?: string; runs?: number }
                        | undefined;
                      if (!item?.label) return null;
                      return (
                        <span>
                          {item.label}
                          {typeof item.runs === 'number'
                            ? ` · ${item.runs} run${item.runs === 1 ? '' : 's'}`
                            : ''}
                        </span>
                      );
                    }}
                    formatter={(value) => (
                      <div className="flex flex-1 items-center justify-between gap-4 leading-none">
                        <span className="text-muted-foreground">Net payroll</span>
                        <span className="font-mono font-medium tabular-nums">
                          {formatCurrency(Number(value))}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Area
                dataKey="amount"
                type="monotone"
                fill="url(#fillAmount)"
                stroke="var(--color-amount)"
                strokeWidth={2}
                dot={{
                  r: 3,
                  fill: 'var(--color-amount)',
                  strokeWidth: 0,
                }}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
