"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GameError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="container mx-auto px-4 py-20 max-w-lg text-center">
      <p className="text-4xl mb-4">😵</p>
      <h2 className="text-xl font-bold text-foreground mb-2">Gagal memuat halaman game</h2>
      <p className="text-sm text-muted mb-6">Terjadi kesalahan saat mengambil data. Coba lagi atau kembali ke katalog.</p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={reset}
          className="bg-accent text-accent-foreground font-bold text-sm px-5 py-2.5 rounded-xl hover:opacity-90 transition"
        >
          Coba Lagi
        </button>
        <Link
          href="/"
          className="border border-border-subtle text-foreground font-bold text-sm px-5 py-2.5 rounded-xl hover:border-accent/40 transition"
        >
          Kembali ke Katalog
        </Link>
      </div>
    </main>
  );
}
