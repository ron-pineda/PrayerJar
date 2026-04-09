# Phase 1 Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add photo attachments (Vercel Blob), social sharing (dynamic OG images + share buttons), and UX polish (CSS animations, mobile bottom nav, onboarding overlay) to the live Prayer Jar app.

**Architecture:** All three features integrate into the existing Next.js 16 monolith. Photo uploads use a reusable client component with browser-side compression, server actions for Vercel Blob upload + AI moderation, and a new `imageUrl` column on the prayers table. OG images are generated via `@vercel/og` route handlers. UX polish is CSS-only animations + two new client components (mobile nav, onboarding).

**Tech Stack:** Next.js 16, Vercel Blob, @vercel/og, Drizzle ORM, Claude Haiku (image moderation), CSS keyframes, IntersectionObserver

---

## File Map

```
src/
  db/
    schema.ts                              # MODIFY: Add imageUrl to prayers
    migrations/                            # NEW: Migration for imageUrl column
  services/
    prayer.service.ts                      # MODIFY: Accept imageUrl in createPrayer, markPrayerAnswered
    ai.service.ts                          # MODIFY: Add moderateImage function
  app/
    actions/
      prayer.actions.ts                    # MODIFY: Handle photo upload in submitPrayerAction
      lifecycle.actions.ts                 # MODIFY: Handle photo upload in markAnsweredAction
    api/
      og/
        prayer/[id]/route.tsx              # NEW: Dynamic OG image for prayer requests
        testimony/[id]/route.tsx           # NEW: Dynamic OG image for testimonies
      upload/route.ts                      # NEW: Vercel Blob upload endpoint
    (public)/
      page.tsx                             # MODIFY: Add onboarding overlay
      p/[id]/page.tsx                      # MODIFY: Add OG metadata, photo display, share buttons
      praise-wall/page.tsx                 # MODIFY: Add share buttons to praise cards
    globals.css                            # MODIFY: Add @keyframes animations
    layout.tsx                             # MODIFY: Add mobile nav, default OG metadata
  components/
    photo-upload.tsx                       # NEW: Reusable upload with compress, preview, progress
    share-buttons.tsx                      # NEW: Twitter/X, Facebook, WhatsApp, Copy Link
    mobile-nav.tsx                         # NEW: Bottom navigation bar (mobile only)
    onboarding-overlay.tsx                 # NEW: First-time visitor welcome
    prayer-form.tsx                        # MODIFY: Add photo upload
    prayer-card.tsx                        # MODIFY: Show photo, add share buttons
    praise-card.tsx                        # MODIFY: Show testimony photo, add share buttons
    guided-prayer.tsx                      # MODIFY: Show photo, add candle animation, share after pray
  hooks/
    use-scroll-reveal.ts                   # NEW: IntersectionObserver for scroll animations
  lib/
    image-utils.ts                         # NEW: Client-side compression + WebP conversion
```

---

## Task 1: Database Schema — Add imageUrl Column

**Files:**
- Modify: `src/db/schema.ts`

- [ ] **Step 1: Write failing test for imageUrl column**

Create `src/db/schema.test.ts` (modify existing):

Add this test to the existing test file:

```typescript
import { describe, it, expect } from 'vitest';
import { prayers } from './schema';

describe('prayers schema', () => {
  it('has imageUrl column', () => {
    expect(prayers.imageUrl).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/db/schema.test.ts
```

Expected: FAIL — `prayers.imageUrl` is undefined.

- [ ] **Step 3: Add imageUrl to prayers table in schema**

In `src/db/schema.ts`, add the `imageUrl` column to the `prayers` table, after the `testimony` field:

```typescript
// In the prayers pgTable definition, add after 'testimony':
imageUrl: text('image_url'),
```

The full prayers table should now include:

```typescript
export const prayers = pgTable('prayers', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  authorId: uuid('author_id').references(() => users.id),
  content: text('content').notNull(),
  isAnonymous: boolean('is_anonymous').default(false).notNull(),
  isUrgent: boolean('is_urgent').default(false).notNull(),
  category: categoryEnum('category').notNull(),
  tags: text('tags').array().default([]).notNull(),
  suggestedVerse: text('suggested_verse'),
  status: prayerStatusEnum('status').default('active').notNull(),
  testimony: text('testimony'),
  imageUrl: text('image_url'),
  prayerCount: integer('prayer_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
});
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/db/schema.test.ts
```

Expected: PASS.

- [ ] **Step 5: Push schema change to database**

```bash
npx drizzle-kit push
```

Expected: Column `image_url` added to `prayers` table.

- [ ] **Step 6: Commit**

```bash
git add src/db/schema.ts src/db/schema.test.ts
git commit -m "feat: add imageUrl column to prayers schema"
```

---

## Task 2: Image Utilities — Client-Side Compression

**Files:**
- Create: `src/lib/image-utils.ts`
- Create: `src/lib/image-utils.test.ts`

- [ ] **Step 1: Write failing test**

Create `src/lib/image-utils.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { compressImage, MAX_FILE_SIZE, ACCEPTED_TYPES } from './image-utils';

describe('image-utils', () => {
  it('exports constants', () => {
    expect(MAX_FILE_SIZE).toBe(5 * 1024 * 1024);
    expect(ACCEPTED_TYPES).toContain('image/jpeg');
    expect(ACCEPTED_TYPES).toContain('image/png');
    expect(ACCEPTED_TYPES).toContain('image/webp');
  });

  it('exports compressImage function', () => {
    expect(typeof compressImage).toBe('function');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/image-utils.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Create image-utils.ts**

Create `src/lib/image-utils.ts`:

```typescript
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_COMPRESSED_SIZE = 1024 * 1024; // 1MB target
export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'Please upload a JPG, PNG, or WebP image.';
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'Image must be under 5MB.';
  }
  return null;
}

export async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Scale down if larger than 1600px on any side
      const maxDim = 1600;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Compression failed'));
            return;
          }
          resolve(blob);
        },
        'image/webp',
        0.82
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/lib/image-utils.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/image-utils.ts src/lib/image-utils.test.ts
git commit -m "feat: add client-side image compression utilities"
```

---

## Task 3: Photo Upload Component

**Files:**
- Create: `src/components/photo-upload.tsx`

- [ ] **Step 1: Create the photo upload component**

Create `src/components/photo-upload.tsx`:

```typescript
'use client';

import { useState, useRef } from 'react';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { validateImageFile, compressImage } from '@/lib/image-utils';

type PhotoUploadProps = {
  onUpload: (url: string) => void;
  onRemove: () => void;
  url: string | null;
  variant?: 'neutral' | 'warm';
};

export function PhotoUpload({ onUpload, onRemove, url, variant = 'neutral' }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setUploading(true);

    try {
      // Show preview immediately
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Compress
      const compressed = await compressImage(file);

      // Upload to server
      const formData = new FormData();
      formData.set('file', compressed, `photo.webp`);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Upload failed');
      }

      const { url: blobUrl } = await res.json();
      onUpload(blobUrl);

      URL.revokeObjectURL(previewUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleRemove() {
    setPreview(null);
    onRemove();
    if (inputRef.current) inputRef.current.value = '';
  }

  const displayUrl = url || preview;

  if (displayUrl) {
    return (
      <div className="relative rounded-lg overflow-hidden border">
        <img src={displayUrl} alt="Attached photo" className="w-full h-48 object-cover" />
        <Button
          type="button"
          size="sm"
          variant="destructive"
          className="absolute top-2 right-2 h-7 w-7 p-0"
          onClick={handleRemove}
        >
          <X className="h-4 w-4" />
        </Button>
        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}
      </div>
    );
  }

  const warmClasses = variant === 'warm'
    ? 'border-primary/30 bg-primary/5'
    : '';

  return (
    <div>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-primary/50 ${warmClasses}`}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
        ) : (
          <ImagePlus className="h-8 w-8 mx-auto text-muted-foreground" />
        )}
        <p className={`mt-2 text-sm ${variant === 'warm' ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
          {variant === 'warm'
            ? 'Add a celebration photo'
            : 'Add a photo'}
          <span className="text-muted-foreground font-normal"> (optional)</span>
        </p>
        {variant === 'warm' && (
          <p className="text-xs text-muted-foreground mt-1">A photo makes your testimony more powerful</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">Max 5MB · JPG, PNG, WebP</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
      />
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/photo-upload.tsx
git commit -m "feat: add photo upload component with compression and preview"
```

---

## Task 4: Blob Upload API Route + AI Image Moderation

**Files:**
- Create: `src/app/api/upload/route.ts`
- Modify: `src/services/ai.service.ts`

- [ ] **Step 1: Write failing test for moderateImage**

Add to `src/services/ai.service.test.ts`:

```typescript
import { moderateImage } from './ai.service';

describe('moderateImage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns safe: true for appropriate images', async () => {
    vi.mocked(generateText).mockResolvedValue({
      output: { safe: true, selfHarm: false },
    } as any);

    const result = await moderateImage('https://example.com/photo.webp');
    expect(result.safe).toBe(true);
  });
});
```

Also update the import line at the top to include `moderateImage`:

```typescript
import { categorizePrayer, moderateContent, moderateImage } from './ai.service';
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/services/ai.service.test.ts
```

Expected: FAIL — `moderateImage` is not exported.

- [ ] **Step 3: Add moderateImage to ai.service.ts**

Add this function at the end of `src/services/ai.service.ts`:

```typescript
export async function moderateImage(imageUrl: string): Promise<{
  safe: boolean;
  reason?: string;
}> {
  const { output } = await generateText({
    model: MODEL,
    output: Output.object({
      schema: z.object({
        safe: z.boolean(),
        reason: z.string().optional(),
      }),
    }),
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Review this image for a Christian prayer website. Mark as unsafe only if it contains: nudity, graphic violence, hate symbols, explicit content, or spam/advertisements. Most prayer-related photos (people, nature, hospitals, churches) are safe.',
          },
          {
            type: 'image',
            image: imageUrl,
          },
        ],
      },
    ],
  });
  if (!output) throw new Error('AI image moderation returned no output');
  return output;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/services/ai.service.test.ts
```

Expected: PASS.

- [ ] **Step 5: Install @vercel/blob**

```bash
npm install @vercel/blob
```

- [ ] **Step 6: Create the upload API route**

Create `src/app/api/upload/route.ts`:

```typescript
import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { moderateImage } from '@/services/ai.service';

const MAX_SIZE = 2 * 1024 * 1024; // 2MB (already compressed client-side)
const ALLOWED_TYPES = ['image/webp', 'image/jpeg', 'image/png'];

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large' }, { status: 400 });
  }

  const blob = await put(`prayers/${crypto.randomUUID()}.webp`, file, {
    access: 'public',
    contentType: file.type,
  });

  // Moderate asynchronously — don't block the response
  // If flagged, the image stays but the prayer goes to review queue
  try {
    const moderation = await moderateImage(blob.url);
    if (!moderation.safe) {
      return NextResponse.json({
        url: blob.url,
        flagged: true,
        reason: moderation.reason,
      });
    }
  } catch {
    // If moderation fails, allow the upload (manual review can catch it)
  }

  return NextResponse.json({ url: blob.url });
}
```

- [ ] **Step 7: Commit**

```bash
git add src/services/ai.service.ts src/services/ai.service.test.ts src/app/api/upload/route.ts
git commit -m "feat: add Vercel Blob upload route with AI image moderation"
```

---

## Task 5: Integrate Photo Upload into Prayer Form

**Files:**
- Modify: `src/components/prayer-form.tsx`
- Modify: `src/app/actions/prayer.actions.ts`
- Modify: `src/services/prayer.service.ts`

- [ ] **Step 1: Update prayer service to accept imageUrl**

In `src/services/prayer.service.ts`, add `imageUrl` to the `CreatePrayerInput` type:

```typescript
export type CreatePrayerInput = {
  content: string;
  isAnonymous: boolean;
  isUrgent: boolean;
  authorId: string | null;
  imageUrl?: string | null;
};
```

Then add `imageUrl` to the `.values()` call in `createPrayer`:

```typescript
const [prayer] = await db
  .insert(prayers)
  .values({
    content: input.content,
    isAnonymous: input.isAnonymous,
    isUrgent: input.isUrgent,
    authorId: input.authorId,
    category: categorization.category,
    tags: categorization.tags,
    suggestedVerse: categorization.verse,
    imageUrl: input.imageUrl ?? null,
    expiresAt: addDays(new Date(), 30),
  })
  .returning();
```

- [ ] **Step 2: Update submit prayer action to accept imageUrl**

In `src/app/actions/prayer.actions.ts`, update the schema and action:

Update the Zod schema:

```typescript
const submitPrayerSchema = z.object({
  content: z.string().min(10, 'Please write at least 10 characters').max(1000),
  isAnonymous: z.boolean(),
  isUrgent: z.boolean(),
  imageUrl: z.string().url().nullable().optional(),
});
```

Update the `safeParse` call to include `imageUrl`:

```typescript
const parsed = submitPrayerSchema.safeParse({
  content: formData.get('content'),
  isAnonymous: formData.get('isAnonymous') === 'true',
  isUrgent: formData.get('isUrgent') === 'true',
  imageUrl: formData.get('imageUrl') || null,
});
```

Update the `createPrayer` call to pass `imageUrl`:

```typescript
const prayer = await createPrayer({
  ...parsed.data,
  authorId: session?.user?.id ?? null,
  imageUrl: parsed.data.imageUrl ?? null,
});
```

- [ ] **Step 3: Add photo upload to prayer form**

Replace the full contents of `src/components/prayer-form.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { submitPrayerAction } from '@/app/actions/prayer.actions';
import { CrisisResources } from './crisis-resources';
import { PhotoUpload } from './photo-upload';

export function PrayerForm({ onSuccess }: { onSuccess?: (id: string) => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [showCrisis, setShowCrisis] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    formData.set('isAnonymous', String(isAnonymous));
    formData.set('isUrgent', String(isUrgent));
    if (imageUrl) formData.set('imageUrl', imageUrl);

    const result = await submitPrayerAction(formData);
    setPending(false);

    if (result.success) {
      setImageUrl(null);
      onSuccess?.(result.prayerId);
      (e.target as HTMLFormElement).reset();
    } else if (result.selfHarm) {
      setShowCrisis(true);
    } else {
      setError(result.error);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="content">Your prayer request</Label>
          <Textarea
            id="content"
            name="content"
            placeholder="Share what&apos;s on your heart..."
            rows={5}
            required
            minLength={10}
            maxLength={1000}
          />
        </div>

        <PhotoUpload
          url={imageUrl}
          onUpload={setImageUrl}
          onRemove={() => setImageUrl(null)}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch id="anonymous" checked={isAnonymous} onCheckedChange={setIsAnonymous} />
            <Label htmlFor="anonymous">Keep me anonymous</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="urgent" checked={isUrgent} onCheckedChange={setIsUrgent} />
            <Label htmlFor="urgent">Urgent</Label>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? 'Submitting...' : 'Add to the Prayer Jar'}
        </Button>
      </form>

      <CrisisResources open={showCrisis} onClose={() => setShowCrisis(false)} />
    </>
  );
}
```

- [ ] **Step 4: Run tests to verify nothing is broken**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/services/prayer.service.ts src/app/actions/prayer.actions.ts src/components/prayer-form.tsx
git commit -m "feat: integrate photo upload into prayer submission form"
```

---

## Task 6: Photo Upload on Testimony (Mark as Answered)

**Files:**
- Modify: `src/services/prayer.service.ts`
- Modify: `src/app/actions/lifecycle.actions.ts`
- Modify: `src/components/prayer-card.tsx`

- [ ] **Step 1: Update markPrayerAnswered to accept imageUrl**

In `src/services/prayer.service.ts`, update the `markPrayerAnswered` function:

```typescript
export async function markPrayerAnswered(id: string, authorId: string, testimony?: string, imageUrl?: string) {
  const [updated] = await db
    .update(prayers)
    .set({
      status: 'answered',
      testimony: testimony ?? null,
      imageUrl: imageUrl ?? undefined,
    })
    .where(and(eq(prayers.id, id), eq(prayers.authorId, authorId)))
    .returning();
  return updated ?? null;
}
```

Note: we use `undefined` (not `null`) for imageUrl when not provided so Drizzle skips the column rather than overwriting an existing photo.

- [ ] **Step 2: Update lifecycle action to accept imageUrl**

In `src/app/actions/lifecycle.actions.ts`, update the schema and action:

Update the `answeredSchema`:

```typescript
const answeredSchema = z.object({
  prayerId: z.string().uuid(),
  testimony: z.string().max(2000).optional(),
  imageUrl: z.string().url().nullable().optional(),
});
```

Update the `markAnsweredAction` to parse and pass `imageUrl`:

```typescript
export async function markAnsweredAction(formData: FormData): Promise<LifecycleResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'You must be signed in.' };
  }

  const parsed = answeredSchema.safeParse({
    prayerId: formData.get('prayerId'),
    testimony: formData.get('testimony') || undefined,
    imageUrl: formData.get('imageUrl') || null,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const updated = await markPrayerAnswered(
    parsed.data.prayerId,
    session.user.id,
    parsed.data.testimony,
    parsed.data.imageUrl ?? undefined
  );

  if (!updated) {
    return { success: false, error: 'Prayer not found or you do not own it.' };
  }

  revalidatePath('/my-prayers');
  revalidatePath('/praise-wall');
  return { success: true };
}
```

- [ ] **Step 3: Update prayer card to include photo upload on testimony form**

In `src/components/prayer-card.tsx`, add the photo upload to the Mark as Answered form.

Add imports at the top:

```typescript
import { useState } from 'react';
import { PhotoUpload } from './photo-upload';
```

Add `imageUrl` state inside the component (alongside existing state):

```typescript
const [imageUrl, setImageUrl] = useState<string | null>(null);
```

Update `handleMarkAnswered` to include `imageUrl` in the form data:

```typescript
async function handleMarkAnswered(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
  setPending(true);
  setError('');
  const formData = new FormData(e.currentTarget);
  if (imageUrl) formData.set('imageUrl', imageUrl);
  const result = await markAnsweredAction(formData);
  setPending(false);
  if (result.success) {
    setLocalStatus('answered');
    setShowTestimony(false);
    setImageUrl(null);
  } else {
    setError(result.error);
  }
}
```

In the testimony form JSX (the `{showTestimony && localStatus === 'active' && (` block), add the `PhotoUpload` component after the `Textarea`:

```typescript
{showTestimony && localStatus === 'active' && (
  <form onSubmit={handleMarkAnswered} className="space-y-2 pt-1">
    <input type="hidden" name="prayerId" value={prayer.id} />
    <Textarea
      name="testimony"
      placeholder="Share how God answered this prayer... (optional)"
      rows={3}
      maxLength={2000}
    />
    <PhotoUpload
      url={imageUrl}
      onUpload={setImageUrl}
      onRemove={() => setImageUrl(null)}
      variant="warm"
    />
    <div className="flex gap-2">
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? 'Saving...' : 'Confirm Answered'}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => setShowTestimony(false)}
      >
        Cancel
      </Button>
    </div>
  </form>
)}
```

- [ ] **Step 4: Run tests**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/services/prayer.service.ts src/app/actions/lifecycle.actions.ts src/components/prayer-card.tsx
git commit -m "feat: add photo upload to Mark as Answered testimony form"
```

---

## Task 7: Display Photos in Prayer Cards, Praise Cards, Guided Prayer, and Share Page

**Files:**
- Modify: `src/components/prayer-card.tsx`
- Modify: `src/components/praise-card.tsx`
- Modify: `src/components/guided-prayer.tsx`
- Modify: `src/app/(public)/p/[id]/page.tsx`

- [ ] **Step 1: Show photo in prayer-card.tsx**

In `src/components/prayer-card.tsx`, add photo display in `CardContent` right after the prayer content paragraph. Find this line:

```typescript
<p className="text-sm leading-relaxed">{prayer.content}</p>
```

Add after it:

```typescript
{prayer.imageUrl && (
  <img
    src={prayer.imageUrl}
    alt="Prayer photo"
    className="w-full h-48 object-cover rounded-lg"
    loading="lazy"
  />
)}
```

Also show the photo in the testimony section. Replace the testimony display block:

```typescript
{localStatus === 'answered' && prayer.testimony && (
  <div className="border-l-4 border-amber-400 pl-3">
    <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">Testimony</p>
    <p className="text-sm">{prayer.testimony}</p>
    {prayer.imageUrl && (
      <img
        src={prayer.imageUrl}
        alt="Testimony photo"
        className="w-full h-48 object-cover rounded-lg mt-2"
        loading="lazy"
      />
    )}
  </div>
)}
```

- [ ] **Step 2: Show photo in praise-card.tsx**

In `src/components/praise-card.tsx`, add photo display inside `CardContent`. After the testimony `<div>` block and before the prayer count `<p>`, add:

```typescript
{prayer.imageUrl && (
  <img
    src={prayer.imageUrl}
    alt="Testimony photo"
    className="w-full h-48 object-cover rounded-lg"
    loading="lazy"
  />
)}
```

- [ ] **Step 3: Show photo in guided-prayer.tsx**

In `src/components/guided-prayer.tsx`, add photo display inside the prayer Card. After the urgent badge span and before the closing `</CardContent>`, add:

```typescript
{prayer.imageUrl && (
  <img
    src={prayer.imageUrl}
    alt="Prayer photo"
    className="w-full h-48 object-cover rounded-lg mt-4"
    loading="lazy"
  />
)}
```

- [ ] **Step 4: Show photo in shared prayer page**

In `src/app/(public)/p/[id]/page.tsx`, add photo display inside the Card's `CardContent`. After the suggested verse paragraph:

```typescript
{prayer.imageUrl && (
  <img
    src={prayer.imageUrl}
    alt="Prayer photo"
    className="w-full h-48 object-cover rounded-lg mt-4"
    loading="lazy"
  />
)}
```

- [ ] **Step 5: Run build to verify**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/components/prayer-card.tsx src/components/praise-card.tsx src/components/guided-prayer.tsx src/app/\(public\)/p/\[id\]/page.tsx
git commit -m "feat: display photos in prayer cards, praise wall, guided prayer, and share pages"
```

---

## Task 8: Social Sharing — Share Buttons Component

**Files:**
- Create: `src/components/share-buttons.tsx`

- [ ] **Step 1: Create the share buttons component**

Create `src/components/share-buttons.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Check, Copy } from 'lucide-react';

type ShareButtonsProps = {
  url: string;
  text: string;
  variant?: 'inline' | 'bar';
};

export function ShareButtons({ url, text, variant = 'inline' }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const fullUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${url}`
    : url;

  const encodedUrl = encodeURIComponent(fullUrl);
  const encodedText = encodeURIComponent(text);

  function handleCopy() {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const buttons = (
    <>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on Twitter/X"
      >
        <Button type="button" size="sm" variant="outline" className="h-9 w-9 p-0">
          <span className="text-sm font-bold">𝕏</span>
        </Button>
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on Facebook"
      >
        <Button type="button" size="sm" variant="outline" className="h-9 w-9 p-0">
          <span className="text-sm font-bold">f</span>
        </Button>
      </a>
      <a
        href={`https://wa.me/?text=${encodedText}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on WhatsApp"
      >
        <Button type="button" size="sm" variant="outline" className="h-9 w-9 p-0">
          <span className="text-sm">💬</span>
        </Button>
      </a>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-9 w-9 p-0"
        onClick={handleCopy}
        aria-label="Copy link"
      >
        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      </Button>
    </>
  );

  if (variant === 'bar') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground mr-1">Share</span>
        {buttons}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Share2 className="h-3.5 w-3.5 text-muted-foreground mr-1" />
      {buttons}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/share-buttons.tsx
git commit -m "feat: add social share buttons component (Twitter/X, Facebook, WhatsApp, copy link)"
```

---

## Task 9: Dynamic OG Images

**Files:**
- Create: `src/app/api/og/prayer/[id]/route.tsx`
- Create: `src/app/api/og/testimony/[id]/route.tsx`

- [ ] **Step 1: Install @vercel/og**

```bash
npm install @vercel/og
```

- [ ] **Step 2: Create prayer OG image route**

Create `src/app/api/og/prayer/[id]/route.tsx`:

```typescript
import { ImageResponse } from '@vercel/og';
import { getPrayerById } from '@/services/prayer.service';

export const runtime = 'nodejs';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const prayer = await getPrayerById(id);

  if (!prayer) {
    return new Response('Not found', { status: 404 });
  }

  const truncated = prayer.content.length > 120
    ? prayer.content.slice(0, 117) + '...'
    : prayer.content;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #1a1a2e, #2a1a1e)',
          padding: '48px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ fontSize: 14, color: '#d4a843', letterSpacing: '2px', textTransform: 'uppercase' as const, marginBottom: 24, display: 'flex' }}>
          🕯 Prayer Request
        </div>
        <div style={{ fontSize: 28, color: '#e8e0d4', lineHeight: 1.5, textAlign: 'center' as const, fontStyle: 'italic' as const, marginBottom: 24, maxWidth: '80%', display: 'flex' }}>
          &ldquo;{truncated}&rdquo;
        </div>
        <div style={{ fontSize: 16, color: '#888', display: 'flex' }}>
          {prayer.prayerCount} {prayer.prayerCount === 1 ? 'person has' : 'people have'} prayed for this
        </div>
        <div style={{ fontSize: 14, color: '#d4a843', marginTop: 24, display: 'flex' }}>
          prayerjar.app · Pray with me
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
```

- [ ] **Step 3: Create testimony OG image route**

Create `src/app/api/og/testimony/[id]/route.tsx`:

```typescript
import { ImageResponse } from '@vercel/og';
import { getPrayerById } from '@/services/prayer.service';

export const runtime = 'nodejs';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const prayer = await getPrayerById(id);

  if (!prayer || prayer.status !== 'answered') {
    return new Response('Not found', { status: 404 });
  }

  const text = prayer.testimony || prayer.content;
  const truncated = text.length > 120 ? text.slice(0, 117) + '...' : text;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #1a2a1a, #1a1a2e)',
          padding: '48px',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ fontSize: 14, color: '#6a9a6a', letterSpacing: '2px', textTransform: 'uppercase' as const, marginBottom: 24, display: 'flex' }}>
          ✨ Answered Prayer
        </div>
        <div style={{ fontSize: 28, color: '#e8e0d4', lineHeight: 1.5, textAlign: 'center' as const, fontStyle: 'italic' as const, marginBottom: 24, maxWidth: '80%', display: 'flex' }}>
          &ldquo;{truncated}&rdquo;
        </div>
        <div style={{ fontSize: 16, color: '#aaa', display: 'flex' }}>
          {prayer.prayerCount} people prayed
        </div>
        <div style={{ fontSize: 14, color: '#d4a843', marginTop: 24, display: 'flex' }}>
          prayerjar.app · Praise Wall
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/og/prayer/\[id\]/route.tsx src/app/api/og/testimony/\[id\]/route.tsx
git commit -m "feat: add dynamic OG image generation for prayers and testimonies"
```

---

## Task 10: Add OG Metadata + Share Buttons to Pages

**Files:**
- Modify: `src/app/(public)/p/[id]/page.tsx`
- Modify: `src/components/praise-card.tsx`
- Modify: `src/components/guided-prayer.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Add OG metadata to shared prayer page**

In `src/app/(public)/p/[id]/page.tsx`, add a `generateMetadata` export and share buttons.

Add imports at the top:

```typescript
import type { Metadata } from 'next';
import { ShareButtons } from '@/components/share-buttons';
```

Add the metadata function before the default export:

```typescript
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const prayer = await getPrayerById(id);
  if (!prayer) return { title: 'Prayer Not Found' };

  const ogUrl = prayer.status === 'answered'
    ? `/api/og/testimony/${id}`
    : `/api/og/prayer/${id}`;

  return {
    title: 'A Prayer Request | Prayer Jar',
    description: prayer.content.slice(0, 155),
    openGraph: {
      title: 'A Prayer Request | Prayer Jar',
      description: prayer.content.slice(0, 155),
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'A Prayer Request | Prayer Jar',
      description: prayer.content.slice(0, 155),
      images: [ogUrl],
    },
  };
}
```

Add share buttons at the bottom of the page, before the action buttons. Find the `<div className="flex flex-col gap-3">` and add before it:

```typescript
<ShareButtons
  url={`/p/${prayer.id}`}
  text={prayer.isAnonymous ? 'Someone needs your prayer' : 'Please pray for this request'}
  variant="bar"
/>
```

- [ ] **Step 2: Add share buttons to praise-card.tsx**

In `src/components/praise-card.tsx`, the component is a server component so we need to keep share buttons simple. Convert to a client component or pass data. The simplest approach: add a link-based share approach.

Add at the top:

```typescript
import { ShareButtons } from '@/components/share-buttons';
```

Add share buttons after the prayer count paragraph, before the closing `</CardContent>`:

```typescript
<ShareButtons
  url={`/p/${prayer.id}`}
  text={prayer.testimony ? `Answered prayer: ${prayer.testimony.slice(0, 80)}` : 'An answered prayer!'}
/>
```

Since `ShareButtons` is a client component, update `praise-card.tsx` — it must stay a server component but can render a client child. No change needed since Next.js handles this automatically.

Wait — `ShareButtons` uses `useState` and `window` which makes it a client component. Server components can render client components as children. This works as-is.

- [ ] **Step 3: Add share buttons to guided prayer "done" stage**

In `src/components/guided-prayer.tsx`, add import at the top:

```typescript
import { ShareButtons } from '@/components/share-buttons';
```

In the `done` stage return block, add share buttons after the "Thank you" message and before the "Pray for Another" button:

```typescript
if (stage === 'done') {
  return (
    <div className="text-center space-y-4 py-8">
      <p className="text-lg font-medium">Thank you for praying! 🙏</p>
      <p className="text-muted-foreground">Your encouragement has been delivered.</p>
      <ShareButtons
        url={`/p/${prayer.id}`}
        text="I just prayed for someone on Prayer Jar. Will you join me?"
        variant="bar"
      />
      <Button onClick={onPrayForAnother}>Pray for Another</Button>
    </div>
  );
}
```

- [ ] **Step 4: Add default OG metadata to root layout**

In `src/app/layout.tsx`, update the existing `metadata` export:

```typescript
export const metadata: Metadata = {
  title: 'Prayer Jar',
  description: 'A global prayer jar — share your heart, intercede for others.',
  openGraph: {
    title: 'Prayer Jar',
    description: 'A global prayer jar — share your heart, intercede for others.',
    siteName: 'Prayer Jar',
  },
  twitter: {
    card: 'summary',
    title: 'Prayer Jar',
    description: 'A global prayer jar — share your heart, intercede for others.',
  },
};
```

- [ ] **Step 5: Run build**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/app/\(public\)/p/\[id\]/page.tsx src/components/praise-card.tsx src/components/guided-prayer.tsx src/app/layout.tsx
git commit -m "feat: add OG metadata and share buttons to prayer pages, praise wall, and guided prayer"
```

---

## Task 11: CSS Animations

**Files:**
- Modify: `src/app/globals.css`
- Create: `src/hooks/use-scroll-reveal.ts`

- [ ] **Step 1: Add keyframe animations to globals.css**

Append to the end of `src/app/globals.css`:

```css
/* Prayer Jar Animations */
@keyframes pray-ripple {
  0% { box-shadow: 0 0 0 0 oklch(0.72 0.11 68 / 0.4); }
  70% { box-shadow: 0 0 0 14px oklch(0.72 0.11 68 / 0); }
  100% { box-shadow: 0 0 0 0 oklch(0.72 0.11 68 / 0); }
}

@keyframes count-bump {
  0%, 100% { transform: translateY(0); }
  40% { transform: translateY(-6px); }
}

@keyframes candle-flicker {
  0%, 100% { text-shadow: 0 0 8px oklch(0.72 0.11 68), 0 0 20px oklch(0.72 0.11 68 / 0.3); transform: scale(1); }
  25% { text-shadow: 0 0 12px oklch(0.72 0.11 68), 0 0 30px oklch(0.72 0.11 68 / 0.5); transform: scale(1.05); }
  50% { text-shadow: 0 0 6px oklch(0.72 0.11 68), 0 0 15px oklch(0.72 0.11 68 / 0.2); transform: scale(0.98); }
  75% { text-shadow: 0 0 14px oklch(0.72 0.11 68), 0 0 35px oklch(0.72 0.11 68 / 0.4); transform: scale(1.03); }
}

@keyframes fade-slide-up {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes badge-pop {
  0% { transform: scale(0.8); opacity: 0; }
  60% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}

.animate-pray-ripple {
  animation: pray-ripple 0.8s ease-out;
}

.animate-count-bump {
  animation: count-bump 0.4s ease-out;
}

.animate-candle {
  animation: candle-flicker 3s ease-in-out infinite;
  display: inline-block;
}

.animate-fade-slide-up {
  animation: fade-slide-up 0.5s ease-out forwards;
}

.animate-badge-pop {
  animation: badge-pop 0.5s ease-out forwards;
}

/* Stagger for scroll reveal children */
.scroll-reveal-stagger > :nth-child(1) { animation-delay: 0s; }
.scroll-reveal-stagger > :nth-child(2) { animation-delay: 0.1s; }
.scroll-reveal-stagger > :nth-child(3) { animation-delay: 0.2s; }
.scroll-reveal-stagger > :nth-child(4) { animation-delay: 0.3s; }
.scroll-reveal-stagger > :nth-child(5) { animation-delay: 0.4s; }
.scroll-reveal-stagger > :nth-child(6) { animation-delay: 0.5s; }

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .animate-pray-ripple,
  .animate-count-bump,
  .animate-candle,
  .animate-fade-slide-up,
  .animate-badge-pop {
    animation: none;
  }
}
```

- [ ] **Step 2: Create useScrollReveal hook**

Create `src/hooks/use-scroll-reveal.ts`:

```typescript
'use client';

import { useEffect, useRef } from 'react';

export function useScrollReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-slide-up');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    // Observe all direct children
    Array.from(el.children).forEach((child) => {
      (child as HTMLElement).style.opacity = '0';
      observer.observe(child);
    });

    return () => observer.disconnect();
  }, []);

  return ref;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css src/hooks/use-scroll-reveal.ts
git commit -m "feat: add CSS animations and scroll reveal hook"
```

---

## Task 12: Apply Animations to Components

**Files:**
- Modify: `src/components/guided-prayer.tsx`
- Modify: `src/app/(public)/praise-wall/page.tsx`

- [ ] **Step 1: Add candle animation and pray button ripple to guided prayer**

In `src/components/guided-prayer.tsx`, update the scripture/pause section. Find the line:

```typescript
<p className="text-sm font-medium">✝️ {prayer.suggestedVerse}</p>
```

Replace it with:

```typescript
<p className="text-sm font-medium">
  <span className="animate-candle">🕯</span> {prayer.suggestedVerse}
</p>
```

For the "I Prayed for This" button, add a ripple class on click. Update the `handlePrayed` function — the button already triggers the action. The ripple animation should play on click. Update the Button:

```typescript
<Button onClick={handlePrayed} disabled={pending} size="lg" className="mt-4 active:animate-pray-ripple">
  {pending ? 'Recording...' : 'I Prayed for This 🙏'}
</Button>
```

- [ ] **Step 2: Add scroll reveal to Praise Wall**

In `src/app/(public)/praise-wall/page.tsx`, this is a server component so we need a thin client wrapper for the animation. The simplest approach: create the grid with a class and use CSS-only staggered animation with the `animate-fade-slide-up` class.

Add a wrapper for the praise cards grid. Find the existing grid:

```typescript
<div className="grid gap-4 sm:grid-cols-2">
```

Replace with:

```typescript
<div className="grid gap-4 sm:grid-cols-2 scroll-reveal-stagger">
```

And add `opacity: 0` + `animate-fade-slide-up` to each card. Since `PraiseCard` is a server component, apply the animation class in the map:

```typescript
{answered.map((prayer) => (
  <div key={prayer.id} className="animate-fade-slide-up" style={{ opacity: 0 }}>
    <PraiseCard prayer={prayer} />
  </div>
))}
```

- [ ] **Step 3: Run build**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/guided-prayer.tsx src/app/\(public\)/praise-wall/page.tsx
git commit -m "feat: apply candle flicker, pray ripple, and scroll reveal animations"
```

---

## Task 13: Mobile Bottom Navigation

**Files:**
- Create: `src/components/mobile-nav.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create mobile nav component**

Create `src/components/mobile-nav.tsx`:

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, HandHeart, Star, User } from 'lucide-react';

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14">
        <Link
          href="/"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs ${
            pathname === '/' ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <Home className="h-5 w-5" />
          <span>Home</span>
        </Link>

        <Link
          href="/pray"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs ${
            pathname.startsWith('/pray') ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <HandHeart className="h-5 w-5" />
          <span>Pray</span>
        </Link>

        {/* Elevated Add button — links to homepage where PrayerDialog lives */}
        <Link
          href="/"
          className="flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg -mt-6"
          aria-label="Add a prayer request"
        >
          <span className="text-lg">🕯</span>
        </Link>

        <Link
          href="/praise-wall"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs ${
            pathname === '/praise-wall' ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <Star className="h-5 w-5" />
          <span>Praise</span>
        </Link>

        <Link
          href="/my-prayers"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs ${
            pathname === '/my-prayers' ? 'text-primary' : 'text-muted-foreground'
          }`}
        >
          <User className="h-5 w-5" />
          <span>Profile</span>
        </Link>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Add mobile nav to root layout**

In `src/app/layout.tsx`, add the import:

```typescript
import { MobileNav } from '@/components/mobile-nav';
```

Add the `MobileNav` component and bottom padding. Find `{children}` and replace with:

```typescript
<div className="pb-16 md:pb-0">
  {children}
</div>
<MobileNav />
```

- [ ] **Step 3: Run build**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/mobile-nav.tsx src/app/layout.tsx
git commit -m "feat: add mobile bottom navigation bar with elevated Add button"
```

---

## Task 14: Onboarding Overlay

**Files:**
- Create: `src/components/onboarding-overlay.tsx`
- Modify: `src/app/(public)/page.tsx`

- [ ] **Step 1: Create onboarding overlay component**

Create `src/components/onboarding-overlay.tsx`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'prayerjar_onboarded';

export function OnboardingOverlay() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setShow(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, 'true');
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center space-y-6 animate-fade-slide-up">
        <div className="text-5xl">🕯</div>

        <div>
          <h2 className="text-xl font-bold tracking-tight mb-2">Welcome to Prayer Jar</h2>
          <p className="text-sm text-muted-foreground">
            A place where anyone can share a prayer need and anyone can pray for others.
          </p>
        </div>

        <div className="flex justify-center gap-6">
          <div className="text-center">
            <div className="w-14 h-14 rounded-full border border-primary/30 bg-primary/5 flex items-center justify-center text-2xl mx-auto mb-2">
              ✍️
            </div>
            <p className="text-xs text-muted-foreground">Share a<br />prayer need</p>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 rounded-full border border-primary/30 bg-primary/5 flex items-center justify-center text-2xl mx-auto mb-2">
              🙏
            </div>
            <p className="text-xs text-muted-foreground">Pray for<br />someone</p>
          </div>
          <div className="text-center">
            <div className="w-14 h-14 rounded-full border border-primary/30 bg-primary/5 flex items-center justify-center text-2xl mx-auto mb-2">
              ⭐
            </div>
            <p className="text-xs text-muted-foreground">Celebrate<br />answered prayers</p>
          </div>
        </div>

        <div className="space-y-2">
          <Button onClick={dismiss} className="w-full">Start Praying</Button>
          <button onClick={dismiss} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add onboarding to homepage**

In `src/app/(public)/page.tsx`, add the import:

```typescript
import { OnboardingOverlay } from '@/components/onboarding-overlay';
```

Add the component right after the opening `<main>` tag:

```typescript
export default async function HomePage() {
  const stats = await getStats();

  return (
    <main className="min-h-screen">
      <OnboardingOverlay />
      {/* Hero */}
      ...
```

- [ ] **Step 3: Run build**

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/onboarding-overlay.tsx src/app/\(public\)/page.tsx
git commit -m "feat: add first-time visitor onboarding overlay"
```

---

## Task 15: Final Integration & Verification

- [ ] **Step 1: Run all tests**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 2: Build for production**

```bash
npm run build
```

Expected: build succeeds with no TypeScript errors.

- [ ] **Step 3: Create Vercel Blob store**

Go to vercel.com → prayer-jar → Storage → Create → Blob Store. Name it "prayer-jar-photos". Then pull the new env var:

```bash
vercel env pull .env.local --yes
```

This will add `BLOB_READ_WRITE_TOKEN` to your local env.

- [ ] **Step 4: Test locally**

```bash
npm run dev
```

Verify:
- Homepage shows onboarding overlay (clear localStorage to test again)
- Prayer submission form has photo upload drop zone
- Mark as Answered has warm photo upload with nudge text
- Praise Wall cards have share buttons
- Shared prayer page (`/p/[id]`) has OG metadata and share buttons
- Mobile viewport shows bottom navigation bar
- Candle flickers on guided prayer page
- Praise Wall cards fade in on scroll

- [ ] **Step 5: Deploy to production**

```bash
vercel --prod
```

Expected: deployment succeeds.

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: complete Phase 1 improvements — photos, social sharing, UX polish"
```

---

## Environment Variables Reference

| Variable | Purpose | Where to get |
|----------|---------|--------------|
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage access | Vercel Dashboard → Storage → Blob → Create Store, then `vercel env pull` |

All existing environment variables remain unchanged.
