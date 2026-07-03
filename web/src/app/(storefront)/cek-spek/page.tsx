"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type GameSearchHit = {
  id: string;
  slug: string;
  name: string;
  cover_url: string | null;
  category: {
    name: string;
  } | null;
};

const supabase = createClient();

const RAM_OPTIONS = [
  { label: "2 GB", value: 2 },
  { label: "4 GB", value: 4 },
  { label: "8 GB", value: 8 },
  { label: "12 GB", value: 12 },
  { label: "16 GB", value: 16 },
  { label: "32 GB", value: 32 },
  { label: "64 GB", value: 64 },
];

const CPU_OPTIONS = [
  { label: "Low-End (Dual Core, Celeron, Athlon)", value: 1 },
  { label: "Mid-Range (Core i3/i5 Lama, Ryzen 3)", value: 2 },
  { label: "Upper Mid-Range (Core i5/i7 Baru, Ryzen 5)", value: 3 },
  { label: "High-End (Core i7/i9 Baru, Ryzen 7/9)", value: 4 },
];

const GPU_OPTIONS = [
  { label: "Integrated Graphics (Intel HD, AMD Vega 3/8)", value: 1 },
  { label: "Entry Gaming (GTX 750 Ti, GTX 1050 Ti, RX 560/570)", value: 2 },
  { label: "Mid-Range Gaming (GTX 1060, RTX 2060/3050, RX 580/6600)", value: 3 },
  { label: "High-End Gaming (RTX 3060/4060 ke atas, RX 6700 ke atas)", value: 4 },
];

export default function CekSpekPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [hits, setHits] = useState<GameSearchHit[]>([]);
  const [selectedGame, setSelectedGame] = useState<GameSearchHit | null>(null);
  const [dropOpen, setDropOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Specs state
  const [userRam, setUserRam] = useState<number>(8);
  const [userCpu, setUserCpu] = useState<number>(2);
  const [userGpu, setUserGpu] = useState<number>(2);

  // Result state
  const [result, setResult] = useState<{
    verdict: "LANCAR" | "CUKUP" | "KURANG";
    title: string;
    description: string;
    ramOk: boolean;
    cpuOk: boolean;
    gpuOk: boolean;
    reqRam: number;
    reqSpecsText: string;
  } | null>(null);

  // Fetch games for search autocomplete
  useEffect(() => {
    async function searchGames() {
      if (!searchQuery.trim()) {
        setHits([]);
        return;
      }
      const { data } = await supabase
        .from("games")
        .select("id, slug, name, cover_url, category:categories(name)")
        .eq("status", "active")
        .ilike("name", `%${searchQuery}%`)
        .order("name", { ascending: true })
        .limit(5);
      setHits((data ?? []) as unknown as GameSearchHit[]);
    }
    const handle = setTimeout(searchGames, 200);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  // Click outside to close autocomplete dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const calculateCompatibility = () => {
    if (!selectedGame) return;

    const categoryName = selectedGame.category?.name?.toLowerCase() ?? "sedang";
    
    // Define category requirements
    let reqRam = 8;
    let reqCpuTier = 2; // Mid-range
    let reqGpuTier = 2; // Entry
    let reqSpecsText = "";

    if (categoryName === "ringan") {
      reqRam = 4;
      reqCpuTier = 1;
      reqGpuTier = 1;
      reqSpecsText = "RAM 4 GB, CPU Dual-Core, Intel HD Graphics";
    } else if (categoryName === "sedang") {
      reqRam = 8;
      reqCpuTier = 2;
      reqGpuTier = 2;
      reqSpecsText = "RAM 8 GB, Core i3/i5 generasi lama, GTX 750 Ti / GTX 1050 Ti";
    } else if (categoryName === "agak berat") {
      reqRam = 8;
      reqCpuTier = 3;
      reqGpuTier = 3;
      reqSpecsText = "RAM 8 GB, Core i5/i7 modern, GTX 1060 / RX 580";
    } else if (categoryName === "berat") {
      reqRam = 16;
      reqCpuTier = 4;
      reqGpuTier = 4;
      reqSpecsText = "RAM 16 GB, Core i7 modern / Ryzen 5, RTX 2060 / RTX 3060";
    }

    const ramOk = userRam >= reqRam;
    const cpuOk = userCpu >= reqCpuTier;
    const gpuOk = userGpu >= reqGpuTier;

    // Determine verdict
    let verdict: "LANCAR" | "CUKUP" | "KURANG" = "LANCAR";
    let title = "";
    let description = "";

    const passCount = (ramOk ? 1 : 0) + (cpuOk ? 1 : 0) + (gpuOk ? 1 : 0);

    if (passCount === 3) {
      verdict = "LANCAR";
      title = "🟢 LANCAR JAYA!";
      description = `Spesifikasi PC/laptop Anda sudah sangat mumpuni untuk memainkan game "${selectedGame.name}". Anda bisa memainkannya dengan FPS stabil pada setting grafis Medium hingga High/Ultra.`;
    } else if (passCount === 2) {
      verdict = "CUKUP";
      title = "🟡 BISA DIMAINKAN (SETTING LOW-MEDIUM)";
      description = `PC Anda sedikit mepet di beberapa komponen (terutama ${!ramOk ? "RAM" : !cpuOk ? "Processor" : "VGA/GPU"}). Game "${selectedGame.name}" masih bisa dimainkan dengan nyaman di setting grafis Low atau Medium, namun pastikan untuk menutup aplikasi background lain sebelum bermain.`;
    } else {
      verdict = "KURANG";
      title = "🔴 SPESIFIKASI KURANG COMPATIBLE";
      description = `Spesifikasi PC Anda berada di bawah batas minimum yang disarankan untuk game "${selectedGame.name}". Game kemungkinan besar akan mengalami lag parah, patah-patah (stuttering), atau tidak bisa terbuka sama sekali. Kami merekomendasikan untuk melakukan upgrade hardware terlebih dahulu.`;
    }

    setResult({
      verdict,
      title,
      description,
      ramOk,
      cpuOk,
      gpuOk,
      reqRam,
      reqSpecsText,
    });
  };

  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl min-h-[80vh] flex flex-col justify-center">
      <div className="text-center mb-10">
        <div className="inline-block px-4 py-1.5 rounded-full border border-accent/20 bg-accent/5 text-accent text-xs font-bold tracking-wide mb-3 shadow-[0_0_15px_rgba(var(--accent-rgb),0.1)]">
          PC COMPATIBILITY CHECKER
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
          Cek Kompatibilitas PC / Laptop Anda
        </h1>
        <p className="text-sm text-muted mt-2 max-w-xl mx-auto">
          Cari game favorit Anda dan masukkan spesifikasi hardware untuk melihat apakah laptop/PC Anda kuat memainkannya.
        </p>
      </div>

      <div className="bg-surface border border-border-subtle rounded-3xl p-6 md:p-8 shadow-2xl grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left column: Inputs */}
        <div className="space-y-6">
          {/* Game Selection */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
              1. Pilih Judul Game PC
            </label>
            <input
              type="text"
              value={selectedGame ? selectedGame.name : searchQuery}
              onChange={(e) => {
                setSelectedGame(null);
                setSearchQuery(e.target.value);
                setDropOpen(true);
                setResult(null);
              }}
              onFocus={() => setDropOpen(true)}
              placeholder="Ketik judul game (misal: GTA V, Naruto, Wukong...)"
              className="w-full bg-border-subtle border border-transparent rounded-xl p-3.5 text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition placeholder-muted"
            />
            {dropOpen && hits.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border-subtle rounded-2xl shadow-xl z-50 overflow-hidden">
                {hits.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => {
                      setSelectedGame(g);
                      setSearchQuery("");
                      setDropOpen(false);
                    }}
                    className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-border-subtle transition-colors border-b border-border-subtle/30 last:border-0"
                  >
                    <div className="w-8 h-11 rounded bg-border-subtle overflow-hidden flex-none">
                      {g.cover_url && (
                        <Image
                          src={g.cover_url}
                          alt={g.name}
                          width={32}
                          height={44}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground truncate">{g.name}</p>
                      <p className="text-xs text-muted">Kategori: {g.category?.name ?? "-"}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RAM selection */}
          <div>
            <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
              2. Kapasitas RAM Laptop/PC
            </label>
            <select
              value={userRam}
              onChange={(e) => {
                setUserRam(Number(e.target.value));
                setResult(null);
              }}
              className="w-full bg-border-subtle border border-transparent rounded-xl p-3.5 text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition cursor-pointer appearance-none"
            >
              {RAM_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* CPU Selection */}
          <div>
            <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
              3. Tipe Processor (CPU)
            </label>
            <select
              value={userCpu}
              onChange={(e) => {
                setUserCpu(Number(e.target.value));
                setResult(null);
              }}
              className="w-full bg-border-subtle border border-transparent rounded-xl p-3.5 text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition cursor-pointer appearance-none"
            >
              {CPU_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* GPU Selection */}
          <div>
            <label className="block text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
              4. Kartu Grafis (GPU / VGA)
            </label>
            <select
              value={userGpu}
              onChange={(e) => {
                setUserGpu(Number(e.target.value));
                setResult(null);
              }}
              className="w-full bg-border-subtle border border-transparent rounded-xl p-3.5 text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition cursor-pointer appearance-none"
            >
              {GPU_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={calculateCompatibility}
            disabled={!selectedGame}
            className="w-full bg-accent text-accent-foreground py-3.5 px-4 rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition text-sm flex items-center justify-center gap-2 mt-4"
          >
            💻 Cek Kompatibilitas
          </button>
        </div>

        {/* Right column: Results */}
        <div className="flex flex-col justify-center border-t md:border-t-0 md:border-l border-border-subtle pt-6 md:pt-0 md:pl-8">
          {!result ? (
            <div className="text-center py-12 text-muted">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-14 w-14 mx-auto text-muted/30 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <p className="text-sm font-semibold">Hasil Analisis Spesifikasi</p>
              <p className="text-xs text-muted/70 mt-1 max-w-[280px] mx-auto">
                Silakan pilih game terlebih dahulu dan klik tombol "Cek Kompatibilitas" untuk menganalisis PC Anda.
              </p>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center md:text-left">
                <p className="text-[10px] font-bold text-muted uppercase tracking-wider">Hasil Analisis Game</p>
                <h3 className="text-md font-extrabold text-foreground mt-1 truncate">
                  {selectedGame?.name}
                </h3>
                <span className="inline-block mt-2 text-xs font-bold px-3 py-1 rounded-full bg-border-subtle text-foreground">
                  Spesifikasi Minimum Game: {selectedGame?.category?.name}
                </span>
              </div>

              {/* Verdict Banner */}
              <div
                className={`p-4 rounded-2xl border text-center ${
                  result.verdict === "LANCAR"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : result.verdict === "CUKUP"
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                    : "bg-red-500/10 border-red-500/20 text-red-400"
                }`}
              >
                <span className="text-sm font-black tracking-tight">{result.title}</span>
              </div>

              <p className="text-xs text-muted leading-relaxed text-justify">
                {result.description}
              </p>

              {/* Specs checklist */}
              <div className="space-y-2 border-t border-border-subtle pt-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted font-medium">RAM PC (Min {result.reqRam} GB)</span>
                  <span className={`font-bold ${result.ramOk ? "text-emerald-400" : "text-red-400"}`}>
                    {result.ramOk ? "🟢 MEMENUHI" : "🔴 BELUM CUKUP"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted font-medium">Processor / CPU</span>
                  <span className={`font-bold ${result.cpuOk ? "text-emerald-400" : "text-red-400"}`}>
                    {result.cpuOk ? "🟢 MEMENUHI" : "🔴 BELUM CUKUP"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted font-medium">Graphics Card / GPU</span>
                  <span className={`font-bold ${result.gpuOk ? "text-emerald-400" : "text-red-400"}`}>
                    {result.gpuOk ? "🟢 MEMENUHI" : "🔴 BELUM CUKUP"}
                  </span>
                </div>
              </div>

              {/* Game details CTA */}
              <div className="border-t border-border-subtle pt-4 flex gap-3">
                <Link
                  href={`/game/${selectedGame?.slug}`}
                  className="flex-1 text-center bg-accent text-accent-foreground py-2.5 px-4 rounded-xl font-bold hover:opacity-90 transition text-xs"
                >
                  Detail Game ➔
                </Link>
                <button
                  onClick={() => setResult(null)}
                  className="px-4 py-2.5 bg-background border border-border-subtle text-foreground rounded-xl font-semibold text-xs hover:bg-border-subtle transition"
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
