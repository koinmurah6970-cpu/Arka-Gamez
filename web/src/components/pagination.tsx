import Link from "next/link";

export function Pagination({
  currentPage,
  totalPages,
  searchParams,
}: {
  currentPage: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  function hrefFor(page: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value && key !== "page") params.set(key, value);
    }
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return qs ? `/?${qs}` : "/";
  }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1
  );

  return (
    <nav className="flex items-center justify-center gap-1.5 mt-10 mb-4 text-sm">
      <Link
        href={hrefFor(Math.max(1, currentPage - 1))}
        aria-disabled={currentPage === 1}
        className={`px-3 py-2 rounded-lg border border-gray-200 font-semibold ${
          currentPage === 1
            ? "pointer-events-none text-gray-300"
            : "text-gray-600 hover:bg-gray-50"
        }`}
      >
        ‹
      </Link>
      {pages.map((page, idx) => (
        <span key={page} className="flex items-center gap-1.5">
          {idx > 0 && pages[idx - 1] !== page - 1 && (
            <span className="px-1 text-gray-400">…</span>
          )}
          <Link
            href={hrefFor(page)}
            className={`px-3.5 py-2 rounded-lg font-semibold border ${
              page === currentPage
                ? "bg-[#0b0f19] text-white border-[#0b0f19]"
                : "text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {page}
          </Link>
        </span>
      ))}
      <Link
        href={hrefFor(Math.min(totalPages, currentPage + 1))}
        aria-disabled={currentPage === totalPages}
        className={`px-3 py-2 rounded-lg border border-gray-200 font-semibold ${
          currentPage === totalPages
            ? "pointer-events-none text-gray-300"
            : "text-gray-600 hover:bg-gray-50"
        }`}
      >
        ›
      </Link>
    </nav>
  );
}
