import { createClient } from "@/lib/supabase/server";
import { createCategory, updateCategory, deleteCategory } from "./actions";

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Kelola Kategori</h1>
      <p className="text-sm text-gray-400 mb-6">{categories?.length ?? 0} kategori</p>

      {error === "in_use" && (
        <p className="mb-4 text-sm bg-red-50 text-red-600 rounded-xl px-4 py-2.5">
          Kategori tidak bisa dihapus karena masih dipakai oleh game. Pindahkan game-nya dulu.
        </p>
      )}

      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm mb-4">
        <h2 className="text-xs font-bold text-gray-500 uppercase mb-3">Tambah Kategori</h2>
        <form action={createCategory} className="flex items-end gap-2">
          <div className="flex-1">
            <label className="block text-xs text-gray-400 mb-1">Nama</label>
            <input
              type="text"
              name="name"
              required
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
            />
          </div>
          <div className="w-24">
            <label className="block text-xs text-gray-400 mb-1">Urutan</label>
            <input
              type="number"
              name="sort_order"
              defaultValue={(categories?.length ?? 0) + 1}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition"
          >
            Tambah
          </button>
        </form>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Urutan</th>
              <th className="text-left px-4 py-3">Nama</th>
              <th className="text-right px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(categories ?? []).map((category) => (
              <tr key={category.id} className="hover:bg-gray-50">
                <td colSpan={2} className="px-4 py-3">
                  <form
                    action={updateCategory.bind(null, category.id)}
                    className="flex gap-2 items-center"
                  >
                    <input
                      type="number"
                      name="sort_order"
                      defaultValue={category.sort_order}
                      className="w-16 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                    />
                    <input
                      type="text"
                      name="name"
                      defaultValue={category.name}
                      className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                    />
                    <button
                      type="submit"
                      className="text-blue-600 font-semibold text-xs hover:underline whitespace-nowrap"
                    >
                      Simpan
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3 text-right">
                  <form action={deleteCategory.bind(null, category.id)}>
                    <button type="submit" className="text-red-500 font-semibold text-xs hover:underline">
                      Hapus
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {(!categories || categories.length === 0) && (
              <tr>
                <td colSpan={3} className="text-center py-12 text-gray-400">
                  Belum ada kategori.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
