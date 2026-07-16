import { PayrollDetail } from '@/features/payroll/components/payroll-detail';

export default async function PayrollDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PayrollDetail payrollId={id} />;
}
