export default function NotificationsLoading() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <div className="h-8 w-36 bg-muted rounded-lg mb-8 animate-pulse" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-3 items-start p-4 bg-muted rounded-xl animate-pulse">
            <div className="h-8 w-8 rounded-full bg-muted-foreground/20 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-3/4 bg-muted-foreground/20 rounded" />
              <div className="h-3 w-1/2 bg-muted-foreground/20 rounded" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
