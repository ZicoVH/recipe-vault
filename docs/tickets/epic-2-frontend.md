# Epic 2: Frontend integration

All UI copy is in Dutch. Keep the accessible navigation behavior in `Layout.tsx`: one `h1` per page, focus moved to the `h1` after navigation, per-page `<title>`, real links, visible focus.

## 2.1 Replace mock data with the API

Size: M. Depends on: 1.3. Covers: US2.

- Overview and detail load from the API.
- Loading and error states are shown in Dutch.
- Not-found behavior and accessible navigation are unchanged.

## 2.2 Create and edit recipe form

Size: L. Depends on: 1.3, 1.4. Covers: US1, US3, US6.

- Required fields are validated and errors appear in Dutch.
- Ingredients can be added and removed, with optional quantity and unit.
- Steps can be reordered with a keyboard-accessible control.
- Tags can be added and removed.
- Usable from 360 px width and touch-friendly, with visible focus.

## 2.3 Delete, trash and restore UI

Size: M. Depends on: 1.5. Covers: US4.

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
