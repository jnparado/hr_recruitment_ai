import { RecruiterShell } from "@/app/_components/RecruiterShell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RecruiterShell>{children}</RecruiterShell>;
}
