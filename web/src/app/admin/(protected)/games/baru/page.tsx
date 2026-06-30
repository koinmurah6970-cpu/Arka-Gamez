import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createGame } from "../actions";

export default async function NewGamePage() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("*").order("sort_order");

  return (
    <div className="max-w-xl">
      <Link href="/admin/games" className="text-xs text-gray-400 hover:text-gray-700">
        ← Kembali ke daftar game
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-1 mb-6">Tambah Game Manual</h1>

      <form action={createGame} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
            Nama Game
          </label>
          <input
            name="name"
            required
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Harga</label>
            <input
              type="number"
              name="price"
              defaultValue={20000}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Harga Coret
            </label>
            <input
              type="number"
              name="original_price"
              defaultValue={350000}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Kategori
            </label>
            <select
              name="category_id"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm"
            >
              <option value="">- Pilih -</option>
              {(categories ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
              Ukuran File
            </label>
            <input
              name="size_label"
              placeholder="contoh: 45 GB"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
          <select
            name="status"
            defaultValue="draft"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm"
          >
            <option value="draft">Draft</option>
            <option value="active">Aktif</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
            Deskripsi
          </label>
          <textarea
            name="description"
            rows={4}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm"
          />
        </div>

        <p className="text-[11px] text-gray-400">
          Cover bisa diupload manual setelah game dibuat, dari halaman edit-nya.
        </p>

        <button
          type="submit"
          className="bg-blue-600 text-white font-bold px-6 py-3 rounded-xl text-sm hover:bg-blue-700 transition"
        >
          Buat Game
        </button>
      </form>
    </div>
  );
}
