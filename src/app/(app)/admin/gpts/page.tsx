import { GptTable } from "@/components/admin/GptTable";
import { getAdminGpts } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export default async function AdminGptsPage() {
  const gpts = await getAdminGpts();
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8">
      <GptTable gpts={gpts.map((gpt) => ({ ...gpt, updatedAt: gpt.updatedAt.toISOString() }))} />
    </div>
  );
}
