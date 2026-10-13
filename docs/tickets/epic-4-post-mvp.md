# Epic 4: Post-MVP candidates

Status: proposed. These tickets are not part of the approved MVP baseline in [requirements.md](../requirements.md). They need an explicit decision before work starts. Each one links to the document that describes it. Sizes are rough estimates, not measured.

## 4.1 Recipe photos: storage and API

Size: L. Depends on: 1.3, 0.2, and [ADR 0002](../adr/0002-recipe-photos.md) accepted. Status: not started.

- Photos are stored as files in the data directory, with a reference in SQLite. Photos are optional.
- Upload validates type, size and content. Images are resized and stripped of metadata.
- Add, replace and remove a photo through separate endpoints. Saving a recipe never changes its photo.
- Permanent delete removes the files. Trash and restore keep the photo.
- JSON export and import stay as defined and the docs say that photos are not included.
- `docs/api-model.md` and `apps/web/src/recipes/types.ts` are updated.
- The arm64 install of the image library is checked on the Pi.

## 4.2 Recipe photos: frontend

Size: M. Depends on: 4.1, 2.2. Status: not started.

- The create and edit forms can add, replace and remove a photo, with a preview and Dutch error messages.
- Cards and the detail page show the photo. A recipe without a photo shows a themed fallback tile, with no stock or placeholder images.
- The layout does not jump while images load. Alt text comes from the title.
- Works in all themes from 360 px width.

## 4.3 Installable PWA

Size: M. Depends on: 3.3 (HTTPS), a final theme. Status: not started.

- Manifest, icons, a minimal service worker for the app shell, and a Dutch update message that never reloads an open form.
- Installable on Android and iOS, verified on real phones.
- Described in [pwa-and-offline.md](../pwa-and-offline.md), phase 1. A tooling dependency needs approval.

## 4.4 Offline read-only access

Size: L. Depends on: 4.3. Nice-to-have, not required (D4). Status: not started.

- Previously viewed recipes can be opened without a connection, with a clear offline indicator and last-updated time.
- Cache limits, invalidation and a "clear offline data" action.
- Described in [pwa-and-offline.md](../pwa-and-offline.md), phase 2.

## 4.5 Offline editing and synchronisation

Size: L. Depends on: 4.4. Nice-to-have, not planned. Status: not started.

- Needs a conflict policy and a version check in the API before any code.
- Described in [pwa-and-offline.md](../pwa-and-offline.md), phase 3.
