# Recipe Vault: Tickets

Derived from `docs/requirements.md` (MVP baseline) and `docs/spike-pi-sqlite.md`. Sizes (S/M/L) are rough estimates, not measured. Status values: `todo`, `doing`, `done`.

## Index

| ID  | Title                                   | Size | Depends on | Covers        | Status |
| --- | --------------------------------------- | ---- | ---------- | ------------- | ------ |
| 0.1 | Finalize spike criteria                 | S    | -          | -             | done   |
| 0.2 | Run the spike and write the ADR         | M    | 0.1, SSD   | D16, R4       | todo   |
| 0.3 | Resolve open questions                  | S    | -          | -             | done   |
| 0.4 | Define the data and API model           | M    | 0.2        | D5, D15       | done   |
| 0.5 | Update project documentation            | S    | 0.2        | D3, R5        | todo   |
| 0.6 | Restructure repo into npm workspaces    | M    | -          | ADR layout    | done   |
| 1.1 | Backend skeleton and persistent storage | M    | 0.4        | US10          | done   |
| 1.2 | Docker image for ARM64 and deploy to Pi | M    | 1.1        | US10, R2      | done   |
| 1.3 | Recipe CRUD API                         | L    | 1.1        | US1, US3      | done   |
| 1.4 | Tags in the API                         | S    | 1.3        | US6, D13      | done   |
| 1.5 | Trash API                               | M    | 1.3        | US4, D10      | done   |
| 1.6 | Search API                              | M    | 1.3, 1.5   | US5, D9       | todo   |
| 1.7 | Export and import API                   | M    | 1.3        | US7, US8      | done   |
| 2.1 | Replace mock data with the API          | M    | 1.3        | US2           | done   |
| 2.2 | Create and edit recipe form             | L    | 1.3, 1.4   | US1, US3, US6 | todo   |
| 2.3 | Delete, trash and restore UI            | M    | 1.5        | US4           | done   |
| 2.4 | Extend search to ingredients and tags   | S    | 1.6        | US5           | todo   |
| 2.5 | Export and import UI                    | M    | 1.7        | US7, US8      | todo   |
| 3.1 | Backup and restore procedure            | M    | 1.2        | US9, R1       | todo   |

## Files

- [epic-0-foundations.md](epic-0-foundations.md): decision gate before any backend work
- [epic-1-backend.md](epic-1-backend.md): backend, storage and deployment
- [epic-2-frontend.md](epic-2-frontend.md): frontend integration
- [epic-3-operations.md](epic-3-operations.md): backup and restore

## Suggested order

1. 0.6 (done), 0.1 (done), then 0.2, then 0.4. Everything else depends on the ADR. 0.3 can run in parallel.
2. Epics 1 and 2 can then overlap. 2.1 starts once 1.3 is available.
3. 3.1 follows 1.2.

## Assumptions, risks and dependencies

- **Assumption:** Node.js + SQLite is the likely outcome but stays provisional until the ADR. Backend tickets are technology-neutral.
- **Risk:** the SSD is not installed. Without it, 0.2 cannot give a valid "go", and the Pi tickets slip.
- **Risk (R2):** no app-level auth. A network misconfiguration in 1.2 exposes all data.
- **Risk (R3):** free-text ingredient amounts complicate scaling later. Out of MVP scope.
- **Dependency:** 3.1 needs a second storage device. The Pi's current setup may only offer the same card.

## Current frontend state

US2 (view) and the title-only part of US5 (search) exist on mock data. Everything else, including the backend, is open.
