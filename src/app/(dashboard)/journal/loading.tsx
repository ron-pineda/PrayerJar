export default function JournalLoading() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <div className="h-8 w-40 bg-muted rounded-lg mb-8 animate-pulse" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-muted rounded-xl h-24 animate-pulse" />
        ))}
      </div>
    </main>
  );
}
