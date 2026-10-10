# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Recipe Vault: a personal recipe collection app ("Your personal recipe collection"). Requirements are in `docs/requirements.md`, which is the source of truth for scope and decisions.

Current state: a React 19 + TypeScript frontend (Vite, npm) in Dutch, fed by mock data. It has a recipe overview (responsive grid of cards) and a recipe detail page (servings, optional prep/cook time, tags, ingredients, ordered steps). Routing uses React Router (data mode, `createBrowserRouter`) configured in `src/App.tsx`: `/` is the overview, `/recepten/:recipeId` the detail page, and unknown paths or ids show a Dutch not-found page. `Layout.tsx` moves focus to the page `h1` after navigation and restores scroll; each page sets its own `<title>`. Keep this accessible navigation behavior when adding routes: one `h1` per page, real links, visible focus.

Code lives in `src/` and `src/recipes/`. Components take recipes as props, and only `src/App.tsx` imports `mockRecipes.ts`. Styling uses CSS Modules plus tokens in `src/index.css`. The `Recipe` type in `src/recipes/types.ts` is a temporary frontend model for mock data, not the final recipe model or an API contract. Ingredient amounts are free display text, so scaling is not supported yet.

Not implemented yet: search, filters, forms, CRUD, persistence, API calls and the backend. Do not add them unless asked. Any server that hosts the built app must fall back to `index.html` for unknown paths so deep links like `/recepten/<id>` work. `react-router` 8 needs Node 22.22 or newer.

Planned (not implemented): a backend and database, deployed with Docker on a Raspberry Pi 4B (ARM64) with persistent storage. The backend technology and database are not selected yet and are decided in a separate architecture design step; do not pick or install them unprompted. The UI is in Dutch; code and technical docs stay in English. There is no AI API integration; Claude Code is only the development tool.

## Commands

- `npm run dev` — Vite dev server with HMR
- `npm run build` — `tsc -b` then `vite build` (type errors fail the build)
- `npm run lint` — ESLint (`eslint .`)
- `npm run format` / `npm run format:check` — Prettier write / check
- Before finishing a change, run lint, `format:check` and build.
- After meaningful frontend changes (anything beyond trivial edits in `src/`) and before committing, run the `frontend-reviewer` subagent (`.claude/agents/frontend-reviewer.md`). It is read-only and does not run the build, so run the build yourself. Triage its findings and report them; do not apply fixes the user has not approved.

There is no test runner yet (no Vitest or Testing Library). Do not add one unless asked.

## Tooling notes

- ESLint uses the flat config in `eslint.config.js` (JS, typescript-eslint, React Hooks and React Refresh recommended rules). `eslint-config-prettier` is last in `extends` so it overrides style rules; keep it last.
- Prettier style is no semicolons and single quotes (`.prettierrc`).
- The template originally shipped with Oxlint, which was replaced by ESLint. Do not reintroduce it.
- TypeScript is split into project references: `tsconfig.app.json` (`src`, strict-style flags) and `tsconfig.node.json` (Vite config). `tsc -b` checks both.
- `tsconfig.app.json` sets `verbatimModuleSyntax` (use `import type` for type-only imports) and `erasableSyntaxOnly` (no enums, namespaces or constructor parameter properties).
- `noUnusedLocals` and `noUnusedParameters` are on, so unused variables fail the build.
