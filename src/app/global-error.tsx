'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
        <div className="text-center space-y-4 max-w-sm">
          <p className="text-4xl">🙏</p>
          <h1 className="text-xl font-bold">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">
            We hit an unexpected error. Your prayers are safe — this is just a display problem.
          </p>
          <button
            onClick={reset}
            className="mt-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
