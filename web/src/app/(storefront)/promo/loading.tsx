export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="h-7 w-32 skeleton rounded mb-1" />
      <div className="h-4 w-56 skeleton rounded mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border-subtle p-6">
            <div className="h-3 w-16 skeleton rounded mb-3" />
            <div className="h-5 w-3/4 skeleton rounded mb-2" />
            <div className="h-3 w-full skeleton rounded" />
          </div>
        ))}
      </div>
    </main>
  );
}
