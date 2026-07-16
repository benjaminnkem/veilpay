import { EmployeeDetail } from '@/features/employees/components/employee-detail';

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EmployeeDetail employeeId={id} />;
}
