import { Skeleton } from "@/components/ui/skeleton";

export default function PraiseWallLoading() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8 text-center">
        <Skeleton className="h-9 w-48 mx-auto mb-3" />
        <Skeleton className="h-4 w-64 mx-auto" />
      </div>
      <div className="border-t border-b py-4 mb-8 max-w-md mx-auto text-center space-y-2">
        <Skeleton className="h-3 w-72 mx-auto" />
        <Skeleton className="h-3 w-48 mx-auto" />
      </div>
      <div className="flex gap-2 flex-wrap mb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-4 space-y-3">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    </main>
  );
}
