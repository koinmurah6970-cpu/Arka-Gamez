import { createClient } from "@/lib/supabase/server";
import { createPromoCard, updatePromoCard, deletePromoCard } from "./actions";

export default async function AdminPromoPage() {
  const supabase = await createClient();
  const { data: cards } = await supabase
    .from("promo_cards")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Kelola Promo</h1>
      <p className="text-sm text-gray-400 mb-6">
        Card promo yang ditampilin di halaman{" "}
        <a href="/promo" target="_blank" className="text-blue-600 hover:underline">
          /promo
        </a>{" "}
        — cuma yang &quot;Aktif&quot; yang keliatan ke pengunjung.
      </p>

      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm mb-4">
        <h2 className="text-xs font-bold text-gray-500 uppercase mb-3">Tambah Promo</h2>
        <form action={createPromoCard} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Judul</label>
            <input
              type="text"
              name="title"
              required
              placeholder="Contoh: Beli 3 Games Bonus 1 Game"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Deskripsi (opsional)</label>
            <textarea
              name="description"
              rows={2}
              placeholder="Contoh: Checkout minimal 3 game sekaligus, dapet 1 game gratis pilihan admin."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
            />
          </div>
          <div className="flex items-end gap-2">
            <div className="w-24">
              <label className="block text-xs text-gray-400 mb-1">Urutan</label>
              <input
                type="number"
                name="sort_order"
                defaultValue={(cards?.length ?? 0) + 1}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition"
            >
              Tambah
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-3">
        {(cards ?? []).map((card) => (
          <form
            key={card.id}
            action={updatePromoCard.bind(null, card.id)}
            className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3"
          >
            <div className="flex gap-2">
              <input
                type="text"
                name="title"
                defaultValue={card.title}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold"
              />
              <input
                type="number"
                name="sort_order"
                defaultValue={card.sort_order}
                className="w-16 bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-sm"
              />
            </div>
            <textarea
              name="description"
              rows={2}
              defaultValue={card.description ?? ""}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm"
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" name="is_active" defaultChecked={card.is_active} />
                Aktif (tampil di /promo)
              </label>
              <div className="flex items-center gap-3">
                <button type="submit" className="text-blue-600 font-semibold text-xs hover:underline">
                  Simpan
                </button>
                <button
                  type="submit"
                  formAction={deletePromoCard.bind(null, card.id)}
                  className="text-red-500 font-semibold text-xs hover:underline"
                >
                  Hapus
                </button>
              </div>
            </div>
          </form>
        ))}
        {(!cards || cards.length === 0) && (
          <p className="text-center py-12 text-gray-400 bg-white border border-gray-100 rounded-2xl">
            Belum ada promo.
          </p>
        )}
      </div>
    </div>
  );
}
