import type { Metadata } from "next";
import { getStoreSettings } from "@/lib/store-settings";
import { RequestForm } from "./request-form";

export const metadata: Metadata = {
  title: "Request Game",
  description: "Gak nemu game yang kamu cari? Request ke kami — kami carikan dan kabarin balik.",
};

export default async function RequestGamePage() {
  const { waAdminNumber } = await getStoreSettings();

  return (
    <main className="container mx-auto px-4 py-12 max-w-lg">
      <div className="text-center mb-8">
        <div className="text-4xl mb-3">🎮</div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Request Game</h1>
        <p className="text-sm text-muted">
          Game yang kamu cari belum ada di katalog? Isi form di bawah — admin akan
          follow-up ke WhatsApp kamu kalau game sudah tersedia.
        </p>
      </div>

      <div className="bg-surface border border-border-subtle rounded-2xl p-6 shadow-sm">
        <RequestForm waAdminNumber={waAdminNumber} />
      </div>
    </main>
  );
}
