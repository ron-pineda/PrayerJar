export default function SavedChurchesLoading() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-2">
          <div className="h-8 w-44 bg-muted rounded-lg animate-pulse" />
          <div className="h-4 w-56 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-9 w-24 bg-muted rounded-lg animate-pulse" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    </main>
  );
}
