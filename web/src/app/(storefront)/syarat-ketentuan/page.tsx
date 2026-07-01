import type { Metadata } from "next";
import { STORE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan",
  description: `Syarat dan ketentuan penggunaan layanan ${STORE_NAME}.`,
};

export default function TermsPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground mb-1">Syarat & Ketentuan</h1>
      <p className="text-xs text-muted mb-6">Terakhir diperbarui: {new Date().toLocaleDateString("id-ID")}</p>

      <div className="space-y-6 text-sm text-muted leading-relaxed">
        <section>
          <h2 className="font-bold text-foreground mb-1.5">1. Tentang Layanan</h2>
          <p>
            {STORE_NAME} menjual akses/link download game PC dan jasa bantuan instalasi.
            Dengan melakukan pemesanan, kamu setuju dengan syarat & ketentuan di bawah ini.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-foreground mb-1.5">2. Pemesanan & Pembayaran</h2>
          <p>
            Pesanan dianggap sah setelah pembayaran dikonfirmasi oleh admin lewat WhatsApp.
            Kami tidak bertanggung jawab atas keterlambatan yang disebabkan oleh kesalahan
            data (Player ID, nomor WhatsApp) yang diisi saat checkout.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-foreground mb-1.5">3. Pengiriman & Lisensi</h2>
          <p>
            Link download dikirim setelah pembayaran dikonfirmasi lunas. Game yang dijual
            ditujukan untuk penggunaan pribadi. {STORE_NAME} tidak menjamin dukungan resmi
            dari publisher/developer game terkait.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-foreground mb-1.5">4. Kebijakan Refund</h2>
          <p>
            Karena produk berupa akses digital, pesanan yang link download-nya sudah
            dikirim tidak dapat dibatalkan atau direfund. Pengecualian berlaku bila link
            rusak/tidak bisa diakses — hubungi admin untuk penggantian link.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-foreground mb-1.5">5. Perubahan Ketentuan</h2>
          <p>
            {STORE_NAME} dapat memperbarui syarat & ketentuan ini sewaktu-waktu. Perubahan
            berlaku sejak dipublikasikan di halaman ini.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-foreground mb-1.5">6. Kontak</h2>
          <p>Pertanyaan seputar syarat & ketentuan ini bisa disampaikan lewat WhatsApp admin.</p>
        </section>
      </div>
    </main>
  );
}
