export default function Loading() {
  return (
    <main className="container mx-auto px-4 py-8 max-w-xl">
      <div className="h-7 w-40 skeleton rounded mb-1" />
      <div className="h-4 w-64 skeleton rounded mb-6" />
      <div className="h-12 w-full skeleton rounded-xl" />
    </main>
  );
}
