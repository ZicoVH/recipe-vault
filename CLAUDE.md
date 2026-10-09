# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Client-side React 19 + TypeScript SPA built with Vite (npm). No backend and no AI API integration; Claude Code is only the development tool. The app is still the Vite starter (`src/App.tsx`, entry at `src/main.tsx`).

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
