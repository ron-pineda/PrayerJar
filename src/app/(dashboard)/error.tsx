'use client';

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm">
        <p className="text-4xl">🙏</p>
        <h1 className="text-xl font-bold">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">
          We hit an unexpected error loading this page. Your data is safe.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
          >
            Try again
          </button>
          <a
            href="/my-prayers"
            className="px-4 py-2 rounded-md border text-sm font-medium hover:bg-muted"
          >
            My Prayers
          </a>
        </div>
      </div>
    </div>
  );
}
