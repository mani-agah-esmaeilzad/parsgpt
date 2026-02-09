import { AdminNav } from "@/components/admin/AdminNav";
import { PageHeader } from "@/components/layout/PageHeader";
import { requireAdmin } from "@/lib/auth/require-admin";

const NAV_LINKS = [
  { href: "/admin", label: "داشبورد" },
  { href: "/admin/users", label: "کاربران" },
  { href: "/admin/gpts", label: "GPT ها" },
  { href: "/admin/reports", label: "گزارش‌ها" },
  { href: "/admin/audit", label: "ممیزی" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader title="پنل مدیریت" description="گزارش‌ها و تنظیمات پیشرفته" />
      <div className="bg-background">
        <div className="mx-auto flex w-full max-w-4xl px-4 py-3 md:px-10">
          <AdminNav links={NAV_LINKS} />
        </div>
      </div>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  );
}
