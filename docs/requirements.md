# Recipe Vault: MVP Requirements

Status: approved MVP requirements baseline.

## Context

Recipe Vault is a personal recipe manager (React + TypeScript). The repo is currently an empty scaffold. This document captures agreed MVP requirements only. It is not an architecture or implementation plan.

## Scope

**In scope (MVP):** recipe CRUD, tags, search, trash with restore, JSON export/import, documented backup and restore, persistent storage on a Raspberry Pi 4B in Docker.

**Out of scope (later):** photos, cooking mode, quantity scaling, shopping lists, URL import, authentication and user management, offline/PWA, imperial units, multi-language UI, scheduled backups.

## Decisions

| ID  | Decision                                                                                                                                                         |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Single user, no accounts. No auth or user management in the MVP.                                                                                                 |
| D2  | Remote access is secured at network level (e.g. VPN). No app-level auth.                                                                                         |
| D3  | A backend and database run on the Pi in Docker. This reverses the "no backend" note in CLAUDE.md and README, which must be updated.                              |
| D4  | Offline use is nice to have, not required.                                                                                                                       |
| D5  | Ingredients may have an optional quantity and unit, and must allow free expressions such as "a pinch of salt". Exact modeling is defined in architecture design. |
| D6  | Metric units only. UI in Dutch. Recipe content in any language. Code and technical docs in English.                                                              |
| D7  | Organization via free-form tags only.                                                                                                                            |
| D8  | Prep time and cook time, both optional.                                                                                                                          |
| D9  | Search covers title, ingredient name and tags. Search is case-insensitive and accent-insensitive.                                                                |
| D10 | Deleting a recipe moves it to trash, from which it can be restored. There is no automatic purge in the MVP.                                                      |
| D11 | JSON import adds recipes as new and never overwrites existing ones.                                                                                              |
| D12 | Servings are a positive whole number.                                                                                                                            |
| D13 | Tags are trimmed. Duplicates are prevented regardless of case.                                                                                                   |
| D14 | The mobile layout supports screens from 360 px width.                                                                                                            |
| D15 | The data model is not designed around future photos or multi-user support. It is not to be over-engineered for them.                                             |
| D16 | Backend technology and database selection stay open for architecture design.                                                                                     |
| D17 | Selecting several tags filters with AND: a recipe matches only if it has all selected tags.                                                                      |
| D18 | The trash has no "empty trash" action in the MVP. Recipes are permanently deleted one at a time, with explicit confirmation.                                     |

## Post-MVP candidates (not approved)

The items below are proposals, not part of the approved baseline above. None changes a decision until it is approved. Each has a design document.

| Candidate                       | Relation to the baseline                                                                         | Document                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| Recipe photos (optional)        | "Out of scope (later)". Would reword D15: photos are an attachment, not part of the recipe model | [ADR 0002](adr/0002-recipe-photos.md)                    |
| Remote access with Tailscale    | Refines D2 (VPN). The VPN choice is still open in ADR 0001                                       | [remote-access-tailscale.md](remote-access-tailscale.md) |
| Installable PWA                 | "Offline/PWA" is out of scope (later)                                                            | [pwa-and-offline.md](pwa-and-offline.md)                 |
| Offline read-only, then editing | D4: nice to have, not required                                                                   | [pwa-and-offline.md](pwa-and-offline.md)                 |
| Scheduled backups               | Out of scope today. ADR 0001 suggests revisiting                                                 | [deployment-pi.md](deployment-pi.md)                     |

## User stories and acceptance criteria

**US1 Create recipe.** As the owner, I can create a recipe with title, servings, ingredients, steps, optional prep/cook time and tags.

- Title and servings are required. Servings is a positive whole number.
- An ingredient has a name. Quantity and unit are optional. Free expressions such as "a pinch of salt" are possible.
- Steps are an ordered list and the order can be changed.
- The recipe persists after page reload and container restart.

**US2 View recipe.** I can read a recipe comfortably on a phone.

- Ingredients, steps, times, servings and tags are shown.
- The layout is usable from 360 px width without horizontal scrolling.

**US3 Edit recipe.** I can change any field of an existing recipe.

- Changes persist. Invalid input shows Dutch error messages and is not saved.

**US4 Delete and restore.** I can delete a recipe and restore it from trash.

- Deleted recipes disappear from the list and from search, and appear in trash.
- Restore returns the recipe with all data intact.
- Permanent deletion from trash is manual, one recipe at a time, and needs explicit confirmation. There is no "empty trash" action (D18).
- Nothing is purged automatically.

**US5 Search and filter.** I can find recipes by title, ingredient name and tags.

- Matching is case-insensitive and accent-insensitive.
- Trashed recipes are excluded.
- When several tags are selected, only recipes that have all of them match (D17).
- An empty result shows a clear Dutch message.

**US6 Tags.** I can add and remove free-form tags.

- Tags are trimmed. A tag that duplicates an existing one, ignoring case, is not created twice.

**US7 Export.** I can download my recipes as one JSON file.

- The export contains active recipes only (no trash).
- The file includes a schema version.

**US8 Import.** I can upload a JSON export.

- All recipes are added as new. None are overwritten or deleted.
- Files with an unsupported schema version, or invalid content, are rejected with a clear message and change nothing.
- The result reports how many recipes were added.

**US9 Backup and restore.** Documentation describes how to back up and restore the data on the Pi.

- It states explicitly that Docker persistent storage is not a substitute for backups.
- The procedure is tested once end-to-end: backup, wipe, restore, verify.

**US10 Persistence on Pi.** The app runs in Docker on ARM64.

- Data is on persistent storage and survives container restart, image update and Pi reboot.

## Non-functional requirements

- Mobile-first, responsive, touch-friendly, from 360 px width.
- Acceptable responsiveness on a Raspberry Pi 4B. A concrete target is set in architecture design.
- No external network dependency at runtime.
- The backend is not exposed directly to the internet. It relies on D2.

## Risks and dependencies

- R1: Docker persistent storage protects against restarts and updates, not against SD card failure, corruption or accidental deletion. Export (US7) and backups (US9) are the protection.
- R2: With no app-level auth, network-level security is the only protection. A misconfiguration exposes all data.
- R3: Flexible ingredient expressions complicate later scaling and shopping lists. Rules are needed when those features start.
- R4: Backend and database choice are open (D16).
- R5: CLAUDE.md and README must be updated when the backend is introduced.
- R6: A Dutch UI with recipe content in any language may need care in sorting and accent handling beyond search.

## Open questions

- Performance target for collection size and search speed (architecture design).
