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

```bash
npm install
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
npm run dev
```

Open [https://localhost:3000](https://localhost:3000) in your browser. Accept the self-signed certificate warning on first launch.

## Available Scripts

| Command           | Description                      |
| ----------------- | -------------------------------- |
| `npm run dev`     | Start development server (HTTPS) |
| `npm run build`   | Build for production             |
| `npm start`       | Start production server          |
| `npm run lint`    | Run ESLint                       |
| `npm test`        | Run tests with Vitest            |
| `npm run test:ui` | Run tests with Vitest UI         |

## Database Migrations

The `migrations/schema.sql` file contains the full database schema. It uses `CREATE TABLE IF NOT EXISTS`, so it is safe to re-run.

> **Note:** This project uses a single SQL file for schema management rather than a migration framework. When making schema changes, update `migrations/schema.sql` and apply the diff manually to existing environments. If you need incremental migrations in the future, consider adopting a tool like [Flyway](https://flywaydb.org/) or [golang-migrate](https://github.com/golang-migrate/migrate).

After schema changes, regenerate the Kysely type definitions:

```bash
npx kysely-codegen --url "$DATABASE_URL" --out-file src/types/sql.d.ts
```

## Project Structure

```
src/
├── assets/                # Static assets (images, etc.)
├── components/partials/   # Feature-level UI components
│   ├── DashBoard/         # BPI distribution, activity calendar, radar, rivals, etc.
│   ├── Import/            # CSV import flow and success modal
│   ├── Logs/              # Score log views, ranking, overtaken log, BPI trend
│   ├── Metrics/           # AAA difficulty table, Arena average, level selector
│   ├── Notifications/     # In-app notification components
│   ├── Profile/           # Public profile layout and follows
│   ├── Rivals/            # Rival comparison list, table, mode switch
│   ├── Settings/          # Account, theme, API key, data transfer, deletion
│   ├── Songs/             # Per-song filters and advanced filter
│   ├── Timeline/          # Social timeline card and header
│   └── ...                # Shared UI (Header, Sidebar, Modal, Pagination, etc.)
├── contexts/              # React context providers
├── hooks/                 # Data-fetching hooks (SWR)
├── lib/
│   ├── bpi/               # BPI calculation logic
│   ├── cron/              # Scheduled jobs (sitemap, Arena metrics, Radar cache)
│   ├── db/                # Kysely query modules per domain
│   │   ├── bpi/
│   │   ├── follow/
│   │   ├── logs/
│   │   ├── metrics/
│   │   ├── notifications/
│   │   ├── social/
│   │   ├── stats/
│   │   └── users/
│   ├── firebase/          # Firebase Admin & Auth helpers
│   ├── lamp/              # LAMP score import utilities
│   ├── radar/             # Radar chart cache calculation
│   ├── subhandlers/       # API sub-handlers
│   ├── transfer/          # Data transfer / migration utilities
│   └── utils.ts           # Shared utilities
├── middlewares/           # Next.js middleware (API auth, etc.)
├── pages/
│   ├── api/v1/            # REST API routes
│   ├── import.tsx         # Score import page
│   ├── index.tsx          # Home / Dashboard
│   ├── logs.tsx           # Score logs page
│   ├── metrics/           # Metrics pages (AAA table, Arena average)
│   ├── my/[version].tsx   # My scores per version
│   ├── rivals/            # Rival pages
│   ├── settings.tsx       # Settings page
│   ├── timeline.tsx       # Social timeline page
│   └── users/             # Public user profile pages
├── services/              # Client-side service helpers
├── styles/                # Global styles
├── types/                 # TypeScript types including generated DB types
└── utils/                 # Shared utility functions
public/
└── data/metrics/arena/    # Auto-generated Arena metric JSON files
migrations/
└── schema.sql             # Full database schema
test/                      # Vitest test files
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
3. Run `npm test` and `npm run lint` to verify
4. Open a pull request
