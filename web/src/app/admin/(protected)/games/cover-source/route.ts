import { NextResponse, type NextRequest } from "next/server";

// Relays an external image server-side so the crop tool's <canvas> can read
// its pixels -- SteamGridDB/RAWG's CDNs don't send CORS headers, so loading
// them cross-origin directly into a canvas would taint it and block export.
// Gated by proxy.ts's /admin matcher, same as every other admin route.
const ALLOWED_HOSTS = [/(^|\.)steamgriddb\.com$/, /(^|\.)rawg\.io$/];

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "missing url" }, { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "invalid url" }, { status: 400 });
  }
  if (!ALLOWED_HOSTS.some((re) => re.test(parsed.hostname))) {
    return NextResponse.json({ error: "host not allowed" }, { status: 400 });
  }

  const upstream = await fetch(parsed.toString());
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "fetch failed" }, { status: 502 });
  }

  return new NextResponse(upstream.body, {
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "image/jpeg",
      "cache-control": "private, max-age=3600",
    },
  });
}
