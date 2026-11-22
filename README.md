# Rail Op Sim

A web-based railway operations simulator and track network builder, based on [Railway Operation Simulator (`AlbertBall/railway-dot-exe`)](https://github.com/AlbertBall/railway-dot-exe).

## Attribution

This project is based on [**AlbertBall/railway-dot-exe**](https://github.com/AlbertBall/railway-dot-exe) (Railway Operation Simulator / RailOS). Much of the railway domain model, track element definitions, signalling concepts, and timetable structure are derived from or inspired by that project.

## Tech Stack

- **Monorepo**: `pnpm` workspaces (`packages/app`, `packages/shared`)
- **Framework**: [TanStack Start](https://tanstack.com/start) & [TanStack Router](https://tanstack.com/router) with React 19
- **Renderer**: [PixiJS v8](https://pixijs.com/)
- **State**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Styling & UI**: [Tailwind CSS v4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/) / Radix UI, Phosphor Icons
- **Testing & Tooling**: [Vitest](https://vitest.dev/), [Biome](https://biomejs.dev/), TypeScript, Vite

## Project Structure

- `packages/app` (`@rail-op-sim/app`) — TanStack Start frontend application, PixiJS viewport and placement editor (`src/editor`), renderer (`src/renderer`), Zustand store (`src/store`), and simulation/editor UI (`src/components/sim`).
- `packages/shared` (`@rail-op-sim/shared`) — Shared TypeScript railway domain library (`src/railway`), including track elements, signal aspects, map connectivity/serialization, timetable parsing, validation, and serialization, and the Operate-mode simulation engine (`src/sim`). This package must stay runtime-agnostic: no DOM, `react`, `pixi.js` or `zustand` (see PLAN.md); `tsc` and Biome both check this.
- `scripts/` — Repository utility scripts (`merge-coverage.mjs`, `png-to-svg.mjs`).

## Getting Started

### Prerequisites

- Node.js
- `pnpm` (configured with `pnpm@10.30.3`)

### Installation & Development

```bash
pnpm install
pnpm dev
```

The app runs in development mode on `http://localhost:3000`.

### Available Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start development servers across workspace packages |
| `pnpm build` | Build all packages for production |
| `pnpm start` | Start the built `@rail-op-sim/app` production server |
| `pnpm test` | Run Vitest test suites across all packages |
| `pnpm coverage` | Run tests with coverage and merge reports |
| `pnpm typecheck` | Run TypeScript typechecking across `shared`, `app`, and `.railway` |
| `pnpm check` | Run Biome lint and format checks |
| `pnpm lint` | Run Biome linter |
| `pnpm format` | Run Biome formatter |

## License

This project is licensed under the **GNU General Public License v3.0 (GPL-3.0)** — see the [LICENSE](LICENSE) file for details, in keeping with the upstream [`AlbertBall/railway-dot-exe`](https://github.com/AlbertBall/railway-dot-exe) license.
