import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users, prayers, prayerInteractions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getBadgesForUser } from "@/services/badge.service";
import { BadgeDisplay } from "@/components/badge-display";
import Link from "next/link";
import { User } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Profile | The Prayer Jar" };

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const [user, prayerCount, interactionCount, badges] = await Promise.all([
    db.select().from(users).where(eq(users.id, session.user.id)).then((r) => r[0]),
    db.select({ count: sql<number>`count(*)` }).from(prayers).where(eq(prayers.authorId, session.user.id)).then((r) => Number(r[0]?.count ?? 0)),
    db.select({ count: sql<number>`count(*)` }).from(prayerInteractions).where(eq(prayerInteractions.userId, session.user.id)).then((r) => Number(r[0]?.count ?? 0)),
    getBadgesForUser(session.user.id),
  ]);

  if (!user) redirect("/sign-in");

  const recentBadges = badges.slice(0, 4);

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt={user.name ?? 'Profile'} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <User className="h-7 w-7 text-primary" aria-hidden="true" />
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{user.name ?? "Intercessor"}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Member since {new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="text-center p-4 rounded-xl border bg-card">
          <p className="text-2xl font-bold text-primary">{prayerCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Prayers submitted</p>
        </div>
        <div className="text-center p-4 rounded-xl border bg-card">
          <p className="text-2xl font-bold text-primary">{interactionCount}</p>
          <p className="text-xs text-muted-foreground mt-1">Times prayed for others</p>
        </div>
        <div className="text-center p-4 rounded-xl border bg-card">
          <p className="text-2xl font-bold text-primary">{user.currentStreak}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Day streak
          </p>
        </div>
      </div>

      {/* Badges preview */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Badges</h2>
          <Link href="/badges" className="text-sm text-primary hover:underline underline-offset-4">
            {badges.length > 0 ? `View all (${badges.length})` : "View all"}
          </Link>
        </div>
        {badges.length > 0 ? (
          <BadgeDisplay earnedBadges={recentBadges} />
        ) : (
          <p className="text-sm text-muted-foreground">
            None yet — they arrive quietly as you pray.
          </p>
        )}
      </section>

    </main>
  );
}
