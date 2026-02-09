import { UserTable } from "@/components/admin/UserTable";
import { getUsersWithStats } from "@/lib/admin/queries";

interface UsersPageProps {
  searchParams: { q?: string; days?: string };
}

export default async function AdminUsersPage({ searchParams }: UsersPageProps) {
  const initialDays = searchParams.days ? Number(searchParams.days) : 30;
  const initialUsers = await getUsersWithStats({
    search: searchParams.q ?? null,
    days: initialDays,
  });

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8">
      <UserTable initialUsers={initialUsers.map((user) => ({ ...user, createdAt: user.createdAt.toISOString() }))} initialQuery={searchParams.q ?? ""} initialDays={initialDays} />
    </div>
  );
}
