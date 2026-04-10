import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <span className="text-6xl mb-6">🫙</span>
      <h1 className="text-4xl font-bold tracking-tight mb-2">Page not found</h1>
      <p className="text-muted-foreground mb-8 max-w-sm">
        This page doesn&apos;t exist or may have been moved. Let&apos;s get you back on track.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button render={<Link href="/" />}>Back to Home</Button>
        <Button variant="outline" render={<Link href="/pray" />}>Pray for Someone</Button>
      </div>
    </div>
  );
}
