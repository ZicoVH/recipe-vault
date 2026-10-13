# Epic 0: Foundations (decision gate)

## 0.1 Finalize spike criteria

Size: S. Depends on: none.

- Numeric thresholds are agreed for max container RAM, min free system memory, max start time, max search latency, and max backup/restore duration.
- The seed dataset is defined (about 500 recipes, language mix, accents).
- The doc states that SSD results are required for "go" and microSD is informational.
- `docs/spike-pi-sqlite.md` is updated and no TBD remains.

## 0.2 Run the spike and write the ADR

Size: M. Depends on: 0.1 and the SSD install.

- All 6 checklist checks have a recorded result, pass or fail, per environment, with the environment details the spike lists.
- Check 7 (fallbacks) is done only if check 1 or 2 fails.
- The ADR names the backend and database, with a go/no-go and the open risks.
- No other services on the Pi are disrupted during the test.

## 0.3 Resolve open questions

Size: S. Depends on: none.

- Tag filter semantics (AND or OR) are decided. The proposed default is AND.
- It is decided whether the UI has an "empty trash" action or only per-recipe permanent delete.
- Decisions are recorded in `docs/requirements.md`.

## 0.4 Define the data and API model

Size: M. Depends on: 0.2 (proceeded provisionally on the proposed ADR). Status: done, see `docs/api-model.md`.

- The ingredient model supports a name, optional quantity and unit, and free expressions (D5).
- The recipe model covers servings (positive integer), optional prep/cook time, ordered steps, tags and a trashed state.
- The export format includes a schema version.
- The API contract is documented, and the frontend `Recipe` type is marked for replacement.
- The model is not built around photos or multi-user (D15).

## 0.5 Update project documentation

Size: S. Depends on: 0.2.

- `CLAUDE.md` and `README.md` no longer say "no backend" (D3, R5).
- The chosen technology and its commands are documented briefly.

## 0.6 Restructure repo into npm workspaces

Size: M. Depends on: none. Status: done.

- The frontend lives in `apps/web` and keeps its Git history (`git mv`).
- The root `package.json` defines the workspaces. ESLint, Prettier and TypeScript stay at the root.
- `npm run check` (lint, format check, build) passes and the build output is unchanged.
- The format/lint hook, permission rules, `CLAUDE.md` and `README.md` use the new paths.
- `apps/api` is not created here. That happens in ticket 1.1.
