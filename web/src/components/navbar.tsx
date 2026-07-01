import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { emailToUsername } from "@/lib/auth-helpers";
import { NavbarClient } from "./navbar-client";

export async function Navbar() {
  let user: { displayName: string; role: string } | null = null;

  try {
    const authUser = await getCurrentUser();

    if (authUser) {
      const supabase = await createClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", authUser.id)
        .single();

      const username = authUser.user_metadata?.username as string | undefined;
      const displayName =
        profile?.full_name || username || emailToUsername(authUser.email ?? "");

      user = {
        displayName,
        role: profile?.role ?? "customer",
      };
    }
  } catch {
    // cookies() not available in some render contexts -- show logged-out state
  }

  return <NavbarClient user={user} />;
}
