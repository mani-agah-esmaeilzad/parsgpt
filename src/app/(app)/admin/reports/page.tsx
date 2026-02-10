import { AdminReports } from "@/components/admin/AdminReports";
import { getAdminSummary, getDailyUsage, getUsageByUser, getUsageByGpt } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const [summary, daily, usageByUser, usageByGpt] = await Promise.all([
    getAdminSummary(),
    getDailyUsage(30),
    getUsageByUser(30),
    getUsageByGpt(30),
  ]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8">
      <AdminReports
        initialSummary={summary}
        initialDaily={daily}
        initialByUser={usageByUser}
        initialByGpt={usageByGpt}
      />
    </div>
  );
}
