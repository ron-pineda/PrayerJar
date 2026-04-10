export default function PraiseWallLoading() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8 text-center">
        <div className="h-9 w-48 bg-muted rounded-lg mx-auto mb-3 animate-pulse" />
        <div className="h-4 w-64 bg-muted rounded mx-auto animate-pulse" />
      </div>
      {/* Category filter row */}
      <div className="flex gap-2 flex-wrap mb-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-8 w-20 bg-muted rounded-full animate-pulse" />
        ))}
      </div>
      {/* Cards */}
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-muted rounded-xl h-28 animate-pulse" />
        ))}
      </div>
    </main>
  );
}
