# BPI Manager 2

A web application for tracking and analyzing **BPI (Beat Power Indicator)** scores in beatmania IIDX. Players can import their scores, monitor progress over time, compare stats with rivals, and view aggregated metrics across the community.

## Tech Stack

| Layer            | Technology                                                            |
| ---------------- | --------------------------------------------------------------------- |
| Framework        | Next.js 16 (Pages Router)                                             |
| Language         | TypeScript                                                            |
| UI               | shadcn/ui (Radix UI), Tailwind CSS v4, Recharts, Lucide React, Sonner |
| Database         | MySQL (via [Kysely](https://kysely.dev/) query builder)               |
| Auth             | Firebase Authentication                                               |
| Backend Services | Firebase Admin SDK                                                    |
| Data Fetching    | SWR                                                                   |
| Cron Jobs        | node-cron (Sitemap generation, Arena metrics & Radar cache)           |
| Testing          | Vitest                                                                |

## Features

- **Score Import** — Import play data via CSV with batch processing
- **Dashboard** — BPI distribution, activity calendar, DJRank distribution, rival comparison, radar chart, recommended songs
- **Score Logs** — Per-version score history with ranking, overtaken log, daily batch notice, and BPI trend
- **Song Analytics** — Per-song BPI charts, AAA difficulty table, Arena average metrics, level selector
- **Social** — Follow/unfollow players, timeline, rival score comparison
- **Profile** — Public user profiles with BPI history and radar charts
- **Settings** — Account settings, theme settings, API key management, data transfer, account deletion
- **Notifications** — In-app notifications
- **Automated Jobs** — Daily sitemap generation (02:00 UTC), daily Arena JSON generation (04:00 UTC), and 12-hour Radar cache refresh via cron

## Prerequisites

- Node.js 20+
- MySQL 8.0+
- A Firebase project (for authentication)

## Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd BPIManager2
```

### 2. Install dependencies

This project uses [pnpm](https://pnpm.io/) (enforced via `preinstall`, so `npm install`/`yarn` will refuse to run):

```bash
pnpm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

| Variable                               | Description                                            |
| -------------------------------------- | ------------------------------------------------------ |
| `DB_HOST`                              | MySQL host (e.g. `localhost`)                          |
| `DB_DATABASE`                          | Database name (e.g. `beatmaniaBpi`)                    |
| `DB_USER`                              | MySQL username                                         |
| `DB_PW`                                | MySQL password                                         |
| `DATABASE_URL`                         | Full connection URL (used by kysely-codegen)           |
| `FIREBASE_PROJECT_ID`                  | Firebase project ID                                    |
| `FIREBASE_PRIVATE_KEY_ID`              | Service account private key ID                         |
| `FIREBASE_PRIVATE_KEY`                 | Service account private key (include `\n` line breaks) |
| `FIREBASE_CLIENT_EMAIL`                | Service account client email                           |
| `FIREBASE_CLIENT_ID`                   | Service account client ID                              |
| `FIREBASE_AUTH_URI`                    | Firebase auth URI                                      |
| `FIREBASE_TOKEN_URI`                   | Firebase token URI                                     |
| `FIREBASE_AUTH_PROVIDER_X509_CERT_URL` | Auth provider cert URL                                 |
| `FIREBASE_CLIENT_X509_CERT_URL`        | Client cert URL                                        |
| `FIREBASE_UNIVERSE_DOMAIN`             | Usually `googleapis.com`                               |

### 4. Set up the database

Apply the schema to your MySQL instance:

```bash
mysql -u <user> -p < migrations/schema.sql
```

This creates the `beatmaniaBpi` database and all required tables (`users`, `scores`, `bkScores`, `songs`, `songDef`, `follows`, `logs`, `notifications`, `userRadarCache`, `userStatusLogs`, `apiKeys`, etc.).

### 5. Run the development server

The dev server uses HTTPS (required for certain browser APIs):

```bash
pnpm dev
```

Open [https://localhost:3000](https://localhost:3000) in your browser. Accept the self-signed certificate warning on first launch.

## Available Scripts

| Command                     | Description                                                 |
| ---------------------------- | ------------------------------------------------------------ |
| `pnpm dev`                   | Start development server (HTTPS)                             |
| `pnpm build`                 | Build for production                                          |
| `pnpm start`                 | Start production server                                       |
| `pnpm lint`                  | Run ESLint                                                    |
| `pnpm test`                  | Run all tests with Vitest (unit + integration)                |
| `pnpm test:unit`             | Run only unit tests (no external dependencies required)       |
| `pnpm test:integration`      | Run integration tests (requires a running dev server etc.)    |
| `pnpm test:ui`               | Run tests with the Vitest UI                                  |
| `pnpm fetch-arena-metadata`  | Fetch Arena metadata via `scripts/fetchArenaMetadata.ts`      |

## Database Migrations

The `migrations/schema.sql` file contains the full database schema. It uses `CREATE TABLE IF NOT EXISTS`, so it is safe to re-run.

> **Note:** This project uses a single SQL file for schema management rather than a migration framework. When making schema changes, update `migrations/schema.sql` and apply the diff manually to existing environments. If you need incremental migrations in the future, consider adopting a tool like [Flyway](https://flywaydb.org/) or [golang-migrate](https://github.com/golang-migrate/migrate).

After schema changes, regenerate the Kysely type definitions:

```bash
npx kysely-codegen --url "$DATABASE_URL" --out-file src/types/db.ts
```

## Project Structure

```
src/
├── assets/               # Static assets (images, lottie animations, etc.)
├── components/
│   ├── partials/         # Page-specific & shared composite components
│   │   ├── features/     # Used by exactly one page (Import, Logs, Metrics, Profile,
│   │   │                 #   Ranking, Rivals, Settings, Songs, Timeline, ...)
│   │   ├── common/       # Reused across 2+ features/shells (Auth, Charts, DashBoard,
│   │   │                 #   ListControls, Notifications, Rivals, Songs, ...)
│   │   ├── modal/        # Dialogs/modals (AccountSettings, ImageCrop, RivalComparison, SongDetail, ...)
│   │   └── shell/        # Page-level shells (RequireAuth, DashboardLayout, ProfileLayoutShell, ...)
│   └── ui/               # shadcn/ui-based generic UI primitives
├── constants/            # Constants (IIDX versions/ranks, BPM, radar topElements, theme, ...)
├── contexts/             # React context providers (locale, profile, stats, users)
├── hooks/                # SWR fetch + local state hooks, grouped by domain
│                         #   (dashboard, logs, rivals/social, stats, songs, users, ...)
├── lib/
│   ├── arena/            # Arena rank metrics generation
│   ├── bpi/              # BPI calculation (BpiCalculator) & score optimizer
│   ├── cache/            # Caching helpers
│   ├── cron/             # Scheduled jobs (sitemap, Arena metrics, Radar cache)
│   ├── dayjs/            # dayjs instance with plugins/timezone configured
│   ├── db/               # Kysely queries, split by role (see CLAUDE.md for details)
│   │   ├── domains/        # Single-table repositories (scores, songs, users, follow, ...)
│   │   ├── orchestrators/  # Cross-domain write transactions (batchDeletion, userDeletion, ...)
│   │   ├── aggregates/     # Cross-domain read-only aggregation views (stats, rivalScores, ...)
│   │   ├── shared/         # Side-effect-free query builders/helpers
│   │   └── index.ts        # Kysely connection singleton
│   ├── discord/          # Discord.js bot
│   ├── firebase/         # Firebase Admin & Auth helpers
│   ├── i18n/             # Internationalization helpers
│   ├── lamp/             # LAMP score import utilities
│   ├── mcp/              # MCP server tools
│   ├── monthly-review/   # Monthly review generation
│   ├── radar/            # Radar chart cache calculation
│   ├── subhandlers/      # API sub-handlers
│   ├── transfer/         # Data transfer / migration utilities
│   └── utils.ts          # Shared utilities
├── middlewares/api/      # Next.js API middlewares (auth guards, profile access, etc.)
├── pages/                # Next.js Pages Router (screens & API routes)
│   └── api/v1/users/[userId]/  # REST API: scores, batches, stats, rivals,
│                                #   all-scores, ranking, notifications, iidx-tower, tickets, ...
├── services/             # SWR fetchers / Next.js API request helpers
├── styles/               # Global styles (Tailwind CSS v4)
├── types/                # Type definitions (db.ts is kysely-codegen generated)
└── utils/                # Pure function utilities
public/
└── data/metrics/arena/   # Auto-generated Arena metric JSON files
migrations/
└── schema.sql            # Full database schema
test/
├── unit/                 # No external dependencies (day-to-day: `pnpm test:unit`)
└── integration/          # Requires a running dev server etc.
```

## Background Jobs

On server startup, three cron jobs are registered automatically via `src/instrumentation.ts`:

- **Sitemap generation** — Runs once on startup and daily at **02:00 UTC**. Generates the user sitemap under `public/`.
- **Arena JSON generation** — Runs daily at **04:00 UTC**. Generates aggregated Arena rank metric files under `public/data/metrics/arena/`. Also runs once on startup if the output directory is empty.
- **Radar cache update** — Runs every **12 hours**. Pre-computes radar chart data for all users. Also runs once on startup.

## Firebase Setup

1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a project.
2. Enable **Authentication** and configure sign-in providers as needed.
3. Generate a **Service Account** key (Project Settings → Service Accounts → Generate new private key).
4. Copy the values from the downloaded JSON into your `.env.local`.

## Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run `pnpm test` and `pnpm lint` to verify
4. Open a pull request
