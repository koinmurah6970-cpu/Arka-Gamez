"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { usernameToEmail } from "@/lib/auth-helpers";

function ForbiddenNotice() {
  const searchParams = useSearchParams();
  const forbidden = searchParams.get("error") === "forbidden";

  if (!forbidden) return null;

  return (
    <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-3 mb-4">
      Akun ini gak punya akses admin.
    </p>
  );
}

export default function AdminLoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    });

    if (signInError) {
      setError("Username atau password salah.");
      setSubmitting(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        setError("Akun ini bukan admin.");
        await supabase.auth.signOut();
        setSubmitting(false);
        return;
      }
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="h-8 w-8 bg-[#0b0f19] rounded-lg flex items-center justify-center font-black text-white italic text-lg">
            G
          </div>
          <h1 className="text-lg font-extrabold tracking-tight text-gray-900">
            GAMOS <span className="text-gray-500 font-medium">ADMIN</span>
          </h1>
        </div>

        <Suspense fallback={null}>
          <ForbiddenNotice />
        </Suspense>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm disabled:opacity-60"
          >
            {submitting ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </div>
    </main>
  );
}
