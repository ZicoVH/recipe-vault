# Epic 1: Backend and deployment

Technology-neutral until the ADR (ticket 0.2) is accepted.

## 1.1 Backend skeleton and persistent storage

Size: M. Depends on: 0.4. Covers: US10. Status: done.

Implemented in `apps/api`: Fastify, `better-sqlite3`, numbered SQL migrations, `node:test`. Provisional until ADR 0001 is accepted.

- The backend starts, serves a health endpoint and stores data on a configurable volume.
- Data survives a process restart.
- It runs with no external network access at runtime.

## 1.2 Docker image for ARM64 and deploy to Pi

Size: M. Depends on: 1.1. Covers: US10, R2.

- The image is built for arm64 off the Pi, with no compile step on the Pi.
- The app runs on the Pi in Docker with the data on persistent storage.
- Data survives container restart, image update and Pi reboot, each verified.
- The backend is not published to the internet (D2, R2).
- The server falls back to `index.html` for unknown paths so deep links work.

## 1.3 Recipe CRUD API

Size: L. Depends on: 1.1. Covers: US1, US3. Status: done.

Implemented: `POST`, `GET`, `PUT /api/recipes` and the active-recipe list, with the validator in `apps/api/src/recipes/validation.ts`. Delete and trash come in 1.5, search in 1.6.

- Create requires a title and servings. Servings must be a positive whole number.
- Ingredient quantity and unit are optional, and free expressions are accepted.
- Steps keep their order.
- Invalid input returns a clear validation error and nothing is saved.
- Updates persist.

## 1.4 Tags in the API

Size: S. Depends on: 1.3. Covers: US6, D13. Status: done.

Trimming and case-insensitive deduplication are in the shared validator (ticket 1.3). This ticket added `GET /api/tags`, which lists tags of active recipes with counts, grouped ignoring case.

- Tags are trimmed.
- A tag that duplicates an existing one, ignoring case, is not created twice.

## 1.5 Trash API

Size: M. Depends on: 1.3. Covers: US4, D10. Status: done.

Endpoints: `DELETE /api/recipes/:id`, `GET /api/trash`, `POST /api/trash/:id/restore`, `DELETE /api/trash/:id`. There is no purge code, so nothing is removed automatically.

- Delete moves a recipe to trash. Restore returns it with all data intact.
- Permanent delete works only on trashed recipes.
- Nothing is purged automatically.

## 1.6 Search API

Size: M. Depends on: 1.3, 1.5. Covers: US5, D9. Status: done.

Implemented with SQLite FTS5 (`unicode61 remove_diacritics 2`) in migration 0003. Ligatures (œ, æ, ß, ø) are folded in `apps/api/src/recipes/search.ts`. The latency target from the spike is not measured here, only on the Pi.

- Search covers title, ingredient name and tags.
- Matching ignores case and accents. For example, "creme brulee" finds "Crème brûlée".
- Trashed recipes are excluded.
- Latency meets the target set in 0.1.

## 1.7 Export and import API

Size: M. Depends on: 1.3. Covers: US7, US8, D11.

- Export returns active recipes only, in one JSON file with a schema version.
- Import adds all recipes as new and never overwrites or deletes.
- Unsupported versions or invalid content are rejected with a clear message and change nothing.
- The import result reports how many recipes were added.
