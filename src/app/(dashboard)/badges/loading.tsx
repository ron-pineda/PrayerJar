export default function BadgesLoading() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <div className="h-8 w-24 bg-muted rounded-lg mb-8 animate-pulse" />
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="h-14 w-14 rounded-full bg-muted animate-pulse" />
            <div className="h-3 w-16 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    </main>
  );
}
