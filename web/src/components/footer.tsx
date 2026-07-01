import Link from "next/link";
import { STORE_NAME } from "@/lib/constants";
import { getStoreSettings } from "@/lib/store-settings";

export async function Footer() {
  const { waAdminNumber } = await getStoreSettings();
  const waLink = `https://wa.me/${waAdminNumber}?text=${encodeURIComponent(
    `Halo Admin ${STORE_NAME}, saya mau tanya-tanya.`
  )}`;
  const year = new Date().getFullYear();

  return (
    <footer className="bg-surface border-t border-border-subtle mt-12">
      <div className="container mx-auto max-w-7xl px-4 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div>
          <h2 className="font-extrabold text-foreground mb-2">{STORE_NAME}</h2>
          <p className="text-xs text-muted leading-relaxed">
            Jual & instalasi game PC/Laptop, ribuan koleksi siap pakai.
          </p>
        </div>

        <div>
          <h3 className="text-xs font-bold text-muted uppercase mb-3">Bantuan</h3>
          <ul className="space-y-2 text-sm text-foreground">
            <li>
              <Link href="/faq" className="hover:text-accent transition">
                FAQ
              </Link>
            </li>
            <li>
              <Link href="/syarat-ketentuan" className="hover:text-accent transition">
                Syarat & Ketentuan
              </Link>
            </li>
            <li>
              <Link href="/privasi" className="hover:text-accent transition">
                Kebijakan Privasi
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-bold text-muted uppercase mb-3">Kontak</h3>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-foreground hover:text-emerald-500 transition"
          >
            💬 Chat Admin via WhatsApp
          </a>
        </div>
      </div>

      <div className="border-t border-border-subtle py-4 text-center text-xs text-muted">
        © {year} {STORE_NAME}. Semua hak dilindungi.
      </div>
    </footer>
  );
}
