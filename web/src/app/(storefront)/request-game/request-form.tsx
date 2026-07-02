"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { gameRequestSchema } from "@/lib/validation";
import { STORE_NAME } from "@/lib/constants";

const PLATFORMS = ["PC", "PlayStation 4", "PlayStation 5", "Nintendo Switch", "Xbox", "Android", "iOS", "Lainnya"];

export function RequestForm({ waAdminNumber }: { waAdminNumber: string }) {
  const [gameName, setGameName] = useState("");
  const [platform, setPlatform] = useState("");
  const [notes, setNotes] = useState("");
  const [requesterName, setRequesterName] = useState("");
  const [requesterWa, setRequesterWa] = useState("");
  const [hp, setHp] = useState(""); // honeypot — harus kosong
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    // Honeypot: bot mengisi field tersembunyi → tolak diam-diam
    if (hp) {
      setSubmitted(true);
      return;
    }

    const parsed = gameRequestSchema.safeParse({
      gameName,
      platform: platform || undefined,
      notes: notes || undefined,
      requesterName,
      requesterWa,
    });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[String(issue.path[0])] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);

    const supabase = createClient();
    const { data, error } = await supabase.rpc("submit_game_request", {
      p_game_name: parsed.data.gameName,
      p_platform: parsed.data.platform ?? null,
      p_notes: parsed.data.notes ?? null,
      p_requester_name: parsed.data.requesterName,
      p_requester_wa: parsed.data.requesterWa,
    });

    setSubmitting(false);

    if (error || data?.error) {
      const isRateLimit = data?.error === "rate_limit_exceeded";
      setServerError(
        isRateLimit
          ? "Terlalu banyak request dari nomor ini. Coba lagi dalam 1 jam."
          : "Gagal mengirim request, coba lagi sebentar lagi."
      );
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    const waText = encodeURIComponent(
      `Halo Admin ${STORE_NAME}, saya sudah submit request game: *${gameName}*. Nama saya ${requesterName}.`
    );
    const waLink = `https://wa.me/${waAdminNumber}?text=${waText}`;
    return (
      <div className="text-center space-y-6">
        <div className="text-5xl">✅</div>
        <div>
          <h2 className="text-xl font-bold text-foreground mb-2">Request Terkirim!</h2>
          <p className="text-sm text-muted">
            Request game <span className="font-semibold text-foreground">{gameName}</span> sudah kami catat.
            Admin akan follow-up ke WhatsApp kamu.
          </p>
        </div>
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-accent text-accent-foreground font-bold text-sm px-6 py-3 rounded-xl hover:opacity-90 transition"
        >
          💬 Follow-up via WhatsApp
        </a>
        <p className="text-xs text-muted">
          Atau{" "}
          <button
            onClick={() => {
              setSubmitted(false);
              setGameName("");
              setPlatform("");
              setNotes("");
              setRequesterName("");
              setRequesterWa("");
              setHp("");
            }}
            className="text-accent hover:underline"
          >
            request game lain
          </button>
        </p>
      </div>
    );
  }

  const inputClass =
    "w-full bg-surface border border-border-subtle rounded-xl p-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent transition";
  const labelClass = "block text-xs font-bold text-muted uppercase mb-2";
  const errorClass = "text-red-500 text-xs mt-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-left">
      {/* Honeypot — disembunyikan dari user, bot cenderung mengisi */}
      <input
        type="text"
        name="website"
        value={hp}
        onChange={(e) => setHp(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ display: "none" }}
      />

      <div>
        <label className={labelClass}>Judul Game *</label>
        <input
          value={gameName}
          onChange={(e) => setGameName(e.target.value)}
          placeholder="Contoh: Grand Theft Auto VI"
          className={inputClass}
        />
        {errors.gameName && <p className={errorClass}>{errors.gameName}</p>}
      </div>

      <div>
        <label className={labelClass}>Platform</label>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className={inputClass}
        >
          <option value="">Pilih platform (opsional)</option>
          {PLATFORMS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Catatan Tambahan</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Versi tertentu, DLC, atau info lain yang kamu tahu..."
          rows={3}
          className={inputClass + " resize-none"}
        />
        {errors.notes && <p className={errorClass}>{errors.notes}</p>}
      </div>

      <div className="border-t border-border-subtle pt-5">
        <p className="text-xs text-muted mb-4">
          Data kontak kamu buat kami follow-up kalau game sudah tersedia.
        </p>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Nama Kamu *</label>
            <input
              value={requesterName}
              onChange={(e) => setRequesterName(e.target.value)}
              placeholder="Nama panggilan"
              className={inputClass}
            />
            {errors.requesterName && <p className={errorClass}>{errors.requesterName}</p>}
          </div>
          <div>
            <label className={labelClass}>Nomor WhatsApp *</label>
            <input
              value={requesterWa}
              onChange={(e) => setRequesterWa(e.target.value)}
              placeholder="0812xxxxxxxx"
              className={inputClass}
            />
            {errors.requesterWa && <p className={errorClass}>{errors.requesterWa}</p>}
          </div>
        </div>
      </div>

      {serverError && <p className="text-red-500 text-xs">{serverError}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-accent text-accent-foreground py-3 rounded-xl font-bold text-sm disabled:opacity-60 hover:opacity-90 transition"
      >
        {submitting ? "Mengirim..." : "Kirim Request"}
      </button>
    </form>
  );
}
