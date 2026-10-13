# Installable app (PWA) and offline support

Status: FUTURE ENHANCEMENT, not implemented and not part of the MVP. The requirements list "offline/PWA" as out of scope (later) and D4 says offline use is nice to have, not required. Nothing in the app registers a service worker or has a manifest today.

Points marked "verify" come from general knowledge of browser behaviour, not from this project. Test them on the real devices before relying on them.

## Phases

| Phase | Name                     | Status                    | Needs a decision on                              |
| ----- | ------------------------ | ------------------------- | ------------------------------------------------ |
| 1     | Installable PWA          | Planned later             | Tooling and a new dependency, HTTPS (ticket 4.3) |
| 2     | Offline read-only access | Nice-to-have              | Storage approach, sync endpoint (ticket 4.4)     |
| 3     | Offline editing and sync | Nice-to-have, not planned | Conflict handling, API changes (ticket 4.5)      |

Each phase stands on its own. Do not start phase 2 or 3 before the previous phase works and is used.

## Phase 1: installable PWA

### HTTPS

- Service workers and installability need a secure context: HTTPS, or `localhost` for development. A plain `http://` address on the home network or the tailnet does not qualify.
- The plan is HTTPS through Tailscale ([remote-access-tailscale.md](remote-access-tailscale.md)). A PWA is therefore blocked on ticket 3.3.

### Manifest and icons

- A web app manifest with: name "Recipe Vault", a short name, `lang: nl`, `start_url` and `scope` `/`, `display: standalone`, `theme_color` and `background_color`.
- Icons: 192 and 512 px PNG, plus a maskable 512 px icon, and a separate 180 px Apple touch icon for iOS. The icons need a design, and no stock artwork.
- The colours depend on the final theme. The three themes are still an experiment, so choose the manifest colours after one is picked. A manifest has one static theme colour, while the `theme-color` meta tag can change at runtime.

### Installing on Android and iOS

- **Android (Chrome):** the browser offers "Install app" or "Add to Home screen" when the manifest and HTTPS requirements are met (verify the current criteria, including whether a service worker is required). The app opens without the browser bar.
- **iOS (Safari):** installation is manual through Share, then "Add to Home Screen" (verify whether other iOS browsers can do this in the current version). The icon comes from the Apple touch icon. iOS has no install prompt, so the app could show a short Dutch hint on how to install it.
- Test both on real phones. Support and storage rules differ between platforms and versions.

### Service worker strategy

- Phase 1 needs only a minimal service worker. **Precache the app shell** (the Vite build files, which have hashed names) and **fall back to `index.html`** for navigations. Do **not** cache API responses yet, so users never see stale recipes by surprise.
- `index.html` must never be served from a cache without checking the network, or users get stuck on an old version.
- Tooling (open decision): `vite-plugin-pwa` (uses Workbox) or a hand-written worker. A plugin saves work and adds a dependency, so it needs approval first.

### Update handling

- A new version installs in the background and waits. The app then shows a Dutch message such as "Nieuwe versie beschikbaar. Vernieuwen" and activates it on request.
- Do not take over automatically (`skipWaiting`) while a recipe form is open. A reload would drop unsaved input. This ties in with the existing unsaved-changes warning in the form.
- The Docker update procedure ([deployment-pi.md](deployment-pi.md)) and the worker update must work together: after an image update, phones pick up the new version the next time they open the app online.

### Mobile usability in standalone mode

- There is no browser back button or address bar in a standalone app. The app already has visible back links on its pages. Check every page for a way back, and check that the leave warning in the form still works.
- Handle device safe areas (`viewport-fit=cover` and safe-area insets) for notched phones.
- Keep the 360 px layout and the touch target sizes (D14).
- Check each theme's contrast in the standalone window, including the Midnight theme at night.
- Keeping the screen awake is a "cooking mode" feature and is out of scope.

## Phase 2: offline read-only access

Goal: open previously viewed recipes with no connection, for example in a supermarket with poor reception.

### What to cache

- The app shell (phase 1).
- Recipe detail responses and the overview list, so a recipe opened before can be opened again offline.
- Images (only if photos exist, [ADR 0002](adr/0002-recipe-photos.md)): thumbnails always, display-size images when viewed, with a size cap. The cap is a setting to choose, for example tens of MB on a phone. This is a proposal, not a measured value.

### Storage options

| Option                         | Good for                                                      | Limits                                                                                                      |
| ------------------------------ | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Cache Storage (service worker) | Whole HTTP responses and images, simple "serve the last copy" | No querying. Offline search and filtering would need extra work                                             |
| IndexedDB                      | Structured recipe data, queries, offline search and filter    | More code. Needs a client-side search that matches the server's case- and accent-insensitive behaviour (D9) |
| `localStorage`                 | Small settings only                                           | Synchronous, small quota. Not suitable for recipes                                                          |
| Origin private file system     | Large files                                                   | Not needed here                                                                                             |

**Proposal:** Cache Storage for images and responses, and IndexedDB only if offline search is wanted. Start with Cache Storage and a "network first, fall back to cache" rule for recipe reads.

### Cache invalidation and limits

- Recipes carry `updatedAt` and `deletedAt`. The cache can be refreshed when the app is open and online, and use ETags or a "changed since" request. A "changed since" endpoint does not exist yet and would be a new API ticket.
- Cached recipes that were moved to the trash or deleted elsewhere must disappear from the cache at the next online refresh.
- Browsers limit storage, and may delete it under pressure. Safari may remove site data after a period without use (verify, and check whether installed apps are exempt). Use the storage estimate API to show usage, and ask for persistent storage where supported (verify).
- Show clearly when data is offline and when it was last updated, in Dutch.

### Synchronisation when connectivity returns

- Read-only sync is a refresh: when the app opens or the connection returns, refetch the list and the recipes in view. Background sync is not available in every browser (verify, especially iOS), so do not depend on it.

### Privacy and security of cached data

- Cached recipes sit on the phone in the browser's storage and are not protected by the app. Whoever can unlock the phone, or read the browser profile, can read them. They also stay after the phone is removed from the tailnet.
- Offer a "clear offline data" action. Do not cache anything beyond recipe content and images, and never cache backups or exports.
- Use the same origin and HTTPS only, so a cached response cannot be replaced by another site.

## Phase 3: offline editing and synchronisation (optional)

This is the hardest part and a separate decision. Reasons it is not planned:

- **Lost updates:** `PUT /api/recipes/:id` replaces the whole recipe. If a recipe is edited offline on the phone and online on another device, one edit overwrites the other. A fix needs a version check in the API, for example sending the `updatedAt` that was read, and answering `409` on a mismatch.
- **Ids and creation:** the server owns ids and timestamps (API principles). Recipes created offline need a temporary local id and a mapping after sync.
- **Queue of changes:** edits are stored in a local queue and sent in order when the connection returns. Failures, partial syncs and retries need clear Dutch feedback.
- **Deletes and restores:** trashing a recipe on one device while another edits it needs a rule.
- **Conflict policy:** options are "last write wins" (simple, can lose data), "ask the user" (safer, more UI) or field-level merging (complex). With one user and mostly one device in use at a time, "ask the user on a mismatch" is likely enough. This is a proposal.
- **Photos:** uploads queue up as well, and can be large.
- Single-user data and a few devices make conflicts rare, which is the main argument for keeping this simple, or for not building it.

## Related

- [requirements](requirements.md): D4, D14, scope list
- [remote-access-tailscale.md](remote-access-tailscale.md): HTTPS
- [ADR 0002](adr/0002-recipe-photos.md), [deployment-pi.md](deployment-pi.md)
- Tickets 4.3, 4.4, 4.5 in [docs/tickets](tickets/README.md)
