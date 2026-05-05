import { EmployeeLayoutShell } from "@/components/employee-layout-shell";

export default function EmployeeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <EmployeeLayoutShell>{children}</EmployeeLayoutShell>;
}
