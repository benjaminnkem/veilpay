'use client';

import { Cell, Label, Pie, PieChart } from 'recharts';

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
import {
  buildPayrollStatusData,
  buildStatusChartConfig,
} from '@/features/dashboard/utils/chart-helpers';
import { cn } from '@/lib/utils';
import type { DashboardStats } from '@repo/types';

interface PayrollStatusChartProps {
  data: DashboardStats['payrollByStatus'];
  className?: string;
}

export function PayrollStatusChart({ data, className }: PayrollStatusChartProps) {
  const chartData = buildPayrollStatusData(data);
  const chartConfig = buildStatusChartConfig(chartData) satisfies ChartConfig;
  const total = chartData.reduce((sum, row) => sum + row.count, 0);

  return (
    <Card
      className={cn(
        'flex h-full flex-col border-border/60 shadow-none',
        className,
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Payroll by status</CardTitle>
        <CardDescription>Distribution of recent payroll runs</CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col">
        {chartData.length === 0 ? (
          <div className="flex min-h-[260px] flex-1 items-center justify-center rounded-lg border border-dashed border-border/60">
            <p className="text-sm text-muted-foreground">No payroll runs yet</p>
          </div>
        ) : (
          <div className="flex min-h-[260px] flex-1 flex-col items-center justify-center gap-4">
            <div className="relative size-[180px] shrink-0">
              <ChartContainer
                config={chartConfig}
                className="!aspect-auto size-full"
                initialDimension={{ width: 180, height: 180 }}
              >
                <PieChart>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        nameKey="status"
                        formatter={(value, name) => (
                          <div className="flex flex-1 items-center justify-between gap-4 leading-none">
                            <span className="text-muted-foreground">
                              {chartConfig[String(name)]?.label ?? name}
                            </span>
                            <span className="font-mono font-medium tabular-nums">
                              {value}
                            </span>
                          </div>
                        )}
                        hideLabel
                      />
                    }
                  />
                  <Pie
                    data={chartData}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={80}
                    stroke="var(--card)"
                    strokeWidth={2}
                    paddingAngle={chartData.length > 1 ? 2 : 0}
                  >
                    {chartData.map((entry) => (
                      <Cell
                        key={entry.status}
                        fill={entry.fill}
                        stroke="var(--card)"
                      />
                    ))}
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy ?? 0) - 4}
                                className="fill-foreground text-2xl font-semibold tabular-nums"
                              >
                                {total}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy ?? 0) + 16}
                                className="fill-muted-foreground text-[11px]"
                              >
                                total runs
                              </tspan>
                            </text>
                          );
                        }
                        return null;
                      }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
            </div>

            <ul className="mt-auto grid w-full grid-cols-2 gap-x-3 gap-y-2">
              {chartData.map((item) => {
                const pct =
                  total > 0 ? Math.round((item.count / total) * 100) : 0;
                return (
                  <li
                    key={item.status}
                    className="flex min-w-0 items-center gap-2 text-xs"
                  >
                    <span
                      className="size-2 shrink-0 rounded-[2px]"
                      style={{ backgroundColor: item.color }}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 truncate text-muted-foreground">
                      {item.label}
                    </span>
                    <span className="shrink-0 font-medium tabular-nums text-foreground">
                      {item.count}
                      <span className="ml-1 font-normal text-muted-foreground">
                        ({pct}%)
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
