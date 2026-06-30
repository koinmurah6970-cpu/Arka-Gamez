import { createClient } from "@/lib/supabase/server";
import { updateStoreSettings } from "./actions";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase.from("store_settings").select("*").eq("id", 1).single();

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Pengaturan Toko</h1>
      <p className="text-sm text-gray-400 mb-6">
        Berlaku untuk seluruh storefront — nomor WA checkout, harga default game baru, dan banner promo.
      </p>

      <form
        action={updateStoreSettings}
        className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4"
      >
        <div>
          <label className="block text-xs text-gray-400 mb-1">Nomor WhatsApp Admin</label>
          <input
            type="text"
            name="wa_admin_number"
            defaultValue={settings?.wa_admin_number ?? ""}
            placeholder="6285128074103"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
          />
          <p className="text-xs text-gray-400 mt-1">Format internasional tanpa tanda +, contoh: 6285128074103</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Harga Default Game Baru</label>
            <input
              type="number"
              name="default_price"
              defaultValue={settings?.default_price ?? 20000}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Harga Coret Default</label>
            <input
              type="number"
              name="default_original_price"
              defaultValue={settings?.default_original_price ?? 350000}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Banner / Promo (opsional)</label>
          <textarea
            name="banner_text"
            rows={3}
            defaultValue={settings?.banner_text ?? ""}
            placeholder="Contoh: Promo Agustusan! Diskon tambahan 10rb min. 3 game."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm"
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition"
        >
          Simpan Pengaturan
        </button>
      </form>
    </div>
  );
}
