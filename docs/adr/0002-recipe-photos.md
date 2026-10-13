# ADR 0002: Optional recipe photos

Status: PROPOSED

Date: 2026-10-13

This is a proposal. Nothing in it is implemented or approved, and it needs a decision from the owner before any code is written. Photos are "out of scope (later)" in [docs/requirements.md](../requirements.md), and D15 says the data model is not designed around photos. This ADR describes how photos could be added later without breaking either.

## Context

The owner wants to add photos of their own cooked dishes. Photos are optional: most recipes will have none, and the app must look good without them. Constraints that apply:

- Single user, no authentication (D1, D2). No external network dependency at runtime (non-functional requirements), so no cloud storage or image CDN.
- The API is Fastify with SQLite in WAL mode ([ADR 0001](0001-backend-architecture.md), provisional). It runs in Docker on a Raspberry Pi 4B with 2 GB RAM, with data on a 512 GB SSD ([deployment plan](../deployment-pi.md)).
- `PUT /api/recipes/:id` replaces the whole recipe and rejects unknown fields. JSON export has no ids and import rejects unknown fields ([docs/api-model.md](../api-model.md)).
- Backups must cover everything that cannot be recreated (US9, R1). Photos of the owner's own dishes are in that category.

## Proposed decision

Treat a photo as a separate attachment of a recipe, not as part of the recipe JSON.

### Storage

- Image files live on disk in `DATA_DIR/photos/`, next to the SQLite file, never inside SQLite. The directory is on the same persistent volume as the database.
- The `recipes` table gets one nullable column, `photo_id` (a random UUID). The files are `photos/<photo_id>.webp` (display size) and `photos/<photo_id>-thumb.webp` (card size). The schema change is a new numbered migration; applied migrations are never edited.
- A replaced or removed photo gets a new id or `null`, so URLs can be cached forever and a changed photo is never served stale.
- A trashed recipe keeps its photo. Permanent deletion removes the files. A recipe restored from trash keeps its photo.

### API (proposal)

| Endpoint                         | Purpose                  | Success                         |
| -------------------------------- | ------------------------ | ------------------------------- |
| `PUT /api/recipes/:id/photo`     | Add or replace the photo | `200 { "photoId": string }`     |
| `DELETE /api/recipes/:id/photo`  | Remove the photo         | `204`                           |
| `GET /api/photos/:photoId`       | Display-size image       | `200` image, long-lived caching |
| `GET /api/photos/:photoId/thumb` | Card-size image          | `200` image, long-lived caching |

- The upload body is the raw image (`Content-Type: image/jpeg`, `image/png` or `image/webp`), not multipart. This needs no extra plugin, only a content type parser and a body limit on that route.
- Recipe responses and summaries gain `photoId: string | null`. `POST` and `PUT` on recipes do not accept it (unknown fields stay rejected), so saving a recipe never touches its photo.
- Creating a recipe with a photo is two steps: create the recipe, then upload. If the upload fails, the recipe exists without a photo and the form says so.
- New error codes: `unsupported_image_type` (415), `image_too_large` (413), `invalid_image` (422).

### Validation and optimisation (proposal, limits are not measured values)

- Accept JPEG, PNG and WebP. Upload limit: 10 MB raw (assumption: current phone photos are a few MB).
- Decode the image on the server, so the content is verified and not only the declared type. Reject images above a pixel limit. Strip metadata (EXIF, including GPS location) and apply the orientation.
- Re-encode to WebP: display size with a longest edge of 1600 px, thumbnail with a longest edge of 480 px. Quality around 80.
- Estimate, to be measured: 100 to 400 KB per recipe for both sizes together. 1,000 photos would use well under 1 GB, which is small next to 512 GB.
- Serve with a fixed content type from the stored format, `X-Content-Type-Options: nosniff` and no user-supplied file names.

### Processing options

| Option                                        | For                                                                             | Against                                                                                                                                                   |
| --------------------------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`sharp` on the server (proposed)**          | Server guarantees format, size and metadata removal. Thumbnails made once.      | New native dependency, like `better-sqlite3`. Needs a prebuilt arm64 glibc binary on the Pi (unconfirmed). CPU and memory use on a 2 GB Pi during upload. |
| Resize in the browser (canvas), server stores | No new backend dependency. Canvas re-encoding also drops metadata. Less Pi CPU. | The server cannot fully verify the content without an image library. Two images uploaded per photo. Quality varies by browser.                            |
| Pure JavaScript image library                 | No native binary.                                                               | Slow on a Pi 4B, and a larger memory use for large photos.                                                                                                |

If `sharp` fails the arm64 check, the browser-side option is the fallback. Dependencies need explicit approval before they are added (project rule), and `sharp` would be added to the spike checklist ([spike-pi-sqlite.md](../spike-pi-sqlite.md)).

### Export and import

- The JSON export stays as defined: active recipes only, no ids, no photos, `schemaVersion` stays `1`. The documentation and the export screen say that photos are not included.
- Import keeps rejecting unknown fields, so a file with photo fields is rejected cleanly, not partly imported.
- Photos are protected by backups of the data directory, not by JSON export. A later, optional "full backup" archive (recipes plus photos) is a separate ticket and needs its own format decision.

### Frontend (proposal)

- The create and edit forms get an optional photo field: choose a file or take a photo on a phone, a preview, a "Foto verwijderen" action and the usual Dutch error messages. A chosen photo counts as an unsaved change.
- Recipe detail shows the photo at the top. Cards show the thumbnail with fixed width and height, so the layout does not jump while loading, and `loading="lazy"`.
- Alt text is generated from the recipe title (for example "Foto van Crème brûlée"), since the owner supplies no text.
- **Fallback without a photo:** no stock or placeholder photos. A card without a photo shows a themed tile built from design tokens: the first letter of the title in the display font on a tinted surface. When no recipe in the collection has a photo, the tile is left out, so the cards stay compact.

## Consequences

If accepted:

- Requirements: photos move from "out of scope" to an approved post-MVP feature, and D15 is reworded: photos are an attachment outside the recipe model.
- [docs/api-model.md](../api-model.md) gets the endpoints, the new field and the new error codes. `apps/web/src/recipes/types.ts` follows.
- The backup and restore procedure (ticket 3.1) must include `photos/` and a consistent order of copying; see [deployment-pi.md](../deployment-pi.md).
- Tickets 4.1 (API) and 4.2 (frontend) in `docs/tickets/epic-4-post-mvp.md` apply.

## Risks

- **Native dependency on arm64:** `sharp` may not install from a prebuilt binary on the Pi. Mitigation: the check above, with the browser-side fallback.
- **Orphaned files:** a crash between writing a file and updating the database can leave unreferenced files. Mitigation: write the file first, update the database in one transaction, delete the old file last, and provide a check that lists files without a recipe.
- **Backups out of step:** a database copy and a photo copy taken at different moments can disagree. A missing file shows the fallback tile and an orphan is harmless, so restoring is safe, but the procedure must describe the order.
- **Memory:** decoding a large photo uses much more RAM than its file size. Mitigation: pixel limit, one image processed at a time, measurement on the Pi.
- **Scope creep:** galleries, several photos per recipe, crop tools and step photos are not part of this proposal.

## Unresolved decisions

- Approve the feature and the requirements change.
- Image processing option, after the arm64 check.
- Output format (WebP assumed) and the real size and quality settings after measuring on the Pi.
- Upload limit and pixel limit.
- Whether iPhone photos arrive as JPEG or HEIC through the browser file picker. This needs a test; HEIC would need conversion.
- Whether a photo-inclusive backup archive is wanted, and in which format.
- Whether trashed recipes keep photos forever (assumed, matching D10).
