# Church Finder — Design Specification

**Date:** 2026-04-09
**Status:** Approved

## Overview

A church finder page that helps users discover churches near them. It serves as both a standalone tool accessible from the main navigation and a contextual next step surfaced after the "I want to know Jesus" salvation flow. The page uses Google Places API for comprehensive search coverage, layered with community-contributed recommendations and church-claimed listings for faith-specific enrichment.

## Architecture

**Approach:** Server-Side Google Places Search + Leaflet Map + Curation Layer

Search requests go through Next.js API routes, which call Google Places API server-side, merge results with curation data from Postgres, and return a unified response. The map uses Leaflet with free OpenStreetMap tiles for spatial context alongside result cards.

**Tech Stack Additions** (on top of Prayer Jar's existing stack):

| Concern | Tool | Rationale |
|---------|------|-----------|
| Church Search | Google Places API (New) | Comprehensive church data, server-side only |
| Geocoding | Google Geocoding API | Convert text input to coordinates |
| Map | Leaflet + OpenStreetMap | Free tiles, no API key, interactive |
| Pin Clustering | leaflet.markercluster | Handles dense urban results |

**System Flow:**

1. User enters location (GPS or text) + selects radius
2. Browser sends request to `/api/v1/churches/search`
3. API route calls `church.service.ts` which queries Google Places + Postgres in parallel
4. Service merges results — Google data enriched with community recommendations and claimed details
5. Response returns unified church list to browser
6. Cards render detail info, Leaflet map renders pins — both from the same data

**Key architectural rules:**
- Google API key stays server-side only — never exposed to the browser
- Follows the same service layer pattern as Prayer Jar (thin API routes, shared business logic)
- Curation data (recommendations, claims, saves) lives in Postgres alongside Prayer Jar tables

## Data Model

### SavedChurches

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| userId | uuid | FK to Users |
| googlePlaceId | text | Google Places ID for the church |
| name | text | Cached church name |
| address | text | Cached address |
| savedAt | timestamp | |

Unique constraint on (userId, googlePlaceId).

### ChurchClaims

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| googlePlaceId | text | Unique — one claim per church |
| claimedByUserId | uuid | FK to Users — the church rep |
| churchEmail | text | Verified contact email |
| denomination | text (nullable) | e.g., Baptist, Non-denominational |
| worshipStyle | text (nullable) | e.g., Contemporary, Traditional, Blended |
| serviceTimes | jsonb (nullable) | e.g., `[{"day": "Sunday", "time": "9:00 AM", "label": "Main Service"}]` |
| website | text (nullable) | Church website URL |
| description | text (nullable) | Short church description |
| verified | boolean | Default false, set true after email verification |
| createdAt | timestamp | |
| updatedAt | timestamp | |

### ChurchRecommendations

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| googlePlaceId | text | Which church |
| userId | uuid | FK to Users — who recommended |
| denomination | text (nullable) | User's understanding |
| worshipStyle | text (nullable) | User's understanding |
| note | text | Why they recommend this church (200 char max) |
| newcomerFriendly | boolean | Whether they'd recommend to newcomers |
| createdAt | timestamp | |

Unique constraint on (userId, googlePlaceId). Users can edit but not duplicate.

### ChurchSearchCache

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| lat | decimal | Search center latitude |
| lng | decimal | Search center longitude |
| radiusMiles | integer | Search radius |
| results | jsonb | Cached Google Places response |
| createdAt | timestamp | |
| expiresAt | timestamp | 24 hours from creation |

Searches within a small coordinate threshold of an existing cached search reuse the cached results.

**Key design decisions:**
- Google Place ID is the foreign key connecting everything — stable and unique per location
- Church name/address are cached on SavedChurches so the "My Churches" list doesn't require a Google API call
- Claims and recommendations are separate tables with separate flows
- Search cache keeps API costs down (24-hour TTL)

## API Endpoints

All under `/api/v1/churches/`:

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/search` | GET | No | Search churches by lat/lng + radius. Returns merged Google + curation data |
| `/geocode` | GET | No | Convert text input (city/zip) to coordinates via Google Geocoding API |
| `/:placeId` | GET | No | Get details for a single church — Google data + claim + recommendations |
| `/:placeId/save` | POST | Yes | Save a church to user's list |
| `/:placeId/save` | DELETE | Yes | Remove a saved church |
| `/:placeId/recommend` | POST | Yes | Submit a recommendation for a church |
| `/:placeId/claim` | POST | Yes | Start the claim process for a church |
| `/:placeId/claim/verify` | POST | Yes | Verify claim via email token |
| `/saved` | GET | Yes | Get user's saved churches list |

**Query parameters for `/search`:**
- `lat`, `lng` — coordinates (required)
- `radius` — 5, 10, 25, or 50 miles (default 25)
- `sort` — `distance` (default) or `verified`

## Page Layout — Search Results

**Desktop:** Split layout — church cards on the left (45%), Leaflet map on the right (55%).

**Search bar** at the top with:
- Text input field with placeholder "Enter city, zip code, or address..."
- "Use my location" link below the input (uses browser Geolocation API)
- Radius dropdown: 5, 10, 25 (default), 50 miles
- Sort dropdown: Distance (default), Community Verified First
- After first search, the search bar collapses into a compact bar to maximize result space

**Church cards** come in two variants:

**Enriched cards** (community data exists):
- Green left border (3px solid)
- Church name, distance, address
- Tags: denomination, worship style, service times
- "Newcomer Friendly" badge if flagged by recommenders
- Recommendation count: "3 recommend" with truncated first quote + "more" link
- Primary action: "Directions" button (blue, prominent)
- Secondary action: "Website" button (outline)
- Save heart icon (top right, logged-in users)

**Basic cards** (Google data only):
- Standard border, no green accent
- Church name, distance, address
- Primary action: "Directions" button
- Save heart icon
- No "add details" CTA on cards — that lives on the detail page only

**"Community Verified" badge** appears only on claimed+verified churches. Enriched cards (recommendations only, not claimed) get the green left border and recommendation count but no badge. This distinction ensures the badge signals authoritative church-provided data.

**Map:**
- Leaflet with OpenStreetMap tiles (free)
- Green pins for claimed+verified churches, teal pins for recommended-only, grey pins for Google-only
- Blue pulsing dot for user's location
- Numbered pins matching card order
- Clicking a pin highlights the corresponding card and vice versa
- Pin tooltip on hover: church name + distance
- Pin clustering via leaflet.markercluster for dense areas
- Legend in top-right corner

**Mobile:** Cards and map are separate tabs with a List/Map toggle at the top. List is default. Cards are full-width, compact, with a full-width "Get Directions" button.

## Church Detail Page

Accessed by clicking a church card (not the Directions button). Route: `/find-a-church/[placeId]`.

**Header:**
- Gradient background (no dependency on Google Photos — many churches have none or poor quality)
- Church name, address, tags (denomination, worship style, verified badge)
- Save and Share buttons (top right)
- Two primary action buttons: "Get Directions" and "Visit Website"

**Service Times** (if claimed — most prominent section):
- Dedicated section near the top
- Day/time cards in a horizontal row
- Contextual badge: "This Sunday at 9:00 AM"

**About** (if claimed):
- Church's self-written description

**Claim Banner:**
- Warm amber-toned banner below the about section
- "Are you a leader at this church? Claim this listing →"
- Visible but secondary to user-facing content

**Community Recommendations:**
- Styled as testimonial quote cards (not reviews/ratings)
- Green left border, italic text, first name + date
- "Share your recommendation →" prompt at bottom (logged-in users)

**Google Info Footer:**
- Phone, today's hours, data source attribution

**For basic churches** (unclaimed, no recommendations):
- Same layout minus service times, about, and recommendations sections
- "Be the first to recommend this church" prompt
- Claim banner still visible

## Recommend Flow

1. User clicks "Share your recommendation" on a church detail page (must be logged in)
2. Inline form expands with guided prompts:
   - "What's the worship style like?" — dropdown: Contemporary, Traditional, Blended, Other
   - "What do you love about this church?" — text field, 200 char max
   - "Would you recommend it to newcomers?" — yes/no toggle
3. Submit → AI moderation (same pipeline as Prayer Jar) → published if safe
4. Optimistic UI: recommendation appears immediately, pulled if flagged
5. Denomination pre-fills if other recommenders already tagged it (user can change)
6. One recommendation per user per church, but editable

**"Newcomer Friendly"** consensus (2+ recommenders say yes) becomes a visible badge on the church's card in search results.

## Claim Flow

1. Church rep clicks "Claim this listing" on the detail page (must be logged in)
2. Form: name, role at church, email address (any email accepted — no domain requirement)
3. Verification email sent with a token link (48-hour expiry)
4. "Claim pending" state shown: "We've sent a verification email to j***@gmail.com"
5. Rep clicks link → verified → can edit: denomination, worship style, service times, website, description
6. Church gets "Community Verified" badge
7. Initial claimer can invite additional admins (handles staff turnover)
8. Suspicious claims (e.g., claiming many churches) flagged for manual review

## Salvation Page Integration

A warm "Find a Community" card on the salvation response page, positioned below the main salvation content (below the fold).

**Design:**
- Soft gradient border (green-to-blue, low opacity)
- Church icon
- Heading: "Find a Community"
- Copy: "One of the best next steps in your faith journey is finding a church where you can grow, ask questions, and be encouraged. When you're ready:"
- Green CTA button: "Find a Church Near You →"
- Reassurance note: "No pressure — you can always find this in the menu."

**Design principles:**
- Below the fold — doesn't compete with the salvation moment
- Conversational copy — friend's suggestion, not a checklist
- No inline search box — too much UI for this moment
- The church finder is also accessible via main navigation ("Find a Church" nav item)

## Edge Cases & Error Handling

### Search

| Scenario | Handling |
|----------|----------|
| No results within radius | "No churches found within X miles." + one-click expand to 50 miles. Suggest nearest larger city if available. |
| Google API error/rate limit | Show cached results if available. Otherwise: "We're having trouble searching right now. Please try again in a moment." |
| GPS permission denied | Text input remains functional. "Use my location" greys out with tooltip explaining how to search by text instead. |
| Geocoding fails | "We couldn't find that location. Try a zip code or a more specific address." |
| Very dense results (50+) | Paginate cards (12 per page), map clusters nearby pins via leaflet.markercluster. |

### Curation

| Scenario | Handling |
|----------|----------|
| Recommendation flagged | Held for review, user sees "Your recommendation is being reviewed." |
| Duplicate claim | "This church has already been claimed. If you believe this is an error, contact us." |
| Claim email expires | 48-hour expiry. "Your verification link has expired. Request a new one." |
| Church removed from Google | Curation data persists. Card notes: "This listing may be outdated — verify with the church directly." |
| Recommend without account | Prompt to sign in. Preserves the church context after login redirect. |

### Performance

- **Search cache (24h TTL)** prevents redundant Google API calls for the same area
- **Debounce text input** — geocode after 300ms of no typing
- **Lazy-load the map** — render cards first for faster initial paint, load Leaflet after
- **Skeleton loaders** on cards during search (not spinners)
- **Pin clustering** from day one (leaflet.markercluster)
- **Saved churches render from local cache** when offline (logged-in users)

## Project Structure Additions

```
src/
  app/
    (public)/
      find-a-church/
        page.tsx                # Search page with cards + map
        [placeId]/
          page.tsx              # Church detail page
    api/
      v1/
        churches/
          search/route.ts       # Search endpoint
          geocode/route.ts      # Geocoding endpoint
          [placeId]/
            route.ts            # Church detail endpoint
            save/route.ts       # Save/unsave endpoint
            recommend/route.ts  # Recommendation endpoint
            claim/route.ts      # Claim initiation endpoint
            claim/
              verify/route.ts   # Claim verification endpoint
          saved/route.ts        # User's saved churches list
  services/
    church.service.ts           # Search, merge, cache, claim, recommend logic
  db/
    schema.ts                   # Add new tables to existing schema
    migrations/
  components/
    church/
      ChurchCard.tsx            # Card component (enriched + basic variants)
      ChurchMap.tsx             # Leaflet map wrapper
      ChurchDetail.tsx          # Detail page content
      SearchBar.tsx             # Location input + radius + sort
      RecommendForm.tsx         # Recommendation submission form
      ClaimForm.tsx             # Claim submission form
```

## Non-Functional Requirements

- **Mobile-responsive**: List/Map tab toggle on mobile, full-width cards, compact search bar
- **SEO**: Server-rendered search results page, individual church detail pages are indexable
- **Privacy**: GPS data is never stored — only used for the search query
- **Accessibility**: Semantic HTML, keyboard-navigable map controls, screen reader labels on pins
- **Cost**: Google Places API ~$32/1,000 searches, mitigated by 24-hour search cache. Leaflet/OSM tiles are free.
- **Moderation**: Recommendations go through the same AI moderation pipeline as Prayer Jar
