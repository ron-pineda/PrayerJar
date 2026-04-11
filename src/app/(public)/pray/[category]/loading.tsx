import { Skeleton } from "@/components/ui/skeleton";

export default function PrayByCategoryLoading() {
  return (
    <main className="max-w-xl mx-auto px-4 py-12">
      <div className="rounded-xl border p-6 space-y-4">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
        <div className="pt-4 space-y-3 text-center">
          <Skeleton className="h-3 w-56 mx-auto" />
          <Skeleton className="h-3 w-44 mx-auto" />
          <Skeleton className="h-10 w-48 mx-auto rounded-md" />
        </div>
      </div>
    </main>
  );
}
