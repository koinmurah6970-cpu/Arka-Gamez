import type { Metadata } from "next";
import { STORE_NAME } from "@/lib/constants";
import { getStoreSettings } from "@/lib/store-settings";

export const metadata: Metadata = {
  title: "Request Game",
  description: "Gak nemu game yang kamu cari? Kabarin admin, kita carikan.",
};

export default async function RequestGamePage() {
  const { waAdminNumber } = await getStoreSettings();
  const waLink = `https://wa.me/${waAdminNumber}?text=${encodeURIComponent(
    `Halo Admin ${STORE_NAME}, saya mau request game yang belum ada di katalog: `
  )}`;

  return (
    <main className="container mx-auto px-4 py-16 max-w-lg text-center">
      <div className="text-4xl mb-4">✨</div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Request Game</h1>
      <p className="text-sm text-muted mb-8">
        Fitur form request lagi disiapkan. Sementara ini, langsung kabarin admin lewat
        WhatsApp — kasih tau judul game yang kamu cari, kita carikan.
      </p>
      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block bg-accent text-accent-foreground font-bold text-sm px-6 py-3 rounded-xl hover:opacity-90 transition"
      >
        💬 Request via WhatsApp
      </a>
    </main>
  );
}
