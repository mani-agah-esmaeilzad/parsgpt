import { GptForm } from "@/components/admin/GptForm";

export default function AdminGptCreatePage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8">
      <GptForm mode="create" />
    </div>
  );
}
