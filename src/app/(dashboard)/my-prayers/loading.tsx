export default function MyPrayersLoading() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <div className="h-8 w-36 bg-muted rounded-lg mb-8 animate-pulse" />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-muted rounded-xl h-32 animate-pulse" />
        ))}
      </div>
    </main>
  );
}
