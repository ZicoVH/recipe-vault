# Epic 2: Frontend integration

All UI copy is in Dutch. Keep the accessible navigation behavior in `Layout.tsx`: one `h1` per page, focus moved to the `h1` after navigation, per-page `<title>`, real links, visible focus.

## 2.1 Replace mock data with the API

Size: M. Depends on: 1.3. Covers: US2. Status: done.

Implemented with React Router loaders (`apps/web/src/recipes/loaders.ts`), a Dutch error page with a retry button, a loading line and a first-load fallback. Trashed recipes show the not-found page until ticket 2.3. Title search is still client-side (ticket 2.4 moves it to the API). `apps/api/seed/sample-recipes.json` holds the former mock recipes for development. Verified with the real loaders and rendered pages against a live API, not in a browser.

- Overview and detail load from the API.
- Loading and error states are shown in Dutch.
- Not-found behavior and accessible navigation are unchanged.

## 2.2 Create and edit recipe form

Size: L. Depends on: 1.3, 1.4. Covers: US1, US3, US6. Status: done.

Routes `/recepten/nieuw` and `/recepten/:recipeId/bewerken`, built with React Router actions. Steps move with Omhoog and Omlaag buttons (no drag and drop). Blank ingredient and step rows are ignored on save. Verified with a jsdom test of the real app against a live API (about 50 checks, including failure cases) and not in a real browser: the layout at 360 px, touch use and screen reader output still need a manual check.

- Required fields are validated and errors appear in Dutch.
- Ingredients can be added and removed, with optional quantity and unit.
- Steps can be reordered with a keyboard-accessible control.
- Tags can be added and removed.
- Usable from 360 px width and touch-friendly, with visible focus.

## 2.3 Delete, trash and restore UI

Size: M. Depends on: 1.5. Covers: US4. Status: done.

Delete is a button at the bottom of the recipe page: one click, no confirmation, and it opens the trash view so the recipe can be restored at once. The trash view (`/prullenbak`) lists deleted recipes, newest first, with Terugzetten and Definitief verwijderen. Permanent delete asks inline first (cancel comes before confirm). There is no empty-trash action (D18). Verified with a jsdom test of the real app against a live API (about 35 checks, including failure and stale cases), not in a real browser.

- Delete asks for no confirmation but is reversible from the trash view.
- The trash view lists deleted recipes with restore and permanent delete.
- Permanent delete requires explicit confirmation.

## 2.4 Extend search to ingredients and tags

Size: S. Depends on: 1.6. Covers: US5.

- The existing `?q=` behavior is kept.
- An empty result shows a clear Dutch message.
- An optional tag filter follows the decision in 0.3.

## 2.5 Export and import UI

Size: M. Depends on: 1.7. Covers: US7, US8.

- Export downloads the JSON file.
- Import shows a Dutch success message with the count, or a clear rejection message.

## 2.6 Warn about unsaved changes in the recipe form

Size: S. Depends on: 2.2. Covers: US1, US3.

- Leaving the create or edit page with unsaved changes asks for confirmation. This covers Annuleren, any link and the browser back button.
- Staying keeps everything the user typed.
- There is no warning when nothing was changed, or after a successful save.
- The question is in Dutch and works with the keyboard and a screen reader.
- Removing a step or ingredient can be undone, or asks for confirmation (to be decided).
