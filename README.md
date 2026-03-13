# BPI Manager 2

A web application for tracking and analyzing **BPI (Beat Power Indicator)** scores in beatmania IIDX. Players can import their scores, monitor progress over time, compare stats with rivals, and view aggregated metrics across the community.

## Tech Stack

| Layer            | Technology                                              |
| ---------------- | ------------------------------------------------------- |
| Framework        | Next.js 16 (Pages Router)                               |
| Language         | TypeScript                                              |
| UI               | Chakra UI v3, Recharts, Lucide React                    |
| Database         | MySQL (via [Kysely](https://kysely.dev/) query builder) |
| Auth             | Firebase Authentication                                 |
| Backend Services | Firebase Admin SDK                                      |
| Cron Jobs        | node-cron (Arena metrics & Radar cache)                 |
| Testing          | Vitest                                                  |

## Features

- **Score Import** — Import play data via CSV and batch processing
- **Dashboard** — BPI distribution, activity calendar, DJRank distribution, rival comparison
- **Song Analytics** — Per-song BPI charts, AAA difficulty table, Arena average metrics
- **Social** — Follow/unfollow players, timeline, rival score comparison
- **Profile** — Public user profiles with BPI history and radar charts
- **Automated Jobs** — Daily Arena JSON generation and 12-hour Radar cache refresh via cron

## Prerequisites

- Node.js 20+
- MySQL 8.0+
- A Firebase project (for authentication)

## Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd BPIManager2-master
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

This creates the `beatmaniaBpi` database and all required tables (`users`, `scores`, `bkScores`, `follows`, `apiKeys`, etc.).

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
├── components/partials/   # Feature-level UI components
├── hooks/                 # Data-fetching hooks (SWR)
├── lib/
│   ├── db/                # Kysely query modules per domain
│   ├── firebase/          # Firebase Admin & Auth helpers
│   ├── cron/              # Scheduled jobs (Arena metrics, Radar cache)
│   └── bpi/               # BPI calculation logic
├── pages/
│   ├── api/               # API routes
│   └── ...                # Page routes
├── types/                 # TypeScript types including generated DB types
└── utils/                 # Shared utility functions
public/
└── data/metrics/arena/    # Auto-generated Arena metric JSON files
migrations/
└── schema.sql             # Full database schema
```

## Background Jobs

On server startup, two cron jobs are registered automatically via `src/instrumentation.ts`:

- **Arena JSON generation** — Runs daily at 04:00 UTC. Generates aggregated Arena rank metric files under `public/data/metrics/arena/`. Also runs once on startup if the output directory is empty.
- **Radar cache update** — Runs every 12 hours. Pre-computes radar chart data for all users.

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
