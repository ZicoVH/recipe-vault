# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Recipe Vault: a personal recipe collection app ("Your personal recipe collection"). Requirements are in `docs/requirements.md`, which is the source of truth for scope and decisions.

Current state: a React 19 + TypeScript frontend (Vite, npm) with a recipe overview page: a responsive grid of recipe cards (title, optional prep/cook time, tags) in Dutch, fed by mock data. Code lives in `src/recipes/`: components take recipes as props, and only `src/App.tsx` imports `mockRecipes.ts`. Styling uses CSS Modules plus tokens in `src/index.css`. The `Recipe` type in `src/recipes/types.ts` is a minimal overview model, not the final recipe model or an API contract.

Not implemented yet: recipe details, search, filters, forms, CRUD, routing, persistence, API calls and the backend. Do not add them unless asked.

Planned (not implemented): a backend and database, deployed with Docker on a Raspberry Pi 4B (ARM64) with persistent storage. The backend technology and database are not selected yet and are decided in a separate architecture design step; do not pick or install them unprompted. The UI is in Dutch; code and technical docs stay in English. There is no AI API integration; Claude Code is only the development tool.

## Commands

- `npm run dev` — Vite dev server with HMR
- `npm run build` — `tsc -b` then `vite build` (type errors fail the build)
- `npm run lint` — ESLint (`eslint .`)
- `npm run format` / `npm run format:check` — Prettier write / check
- Before finishing a change, run lint, `format:check` and build.

There is no test runner yet (no Vitest or Testing Library). Do not add one unless asked.

## Tooling notes

- ESLint uses the flat config in `eslint.config.js` (JS, typescript-eslint, React Hooks and React Refresh recommended rules). `eslint-config-prettier` is last in `extends` so it overrides style rules; keep it last.
- Prettier style is no semicolons and single quotes (`.prettierrc`).
- The template originally shipped with Oxlint, which was replaced by ESLint. Do not reintroduce it.
- TypeScript is split into project references: `tsconfig.app.json` (`src`, strict-style flags) and `tsconfig.node.json` (Vite config). `tsc -b` checks both.
- `tsconfig.app.json` sets `verbatimModuleSyntax` (use `import type` for type-only imports) and `erasableSyntaxOnly` (no enums, namespaces or constructor parameter properties).
- `noUnusedLocals` and `noUnusedParameters` are on, so unused variables fail the build.
