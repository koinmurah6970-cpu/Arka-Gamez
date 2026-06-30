import { createClient } from "@/lib/supabase/server";
import { NavbarClient } from "./navbar-client";

export async function Navbar() {
  let user: { email: string; role: string } | null = null;

  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (authUser) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authUser.id)
        .single();

      user = {
        email: authUser.email ?? "",
        role: profile?.role ?? "customer",
      };
    }
  } catch {
    // cookies() not available in some render contexts -- show logged-out state
  }

  return <NavbarClient user={user} />;
}
