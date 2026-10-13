# Recipe Vault

Your personal recipe collection.

Recipe Vault is a personal recipe manager for creating, editing, organizing and searching your own recipes. It is meant to be mobile-friendly for use while cooking.

## Status

Early development. The frontend is a React + TypeScript app built with Vite, in Dutch, using mock data bundled with the app. It has:

- A recipe overview: a responsive grid of recipe cards with title, optional preparation and cooking time, and tags. A search field filters the cards by title only, ignoring case and accents. The query is kept in the URL as `?q=`.
- A recipe detail page at `/recepten/<id>` with servings, times, tags, ingredients and ordered steps. Direct links and bookmarks work, and unknown recipes show a not-found page.

Routing uses [React Router](https://reactrouter.com). Only title search is implemented. Searching on ingredients and tags (part of the MVP requirements in `docs/requirements.md`) is planned, as are tag filters. Forms, persistence, a backend and a database do not exist yet.

## Planned architecture

- A backend and database are planned but not yet implemented. The technology choices have not been made and will be decided during architecture design.
- The target deployment is self-hosting on a Raspberry Pi 4B using Docker, with persistent data storage.
- Docker persistent storage protects data across container restarts and updates, but it is not a backup. JSON export/import and a documented backup and restore procedure are part of the MVP.

See [docs/requirements.md](docs/requirements.md) for the MVP scope, decisions and acceptance criteria.

## Repository layout

An npm workspaces monorepo:

- `apps/web`: the React + TypeScript frontend (Vite).
- `apps/api`: the backend, planned and not created yet.
- `docs/`: requirements, the architecture decision record, the spike and the ticket list.
- `spike/`: throwaway scripts for the Raspberry Pi spike. Not part of the application.

Shared tooling (ESLint, Prettier, TypeScript) lives at the repository root.

## Getting started

Requires Node.js 22.22 or newer and npm.

```bash
npm install
npm run dev
```

## Scripts

| Script                 | Description                                                   |
| ---------------------- | ------------------------------------------------------------- |
| `npm run dev`          | Start the frontend dev server with HMR                        |
| `npm run build`        | Build every workspace (frontend: `tsc -b`, then `vite build`) |
| `npm run preview`      | Serve the production frontend build locally                   |
| `npm run lint`         | Lint the project with ESLint                                  |
| `npm run format`       | Format all files with Prettier                                |
| `npm run format:check` | Check formatting without changing files                       |
| `npm run check`        | Run lint, format check and build                              |

## Tooling

- [Vite](https://vite.dev) with [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) for the dev server and build.
- [TypeScript](https://www.typescriptlang.org) for type checking.
- [ESLint](https://eslint.org) for linting, using the flat config in `eslint.config.js`. It enables the recommended JavaScript, TypeScript, React Hooks and React Refresh rules.
- [Prettier](https://prettier.io) for formatting, configured in `.prettierrc` and `.prettierignore`. `eslint-config-prettier` turns off ESLint rules that would conflict with Prettier, so the two tools do not overlap.

## Before committing

```bash
npm run check
```
