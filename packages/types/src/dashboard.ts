export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  monthlyPayrollCents: number;
  pendingApprovals: number;
  draftPayrolls: number;
  approvedPayrolls: number;
  blockchainPendingPayrolls: number;
  upcomingPayroll: {
    id: string;
    name: string;
    payDate: string;
    status: string;
    totalNetPayCents: number;
    currency: string;
  } | null;
  treasury: {
    safeAddress: string | null;
    network: string | null;
    executionProvider: string;
    ready: boolean;
    status: string;
    message: string;
  };
  payrollByStatus: Record<string, number>;
  departmentBreakdown: Array<{
    department: string;
    employeeCount: number;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    actorEmail: string | null;
    createdAt: string;
  }>;
  payrollTrend: Array<{
    month: string;
    totalNetPayCents: number;
    runCount: number;
  }>;
}
