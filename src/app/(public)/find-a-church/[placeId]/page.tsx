import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getChurchDetail } from "@/services/church.service";
import { RecommendForm } from "@/components/church/recommend-form";
import { ClaimForm } from "@/components/church/claim-form";
import { Heart, ExternalLink, MapPin, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function ChurchDetailPage({
  params,
}: {
  params: Promise<{ placeId: string }>;
}) {
  const { placeId } = await params;
  const session = await auth();
  const church = await getChurchDetail(placeId, session?.user?.id ?? null);
  if (!church) notFound();

  const isVerified = church.claim?.verified === true;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(church.address)}&destination_place_id=${church.placeId}`;

  // Derive "This Sunday" service time
  const today = new Date();
  const daysUntilSunday = (7 - today.getDay()) % 7 || 7;
  const nextSunday = new Date(today);
  nextSunday.setDate(today.getDate() + daysUntilSunday);
  const sundayTimes = church.claim?.serviceTimes?.filter((t) => t.day === "Sunday") ?? [];

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-950 to-slate-800 px-6 py-6">
        <a href="/find-a-church" className="text-slate-400 text-sm hover:text-slate-300 block mb-4">
          ← Back to results
        </a>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-slate-100 text-2xl font-bold">{church.name}</h1>
            <p className="text-slate-400 text-sm mt-1">{church.address}</p>
            <div className="flex gap-2 flex-wrap mt-3">
              {isVerified && (
                <span className="bg-emerald-950 text-emerald-400 text-[11px] px-2 py-1 rounded border border-emerald-900">
                  ✓ Community Verified
                </span>
              )}
              {church.claim?.denomination && (
                <span className="bg-blue-950 text-blue-300 text-[11px] px-2 py-1 rounded">
                  {church.claim.denomination}
                </span>
              )}
              {church.claim?.worshipStyle && (
                <span className="bg-blue-950 text-blue-300 text-[11px] px-2 py-1 rounded">
                  {church.claim.worshipStyle}
                </span>
              )}
              {church.newcomerFriendly && (
                <span className="bg-amber-950 text-amber-400 text-[11px] px-2 py-1 rounded">
                  👋 Newcomer Friendly
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-3 ml-4">
            <button aria-label="Save church" className="text-slate-400 hover:text-rose-400">
              <Heart className={`h-5 w-5 ${church.savedByUser ? "fill-rose-500 text-rose-500" : ""}`} />
            </button>
            <button aria-label="Share church" className="text-slate-400 hover:text-slate-300">
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              <MapPin className="h-4 w-4 mr-1.5" /> Get Directions
            </Button>
          </a>
          {church.website && (
            <a href={church.website} target="_blank" rel="noopener noreferrer" className="flex-1">
              <Button variant="outline" className="w-full border-slate-600 text-slate-300">
                Visit Website <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* Service Times */}
      {church.claim?.serviceTimes && church.claim.serviceTimes.length > 0 && (
        <div className="border-b border-slate-800 px-6 py-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-slate-100 font-semibold">Service Times</h2>
            {sundayTimes[0] && (
              <span className="bg-blue-950 text-blue-300 text-xs px-3 py-1 rounded-full border border-blue-900">
                This Sunday at {sundayTimes[0].time}
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {church.claim.serviceTimes.map((s, i) => (
              <div key={i} className="bg-slate-800 rounded-lg p-3 text-center">
                <p className="text-slate-500 text-[10px] uppercase tracking-wider">{s.day}</p>
                <p className="text-slate-100 font-semibold mt-1">{s.time}</p>
                <p className="text-slate-500 text-[10px] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* About */}
      {church.claim?.description && (
        <div className="border-b border-slate-800 px-6 py-5">
          <h2 className="text-slate-100 font-semibold mb-2">About</h2>
          <p className="text-slate-300 text-sm leading-relaxed">{church.claim.description}</p>
        </div>
      )}

      {/* Claim Banner */}
      {!isVerified && (
        <div className="border-b border-slate-800 px-6 py-3 bg-amber-950/20">
          <details className="group">
            <summary className="text-amber-400 text-sm cursor-pointer list-none">
              ⛪ Are you a leader at this church?{" "}
              <span className="font-semibold">Claim this listing →</span>
            </summary>
            {session?.user ? (
              <div className="mt-3">
                <ClaimForm placeId={church.placeId} />
              </div>
            ) : (
              <p className="text-slate-400 text-sm mt-2">
                <a href="/sign-in" className="text-blue-400 hover:underline">Sign in</a> to claim this listing.
              </p>
            )}
          </details>
        </div>
      )}

      {/* Community Recommendations */}
      <div className="px-6 py-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-slate-100 font-semibold">Community Recommendations</h2>
          <span className="text-emerald-400 text-sm">👥 {church.recommendations.length} recommend</span>
        </div>

        {church.recommendations.length === 0 ? (
          <p className="text-slate-500 text-sm">No recommendations yet.</p>
        ) : (
          <div className="space-y-3 mb-4">
            {church.recommendations.map((rec) => (
              <div key={rec.id} className="bg-slate-800 rounded-xl p-4 border-l-[3px] border-l-emerald-500">
                <p className="text-slate-300 text-sm italic leading-relaxed">"{rec.note}"</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-slate-500 text-xs">— {rec.userId.slice(0, 8)}</span>
                  <span className="text-slate-500 text-xs">{new Date(rec.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {session?.user ? (
          <div className="bg-slate-800 rounded-xl p-4 border border-dashed border-slate-700">
            <p className="text-slate-400 text-sm mb-3">Been to this church? Share your recommendation.</p>
            <RecommendForm
              placeId={church.placeId}
              existingDenomination={church.recommendations[0]?.denomination}
            />
          </div>
        ) : (
          <div className="bg-slate-800 rounded-xl p-4 border border-dashed border-slate-700 text-center">
            <p className="text-slate-400 text-sm">
              <a href="/sign-in" className="text-blue-400 hover:underline">Sign in</a> to share your recommendation.
            </p>
          </div>
        )}
      </div>

      {/* Google info footer */}
      {(church.phone || church.openNow !== undefined) && (
        <div className="border-t border-slate-800 px-6 py-4 bg-slate-800/50">
          <div className="flex gap-6 text-sm">
            {church.phone && (
              <div>
                <p className="text-slate-500 text-xs">Phone</p>
                <p className="text-slate-300">{church.phone}</p>
              </div>
            )}
            {church.openNow !== undefined && (
              <div>
                <p className="text-slate-500 text-xs">Office hours</p>
                <p className={church.openNow ? "text-emerald-400" : "text-slate-400"}>
                  {church.openNow ? "Open now" : "Closed"}
                </p>
              </div>
            )}
            <div>
              <p className="text-slate-500 text-xs">Source</p>
              <p className="text-slate-500 text-xs">Google Places</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
