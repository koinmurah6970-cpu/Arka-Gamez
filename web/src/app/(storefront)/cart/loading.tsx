export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="h-7 w-48 skeleton rounded mb-6" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 w-full skeleton rounded-xl" />
        ))}
      </div>
    </main>
  );
}
