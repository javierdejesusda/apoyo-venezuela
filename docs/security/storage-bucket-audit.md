# Storage bucket audit: `fotos`

Status: reviewed 2026-07-02. Scope: the public Supabase Storage bucket `fotos`,
which holds the photos attached to zone reports. This document records the
residual risks of allowing anonymous, direct-from-browser uploads, what was
hardened in this change, and what is recommended but deliberately left for a
follow-up.

## Current state

The bucket is created and configured by the migrations under
`supabase/migrations/`:

- `20260625010000_add_fotos.sql`: creates a **public** bucket and opens both
  read and insert to everyone (`storage.objects` RLS: `select` and `insert`
  with only a `bucket_id = 'fotos'` check). There is no `update`/`delete`
  policy, matching the app's no-delete stance elsewhere.
- `20260625020000_restrict_fotos_mime.sql`: drops the `image/*` wildcard for an
  explicit raster allow-list (`jpeg, png, webp, gif, heic, heif, avif`). This
  removes `image/svg+xml`, which is a stored-XSS vector when opened directly.
- `20260625030000_raise_fotos_size_limit.sql`: sets `file_size_limit` to 10 MB.

Uploads happen client-side in `components/report-location-form.tsx` using the
public anon key, to a random path `${uuid}-${sanitizedName}` with
`upsert: false`. The design is intentional: the app is anonymous (no login), so
photo uploads stay anonymous like locations and needs.

## Residual risks

### 1. EXIF / GPS metadata leak (highest impact)

Phone cameras embed EXIF metadata in the JPEGs they produce, and that metadata
routinely includes the exact GPS coordinates where the photo was taken. Because
the bucket is public and serves the original bytes, an untouched upload would
publish the precise location of whoever appears in the photo, even though the
rest of the app is careful with location (marking an exact map point is
optional, and the public API rounds coordinates to ~110 m).

The realistic threat is not a sophisticated attacker: it is a well-meaning
neighbor who photographs a damaged home and, without knowing it, publishes the
GPS of a vulnerable family.

Mitigation shipped in this change: see "What was implemented".

### 2. Anonymous-write abuse

Anyone with the anon key (which ships in the client bundle by design) can upload
directly to the bucket with no authentication and no server-side rate limit on
the Storage endpoint. Consequences:

- Storage quota and cost exhaustion (many 10 MB uploads).
- Arbitrary raster content, including illegal or abusive imagery, with no
  server-side content moderation.
- Orphan objects: an upload succeeds before the report is created, so a client
  that uploads and never submits leaves unreferenced objects behind.

The report Server Action already applies a throttle
(`20260628010000_report_throttle.sql`), but that guards the report insert, not
the direct Storage upload, so a caller can bypass it for uploads.

### 3. Object enumeration of a public bucket

The `select` policy allows reading any row in `storage.objects` for the bucket,
so the anon key can **list** object paths via the Storage API, not just fetch a
known path. Every uploaded photo is therefore discoverable, including photos
attached to reports that were later hidden or that a moderator was asked to
remove. Object paths use a random UUID prefix, which prevents guessing but does
not prevent listing.

### 4. Client-controlled filenames (low)

The stored path includes a client-provided filename. The client sanitizes it
(`sanitizeFilename`), but the server does not; the random UUID prefix plus
`upsert: false` prevents collisions and overwrites, so the practical risk is
low.

## What was implemented

Client-side photo metadata stripping before upload, covering the highest-impact
risk (EXIF/GPS) with a low-risk, well-tested change:

- `lib/data/exif-strip.ts`
  - `stripJpegMetadata(bytes)`: a pure function that removes every JPEG metadata
    segment (all `APPn` markers, which carry EXIF/GPS, XMP, IPTC, ICC, and the
    JFIF header, plus the `COM` comment segment). The compressed image data is
    copied through byte-for-byte, so the picture is unchanged. Non-JPEG input
    and malformed framing are returned/copied without throwing.
  - `stripImageMetadata(file)`: rewrites JPEG files and returns everything else
    untouched. It is fail-open: any error falls back to the original file,
    because in an emergency, publishing the photo matters more than blocking the
    upload.
- Wired into `components/report-location-form.tsx` so every photo is stripped
  before it reaches the bucket (both the real Supabase path and the demo
  data-URL path).
- Covered by `tests/exif-strip.test.ts` (pure function, including a GPS-payload
  removal assertion) and `tests/report-location-foto-strip.test.tsx` (the form
  uploads stripped bytes).

Why JPEG only: JPEG is the format phone cameras use for the geotagged photos
that matter most, and on iOS the file input hands the browser a JPEG in
practice, so this covers the dominant leak vector. Stripping is a pure,
pixel-preserving byte operation, which makes it safe and unit-testable, unlike a
canvas re-encode (see recommendations).

Important limitation: because uploads are anonymous and direct, client-side
stripping protects the real reporters using the app (the actual threat model),
but it is not a server-side guarantee. A malicious client using the anon key
directly can still upload EXIF-laden or non-JPEG images. A server-side control
is the only hard guarantee (see recommendations).

## Recommendations (not implemented here)

These are deliberately left out of this change because they touch production
Storage policies or need backend work, and the brief scoped this PR to low-risk,
clearly-beneficial hardening.

1. **Server-side metadata stripping / re-encode** (defense in depth): strip or
   re-encode images after upload via a Storage trigger, an Edge Function, or
   Supabase image transformations. This is the only control that holds when the
   client is bypassed, and it also covers PNG/WebP/HEIC.
2. **Full-format client stripping via canvas re-encode** (implemented): uploads
   now downscale and re-encode to WebP on a `<canvas>` before upload
   (`lib/data/foto-resize.ts`), which drops all metadata for any format the
   browser can decode, not just JPEG. This was added to serve photos raw from
   the public bucket (avoiding billed Supabase image transformations), and it
   subsumes the metadata strip for the common case. The byte-level JPEG strip
   (`lib/data/exif-strip.ts`) remains as the fallback when the browser cannot
   decode/encode the image, so a report photo still never publishes GPS data.
   Re-hosted import photos are re-encoded server-side with sharp
   (`scripts/lib/image-resize.mjs`), which also honors EXIF orientation.
3. **Rate-limit / gate uploads**: replace direct anon uploads with signed upload
   tokens minted by a Server Action that reuses the existing report throttle, or
   put uploads behind an Edge Function. This bounds abuse and cost.
4. **Tighten the read policy**: restrict `select` on `storage.objects` so objects
   cannot be enumerated (serve known paths only, or switch to signed URLs).
   Tradeoff: loses the simplicity of a plain public bucket.
5. **Lifecycle hygiene**: periodically remove orphan objects not referenced by
   any `locations.fotos` entry, and add a storage-quota alert.
6. **Content safety**: add an abuse-reporting path for photos and consider
   automated moderation for a public, unauthenticated upload surface.

## Do not

- Do not re-add `image/svg+xml` to the MIME allow-list (stored-XSS).
- Do not change production Storage RLS policies as part of a code-only PR; those
  need `supabase db push --linked` and a deliberate review, since prod does not
  auto-apply migrations.
