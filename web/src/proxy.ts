import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Protects /admin/* server-side (not just hiding UI) -- every request to an
// admin route must have a session AND profiles.role = 'admin', checked here
// before any page code runs. Also keeps the Supabase auth cookie fresh.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session cookie on every matched request so the navbar
  // (and any server component) can read auth state reliably.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Admin routes: require admin role (except the login page itself)
  if (pathname.startsWith("/admin")) {
    const isLoginRoute = pathname === "/admin/login";

    let isAdmin = false;
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      isAdmin = profile?.role === "admin";
    }

    if (!isLoginRoute && !isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      if (user) url.searchParams.set("error", "forbidden");
      return NextResponse.redirect(url);
    }

    if (isLoginRoute && isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
