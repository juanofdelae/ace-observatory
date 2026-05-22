import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
