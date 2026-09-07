# Chess — frontend

Next.js frontend for a hotseat chess game. The NestJS backend in `../backend` owns
all game state; this app renders it.

See `CLAUDE.md` for architecture and conventions.

## Setup

```bash
corepack enable
pnpm install
cp .env.example .env.local
```

`pnpm install` runs `openapi:generate`, which builds `src/lib/api/schema.d.ts` from
the committed `openapi.json`. That file is gitignored and rebuilt on every install.

## Running

The backend runs on `3000`, this app on `3001`.

```bash
pnpm dev
```

## Commands

| Command                 | Does                                           |
| ----------------------- | ---------------------------------------------- |
| `pnpm dev`              | Dev server on port 3001                        |
| `pnpm build`            | Production build                               |
| `pnpm test`             | Run the Vitest suite once                      |
| `pnpm test:watch`       | Watch mode                                     |
| `pnpm test:cov`         | Coverage report                                |
| `pnpm lint`             | ESLint, including the full `jsx-a11y` rule set |
| `pnpm typecheck`        | `tsc --noEmit`                                 |
| `pnpm format`           | Prettier write                                 |
| `pnpm openapi:sync`     | Pull `openapi.json` from the backend           |
| `pnpm openapi:generate` | Regenerate API types from `openapi.json`       |

## API types

`openapi.json` is fetched, never hand-edited. `pnpm openapi:sync` pulls it from
`${OPENAPI_SOURCE_URL}/api-docs-json` (defaults to `http://localhost:3000`), so the
backend must be running. The spec is committed, so Vercel builds never depend on the
backend being up.

Request and response shapes come from the generated types only — never hand-write an
interface describing a backend payload.

## Layout

```
src/app/         routes
src/components/  UI components (shadcn/ui output is ours to edit)
src/lib/api/     typed fetch client + generated schema
src/lib/query/   TanStack Query provider
tests/           mirrors src/
```
