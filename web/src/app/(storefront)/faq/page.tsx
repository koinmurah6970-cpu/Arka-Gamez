import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Pertanyaan yang sering ditanyakan seputar pemesanan, pembayaran, dan instalasi game.",
};

const FAQS = [
  {
    q: "Gimana cara pesan game?",
    a: "Pilih game yang mau dibeli, masukin ke keranjang, checkout, isi Player ID akun game kamu. Setelah itu kamu bakal dapet nomor pesanan buat konfirmasi ke admin.",
  },
  {
    q: "Metode pembayaran apa yang tersedia?",
    a: "Pembayaran dikonfirmasi manual lewat WhatsApp admin setelah pesanan dibuat. Detail rekening/e-wallet akan diinfokan admin saat konfirmasi.",
  },
  {
    q: "Berapa lama proses setelah bayar?",
    a: "Begitu admin mengonfirmasi pembayaran diterima, link download & panduan instalasi akan langsung diproses.",
  },
  {
    q: "Gimana cara install game-nya?",
    a: "Setiap game dikirim beserta link download. Kalau butuh bantuan instalasi, admin siap bantu lewat WhatsApp.",
  },
  {
    q: "Ada garansi kalau game error / link rusak?",
    a: "Ada. Kalau link download bermasalah atau file corrupt, hubungi admin dengan menyertakan nomor pesanan — link akan diganti tanpa biaya tambahan.",
  },
  {
    q: "Bisa refund kalau berubah pikiran?",
    a: "Karena produk berupa akses digital yang langsung diproses, pesanan yang link-nya sudah terkirim tidak bisa direfund. Sebelum link terkirim, refund/pembatalan bisa diajukan lewat WhatsApp admin.",
  },
];

export default function FaqPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground mb-6">FAQ</h1>
      <div className="space-y-4">
        {FAQS.map((item) => (
          <div
            key={item.q}
            className="bg-surface border border-border-subtle rounded-2xl p-5"
          >
            <p className="font-bold text-foreground text-sm mb-1.5">{item.q}</p>
            <p className="text-sm text-muted leading-relaxed">{item.a}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
