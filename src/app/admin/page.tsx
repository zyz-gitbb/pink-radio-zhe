import { getChannels, getCategories } from "@/app/actions";
import { AdminForm } from "@/components/admin-form";

export default async function AdminPage() {
  const [channels, categories] = await Promise.all([
    getChannels(),
    getCategories(),
  ]);

  return (
    <div className="px-12 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-stone-800 tracking-tight">
          管理后台
        </h1>
        <p className="text-[13px] text-stone-500 mt-1">创建和管理策展频道</p>
      </div>
      <AdminForm channels={channels} categories={categories} />
    </div>
  );
}
