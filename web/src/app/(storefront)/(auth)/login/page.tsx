"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { usernameToEmail } from "@/lib/auth-helpers";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60_000;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "1";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [failCount, setFailCount] = useState(0);
  const [lockUntil, setLockUntil] = useState(0);
  const [now, setNow] = useState(Date.now());

  // Countdown ticker — only runs while locked out
  useEffect(() => {
    if (lockUntil <= Date.now()) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [lockUntil]);

  const isLocked = now < lockUntil;
  const secsLeft = isLocked ? Math.ceil((lockUntil - now) / 1000) : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isLocked || submitting) return;

    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    });

    if (signInError) {
      const next = failCount + 1;
      if (next >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCKOUT_MS;
        setLockUntil(until);
        setNow(Date.now());
        setFailCount(0);
        setError(`Terlalu banyak percobaan. Tunggu 60 detik.`);
      } else {
        setFailCount(next);
        setError(`Username atau password salah. (${next}/${MAX_ATTEMPTS})`);
      }
      setSubmitting(false);
      return;
    }

    setFailCount(0);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role === "admin") {
        router.push("/admin");
        router.refresh();
        return;
      }
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-surface border border-border-subtle rounded-2xl shadow-sm p-6">
        <h1 className="text-xl font-extrabold text-foreground mb-1">Masuk</h1>
        <p className="text-xs text-muted mb-6">
          Belum punya akun?{" "}
          <Link href="/daftar" className="text-accent font-semibold hover:underline">
            Daftar
          </Link>
        </p>

        {justRegistered && (
          <p className="text-xs text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 mb-4">
            Akun berhasil dibuat! Silakan masuk.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-2">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="contoh: admin"
              disabled={isLocked}
              className="w-full bg-background border border-border-subtle rounded-xl p-3 text-sm text-foreground focus:outline-none focus:border-accent transition disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLocked}
              className="w-full bg-background border border-border-subtle rounded-xl p-3 text-sm text-foreground focus:outline-none focus:border-accent transition disabled:opacity-50"
            />
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <button
            type="submit"
            disabled={submitting || isLocked}
            className="w-full bg-accent text-accent-foreground py-3 rounded-xl font-bold text-sm disabled:opacity-60"
          >
            {isLocked
              ? `Tunggu ${secsLeft} detik...`
              : submitting
              ? "Memproses..."
              : "Masuk"}
          </button>
        </form>
      </div>
    </main>
  );
}
