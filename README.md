# Recipe Vault

Your personal recipe collection.

Recipe Vault is a client-side single-page app built with React, TypeScript and Vite. The goal is a simple place to keep, browse and find your own recipes.

## Status

Early development. The project is a scaffold: it shows a placeholder screen with the app name and tagline. No recipe features, data storage or backend exist yet.

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
