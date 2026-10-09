# Recipe Vault

Your personal recipe collection.

Recipe Vault is a personal recipe manager for creating, editing, organizing and searching your own recipes. It is meant to be mobile-friendly for use while cooking.

## Status

Early development. The current codebase is a React + TypeScript frontend scaffold built with Vite. It shows a placeholder screen with the app name and tagline. No recipe features, backend or database exist yet.

## Planned architecture

- A backend and database are planned but not yet implemented. The technology choices have not been made and will be decided during architecture design.
- The target deployment is self-hosting on a Raspberry Pi 4B using Docker, with persistent data storage.
- Docker persistent storage protects data across container restarts and updates, but it is not a backup. JSON export/import and a documented backup and restore procedure are part of the MVP.

See [docs/requirements.md](docs/requirements.md) for the MVP scope, decisions and acceptance criteria.

## Getting started

Requires Node.js and npm.

```bash
npm install
npm run dev
```

## Scripts

| Script                 | Description                                    |
| ---------------------- | ---------------------------------------------- |
| `npm run dev`          | Start the Vite dev server with HMR             |
| `npm run build`        | Type-check with `tsc -b`, then build to `dist` |
| `npm run preview`      | Serve the production build locally             |
| `npm run lint`         | Lint the project with ESLint                   |
| `npm run format`       | Format all files with Prettier                 |
| `npm run format:check` | Check formatting without changing files        |

## Tooling

- [Vite](https://vite.dev) with [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) for the dev server and build.
- [TypeScript](https://www.typescriptlang.org) for type checking.
- [ESLint](https://eslint.org) for linting, using the flat config in `eslint.config.js`. It enables the recommended JavaScript, TypeScript, React Hooks and React Refresh rules.
- [Prettier](https://prettier.io) for formatting, configured in `.prettierrc` and `.prettierignore`. `eslint-config-prettier` turns off ESLint rules that would conflict with Prettier, so the two tools do not overlap.

## Before committing

```bash
npm run lint
npm run format:check
npm run build
```
