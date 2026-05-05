import { HrLayoutShell } from "@/components/hr-layout-shell";

export default function HrDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <HrLayoutShell>{children}</HrLayoutShell>;
}
