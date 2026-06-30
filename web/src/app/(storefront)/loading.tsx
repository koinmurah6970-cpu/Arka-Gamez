export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <div className="h-7 w-48 bg-gray-100 rounded animate-pulse" />
        <div className="h-4 w-24 bg-gray-100 rounded animate-pulse mt-2" />
      </div>
      <div className="h-[52px] max-w-4xl bg-gray-100 rounded-2xl animate-pulse mb-4" />
      <div className="flex gap-2 max-w-4xl mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 w-20 bg-gray-100 rounded-full animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mt-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="rounded-2xl overflow-hidden border border-gray-100">
            <div className="cover-container bg-gray-100 animate-pulse" />
            <div className="p-3.5 space-y-2">
              <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-2/3 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
