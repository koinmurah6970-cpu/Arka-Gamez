import Link from "next/link";

export function Pagination({
  currentPage,
  totalPages,
  searchParams,
  basePath = "/",
}: {
  currentPage: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
  basePath?: string;
}) {
  if (totalPages <= 1) return null;

  function hrefFor(page: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value && key !== "page") params.set(key, value);
    }
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1
  );

  return (
    <nav className="flex items-center justify-center gap-1.5 mt-10 mb-4 text-sm">
      <Link
        href={hrefFor(Math.max(1, currentPage - 1))}
        aria-disabled={currentPage === 1}
        className={`px-3 py-2 rounded-lg border border-border-subtle font-semibold ${
          currentPage === 1
            ? "pointer-events-none text-muted/50"
            : "text-muted hover:bg-border-subtle"
        }`}
      >
        ‹
      </Link>
      {pages.map((page, idx) => (
        <span key={page} className="flex items-center gap-1.5">
          {idx > 0 && pages[idx - 1] !== page - 1 && (
            <span className="px-1 text-muted">…</span>
          )}
          <Link
            href={hrefFor(page)}
            className={`px-3.5 py-2 rounded-lg font-semibold border ${
              page === currentPage
                ? "bg-accent text-accent-foreground border-accent"
                : "text-muted border-border-subtle hover:bg-border-subtle"
            }`}
          >
            {page}
          </Link>
        </span>
      ))}
      <Link
        href={hrefFor(Math.min(totalPages, currentPage + 1))}
        aria-disabled={currentPage === totalPages}
        className={`px-3 py-2 rounded-lg border border-border-subtle font-semibold ${
          currentPage === totalPages
            ? "pointer-events-none text-muted/50"
            : "text-muted hover:bg-border-subtle"
        }`}
      >
        ›
      </Link>
    </nav>
  );
}
