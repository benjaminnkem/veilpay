'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
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
import { buildDepartmentData } from '@/features/dashboard/utils/chart-helpers';
import { cn } from '@/lib/utils';
import type { DashboardStats } from '@repo/types';

const chartConfig = {
  employees: {
    label: 'Employees',
    color: 'var(--chart-2)',
  },
  label: {
    color: 'var(--foreground)',
  },
} satisfies ChartConfig;

interface DepartmentBreakdownChartProps {
  data: DashboardStats['departmentBreakdown'];
  className?: string;
}

export function DepartmentBreakdownChart({
  data,
  className,
}: DepartmentBreakdownChartProps) {
  const chartData = buildDepartmentData(data).slice(0, 8);
  const total = chartData.reduce((sum, row) => sum + row.employees, 0);

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
            <CardTitle className="text-sm font-medium">
              Headcount by department
            </CardTitle>
            <CardDescription>Active distribution across teams</CardDescription>
          </div>
          {total > 0 ? (
            <p className="text-xs text-muted-foreground tabular-nums">
              {total} employee{total === 1 ? '' : 's'}
            </p>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col">
        {chartData.length === 0 ? (
          <div className="flex min-h-[280px] flex-1 items-center justify-center rounded-lg border border-dashed border-border/60">
            <p className="text-sm text-muted-foreground">
              Add employees to see department analytics
            </p>
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto min-h-[280px] w-full flex-1"
          >
            <BarChart
              accessibilityLayer
              data={chartData}
              layout="vertical"
              margin={{ left: 0, right: 28, top: 4, bottom: 4 }}
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <YAxis
                dataKey="department"
                type="category"
                tickLine={false}
                axisLine={false}
                width={96}
                tickMargin={8}
                tickFormatter={(value: string) =>
                  value.length > 14 ? `${value.slice(0, 12)}…` : value
                }
              />
              <XAxis type="number" hide />
              <ChartTooltip
                cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value, _name, item) => (
                      <div className="flex flex-1 items-center justify-between gap-4">
                        <span className="text-muted-foreground">
                          {(item?.payload as { department?: string })
                            ?.department ?? 'Department'}
                        </span>
                        <span className="font-mono font-medium tabular-nums">
                          {value}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Bar dataKey="employees" radius={4} maxBarSize={28}>
                {chartData.map((entry) => (
                  <Cell key={entry.department} fill={entry.fill} />
                ))}
                <LabelList
                  dataKey="employees"
                  position="right"
                  offset={8}
                  className="fill-foreground text-[11px] tabular-nums"
                />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
