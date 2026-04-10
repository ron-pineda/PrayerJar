export default function ProfileLoading() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <div className="flex items-center gap-4 mb-10">
        <div className="h-16 w-16 rounded-full bg-muted animate-pulse flex-shrink-0" />
        <div className="space-y-2">
          <div className="h-6 w-36 bg-muted rounded animate-pulse" />
          <div className="h-4 w-48 bg-muted rounded animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-10">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    </main>
  );
}
