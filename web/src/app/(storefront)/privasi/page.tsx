import type { Metadata } from "next";
import { STORE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description: `Kebijakan privasi ${STORE_NAME} soal data yang kami simpan dan cara kami menggunakannya.`,
};

export default function PrivacyPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground mb-1">Kebijakan Privasi</h1>
      <p className="text-xs text-muted mb-6">Terakhir diperbarui: {new Date().toLocaleDateString("id-ID")}</p>

      <div className="space-y-6 text-sm text-muted leading-relaxed">
        <section>
          <h2 className="font-bold text-foreground mb-1.5">1. Data yang Kami Simpan</h2>
          <p>
            Saat kamu memesan, kami menyimpan: nama, nomor WhatsApp, Player ID akun game,
            dan riwayat pesanan (item, harga, status). Kalau kamu login, kami juga
            menyimpan info akun dari penyedia login yang kamu pakai.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-foreground mb-1.5">2. Penggunaan Data</h2>
          <p>
            Data di atas dipakai untuk memproses pesanan, mengirim link download &
            informasi pesanan lewat WhatsApp, serta menampilkan riwayat pesanan kamu di
            website. Kami tidak menjual data kamu ke pihak ketiga.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-foreground mb-1.5">3. Pihak Ketiga</h2>
          <p>
            Kami menggunakan penyedia layanan pihak ketiga untuk menjalankan toko ini,
            seperti Supabase untuk database & login. Data hanya dibagikan sebatas yang
            diperlukan agar layanan tersebut berfungsi.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-foreground mb-1.5">4. Keamanan</h2>
          <p>
            Data pesanan hanya bisa dilihat oleh kamu sendiri (setelah login) dan admin
            toko. Kami tidak menyimpan data kartu/rekening pembayaran — konfirmasi
            pembayaran dilakukan manual lewat WhatsApp.
          </p>
        </section>

        <section>
          <h2 className="font-bold text-foreground mb-1.5">5. Hak Kamu</h2>
          <p>
            Kamu bisa minta data kamu dihapus atau dikoreksi dengan menghubungi admin
            lewat WhatsApp.
          </p>
        </section>
      </div>
    </main>
  );
}
