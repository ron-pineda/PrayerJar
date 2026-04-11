import { Skeleton } from "@/components/ui/skeleton";

export default function JournalLoading() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <Skeleton className="h-8 w-44 mb-2" />
      <Skeleton className="h-4 w-52 mb-8" />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    </main>
  );
}
