export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="h-4 w-40 skeleton rounded mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-7">
          <div className="aspect-video skeleton rounded-2xl" />
        </div>
        <div className="md:col-span-5 space-y-4">
          <div className="h-40 skeleton rounded-2xl" />
          <div className="h-5 w-2/3 skeleton rounded" />
        </div>
      </div>
    </main>
  );
}
