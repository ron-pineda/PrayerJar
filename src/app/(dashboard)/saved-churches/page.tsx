import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSavedChurches } from "@/services/church.service";
import { MapPin, ExternalLink, Bookmark } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Saved Churches | The Prayer Jar" };

export default async function SavedChurchesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const saved = await getSavedChurches(session.user.id);

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Saved Churches</h1>
          <p className="text-muted-foreground">Churches you&apos;ve bookmarked for later.</p>
        </div>
        <Button variant="outline" render={<Link href="/find-a-church" />}>
          Find more churches
        </Button>
      </div>

      {saved.length === 0 ? (
        <EmptyState
          icon={<Bookmark size={24} />}
          title="No saved churches yet"
          description="Save churches from the Church Finder to keep track of ones you want to visit."
          action={{ label: "Find a church", href: "/find-a-church" }}
        />
      ) : (
        <div className="space-y-3">
          {saved.map((church) => (
            <div
              key={church.id}
              className="flex items-start justify-between gap-4 p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <Link
                  href={`/find-a-church/${church.googlePlaceId}`}
                  className="font-semibold hover:underline underline-offset-4 truncate block"
                >
                  {church.name}
                </Link>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  {church.address}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Saved {new Date(church.savedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Link
                  href={`/find-a-church/${church.googlePlaceId}`}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="View church details"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
