import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateGame, deleteGame } from "../actions";

export default async function EditGamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: game }, { data: categories }] = await Promise.all([
    supabase.from("games").select("*").eq("id", id).single(),
    supabase.from("categories").select("*").order("sort_order"),
  ]);

  if (!game) notFound();

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin/games" className="text-xs text-gray-400 hover:text-gray-700">
            ← Kembali ke daftar game
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">{game.name}</h1>
        </div>
        <form action={deleteGame.bind(null, game.id)}>
          <button
            type="submit"
            className="text-red-600 text-sm font-semibold hover:underline"
          >
            Hapus Game
          </button>
        </form>
      </div>

      <form action={updateGame.bind(null, game.id)} className="space-y-5">
        <input type="hidden" name="slug" value={game.slug} />
        <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-6">
          <div>
            <div className="cover-container border border-gray-200">
              {game.cover_url && (
                <Image src={game.cover_url} alt={game.name} fill unoptimized className="cover-img object-cover" />
              )}
            </div>
            <label className="block mt-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase">
                Ganti cover (manual)
              </span>
              <input
                type="file"
                name="cover_file"
                accept="image/*"
                className="block w-full text-xs mt-1"
              />
            </label>
            <p className="text-[10px] text-gray-400 mt-1">
              Sumber sekarang:{" "}
              <span className="font-semibold">{game.cover_source ?? "placeholder"}</span>
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Nama Game
              </label>
              <input
                name="name"
                defaultValue={game.name}
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  Harga
                </label>
                <input
                  type="number"
                  name="price"
                  defaultValue={game.price}
                  required
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
                  defaultValue={game.original_price}
                  required
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
                  defaultValue={game.category_id ?? ""}
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
                  Status
                </label>
                <select
                  name="status"
                  defaultValue={game.status}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Aktif</option>
                  <option value="archived">Arsip</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Ukuran File
              </label>
              <input
                name="size_label"
                defaultValue={game.size_label ?? ""}
                placeholder="contoh: 45 GB"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" name="is_featured" defaultChecked={game.is_featured} />
              Tampilkan sebagai highlight/featured
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
            Deskripsi
          </label>
          <textarea
            name="description"
            defaultValue={game.description ?? ""}
            rows={5}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm"
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white font-bold px-6 py-3 rounded-xl text-sm hover:bg-blue-700 transition"
        >
          Simpan Perubahan
        </button>
      </form>
    </div>
  );
}
