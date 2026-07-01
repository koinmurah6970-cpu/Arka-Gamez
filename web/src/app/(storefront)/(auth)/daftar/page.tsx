"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { usernameToEmail } from "@/lib/auth-helpers";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (username.length < 3) {
      setError("Username minimal 3 karakter.");
      return;
    }
    if (/[^a-zA-Z0-9._-]/.test(username)) {
      setError("Username hanya boleh huruf, angka, titik, underscore, dan strip.");
      return;
    }
    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email: usernameToEmail(username),
      password,
      options: { data: { full_name: fullName, username } },
    });

    if (signUpError) {
      if (signUpError.message === "User already registered") {
        setError("Username ini sudah dipakai.");
      } else {
        setError(signUpError.message);
      }
      setSubmitting(false);
      return;
    }

    router.push("/login?registered=1");
  }

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-surface border border-border-subtle rounded-2xl shadow-sm p-6">
        <h1 className="text-xl font-extrabold text-foreground mb-1">Daftar Akun</h1>
        <p className="text-xs text-muted mb-6">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-accent font-semibold hover:underline">
            Masuk
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-2">
              Nama Lengkap
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-background border border-border-subtle rounded-xl p-3 text-sm text-foreground focus:outline-none focus:border-accent transition"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-2">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="contoh: rezagamer"
              className="w-full bg-background border border-border-subtle rounded-xl p-3 text-sm text-foreground focus:outline-none focus:border-accent transition"
            />
            <p className="text-xs text-muted mt-1">Huruf, angka, titik, underscore — minimal 3 karakter</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-muted uppercase mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full bg-background border border-border-subtle rounded-xl p-3 text-sm text-foreground focus:outline-none focus:border-accent transition"
            />
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-accent text-accent-foreground py-3 rounded-xl font-bold text-sm disabled:opacity-60"
          >
            {submitting ? "Memproses..." : "Daftar"}
          </button>
        </form>
      </div>
    </main>
  );
}
