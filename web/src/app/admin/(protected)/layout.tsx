import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminLogoutButton } from "@/components/admin/logout-button";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/games", label: "Game", icon: "🎮" },
  { href: "/admin/pesanan", label: "Pesanan", icon: "🧾" },
  { href: "/admin/kategori", label: "Kategori", icon: "🏷️" },
  { href: "/admin/pengaturan", label: "Pengaturan", icon: "⚙️" },
];

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // middleware already gates this, but pages should never trust that alone --
  // re-check here so direct server-side rendering is safe by itself too.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/admin/login?error=forbidden");

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-60 bg-[#0b0f19] text-white flex flex-col">
        <div className="p-5 flex items-center gap-2 border-b border-white/10">
          <div className="h-8 w-8 bg-white/10 rounded-lg flex items-center justify-center font-black italic text-lg">
            G
          </div>
          <span className="font-extrabold tracking-tight">GAMOS ADMIN</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition"
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <p className="px-3 text-xs text-gray-400 mb-2 truncate">
            {profile?.full_name || user.email}
          </p>
          <AdminLogoutButton />
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
