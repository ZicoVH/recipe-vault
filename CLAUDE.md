# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Recipe Vault: a personal recipe collection app. Requirements are in `docs/requirements.md`, the source of truth for scope and decisions. Read it only when a task needs it.

Current state: a React 19 + TypeScript frontend (Vite, npm) in Dutch, fed by mock data. Routing is React Router data mode (`createBrowserRouter`) in `apps/web/src/App.tsx`. Keep the accessible navigation behavior in `Layout.tsx` when adding routes: one `h1` per page, focus moved to the `h1` after navigation, each page sets its own `<title>`, real links, visible focus.

Conventions:

- The repo is an npm workspaces monorepo: `apps/web` (frontend) and, once created, `apps/api` (backend). Shared tooling configs (ESLint, Prettier) are at the root. `spike/` is throwaway and not a workspace.
- Frontend code lives in `apps/web/src/` and `apps/web/src/recipes/`. Components take recipes as props; only `apps/web/src/App.tsx` imports `mockRecipes.ts`.
- Styling uses CSS Modules plus tokens in `apps/web/src/index.css`.
- The `Recipe` type in `apps/web/src/recipes/types.ts` is a temporary model for mock data, not the final model or an API contract. Ingredient amounts are free display text, so scaling is not supported.
- The UI is in Dutch; code and technical docs stay in English.

Not implemented yet: search on ingredients and tags, tag filters, forms, CRUD, persistence, API calls and the backend. Do not add them unless asked.

Planned: a backend and database, deployed with Docker on a Raspberry Pi 4B (ARM64) with persistent storage. The technology is decided in a separate architecture step; do not pick or install it unprompted. Any server hosting the built app must fall back to `index.html` for unknown paths so deep links like `/recepten/<id>` work. There is no AI API integration; Claude Code is only the development tool.

## Commands

- `npm run dev` — frontend Vite dev server with HMR
- `npm run check` — lint, `format:check` and build in one go (type errors fail the build)
- `npm run format` — Prettier write
- Before finishing a change, run `npm run check`.
- A hook runs Prettier and ESLint on each edited `.ts`/`.tsx`/`.css` file in `apps/*/src/` and reports problems.
- After meaningful frontend changes (beyond trivial edits in `apps/web/src/`) and before committing, run the `frontend-reviewer` subagent (`.claude/agents/frontend-reviewer.md`). It is read-only and does not run the build. Triage its findings and report them; do not apply fixes the user has not approved.

There is no test runner yet. Do not add one unless asked.

## Tickets

Tickets live in `docs/tickets/` (index and status in `README.md`, one file per epic). Work one ticket at a time. After finishing each ticket and before starting the next: set its status to `done` in the index, run the relevant checks, then commit and push to `origin/main`. The user authorized this standing commit and push per ticket. Use a clear commit message in the form `type: summary (ticket X.Y)` with a short body of what changed. Do not batch several tickets into one commit.

## Tooling notes

- ESLint uses the flat config in `eslint.config.js`. `eslint-config-prettier` is last in `extends`; keep it last. Do not reintroduce Oxlint.
- Prettier: no semicolons, single quotes (`.prettierrc`).
- TypeScript project references in `apps/web`: `tsconfig.app.json` (`src`) and `tsconfig.node.json` (Vite config); `tsc -b` checks both.
- `verbatimModuleSyntax` (use `import type`) and `erasableSyntaxOnly` (no enums, namespaces or constructor parameter properties) are on.
- `noUnusedLocals` and `noUnusedParameters` are on, so unused variables fail the build.
- `react-router` 8 needs Node 22.22 or newer.
