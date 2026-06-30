"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (signUpError) {
      setError(signUpError.message === "User already registered"
        ? "Email ini sudah terdaftar."
        : signUpError.message);
      setSubmitting(false);
      return;
    }

    router.push("/login?registered=1");
  }

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
        <h1 className="text-xl font-extrabold text-gray-900 mb-1">Daftar Akun</h1>
        <p className="text-xs text-gray-400 mb-6">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-blue-600 font-semibold hover:underline">
            Masuk
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
              Nama Lengkap
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm disabled:opacity-60"
          >
            {submitting ? "Memproses..." : "Daftar"}
          </button>
        </form>
      </div>
    </main>
  );
}
