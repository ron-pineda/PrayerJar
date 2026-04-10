export default function BrowseLoading() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <div className="h-9 w-48 bg-muted rounded-lg mb-2 animate-pulse" />
        <div className="h-4 w-72 bg-muted rounded animate-pulse" />
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-10 bg-muted rounded-lg animate-pulse" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-7 w-20 bg-muted rounded-full animate-pulse" />
          ))}
        </div>
      </div>
      <div className="space-y-3 mt-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    </main>
  );
}
