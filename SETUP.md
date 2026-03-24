# Setup Guide

Quick start for running the Inventory & Supply Chain Management System locally with Neon Postgres.

If you want the full project overview, architecture, and SRS mapping, read [README.md](./README.md).

## Fastest Path

1. Create a Neon project and development branch.
2. Put the branch connection string in `.env` as `DATABASE_URL`.
3. Run `npm install`.
4. Run `npm run db:push -- --force`.
5. Run `npm run db:seed`.
6. Run `npm run dev`.
7. Sign in with the seeded owner account.

## Prerequisites

Make sure you have:

- Node.js 20+
- npm
- a Neon account
- VS Code if you want the Neon extension workflow

## Recommended Neon Project Settings

Use these settings to match this project:

- Project name: `srs`
- Postgres version: `17`
- Cloud provider: `AWS`
- Region: `AWS Asia Pacific 1 (Singapore)`

Neon Auth:
- optional
- this codebase currently uses custom Postgres-backed auth tables, so Neon Auth does not need to be enabled

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Environment Variables

Copy `.env.example` to `.env` and set your Neon connection string:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>/<database>?sslmode=require
NEONDB_CONN=
SEED_OWNER_PASSWORD=
```

Notes:
- `DATABASE_URL` is the preferred variable.
- `NEONDB_CONN` is only a fallback.
- `SEED_OWNER_PASSWORD` is optional.

## Step 3: Connect Neon in VS Code

Recommended workflow:

1. Open the project in VS Code.
2. Install the extension `Neon - Serverless Postgres`.
3. Run:

```bash
npx neonctl@latest init
```

4. Sign in to Neon in the browser when prompted.
5. In the Neon extension, choose:
   - Organization
   - Project
   - Branch
6. Copy the selected branch connection string into `.env` as `DATABASE_URL`.

Why this is recommended:
- your app runs locally
- your Postgres database stays in Neon
- you can use Neon branches safely for development
- you can inspect schema and data from inside VS Code

## Step 4: Push the Schema

```bash
npm run db:push -- --force
```

If you want Drizzle to generate SQL artifacts first:

```bash
npm run db:generate
```

## Step 5: Seed Demo Data

```bash
npm run db:seed
```

This seeds:
- owner account
- sample products
- warehouses
- carriers
- inventory
- orders
- workflow logs
- automation summary data

## Step 6: Start the App

```bash
npm run dev
```

Open:

- `http://localhost:3000`
- `http://localhost:3000/login`

## Seeded Login

Default owner account:

- Email: `avni.owner@srs.local`
- Password: `AvniOwner@2026`

If you set `SEED_OWNER_PASSWORD`, use that password instead.

## What You Should See

After setup is complete, you should be able to:

- view the landing page
- log in as the owner
- open the dashboard
- create orders
- inspect inventory and carrier status
- run the automation cycle
- open the owner-only team access page

## Important Project Note

This repository currently works best with a direct Neon branch connection string in `.env`.

That is because the database client is already configured for `@neondatabase/serverless` and Drizzle against Neon directly.

## Common Commands

```bash
npm run dev
npm run lint
npm run build
npm run db:generate
npm run db:push -- --force
npm run db:seed
npm run db:studio
```

## Troubleshooting

### Database not configured

If you see an error about `DATABASE_URL` or `NEONDB_CONN`, check your `.env` file and confirm the value is present.

### Login not working

Run the seed again:

```bash
npm run db:seed
```

Then try the owner credentials again.

### Schema mismatch

Push the schema again:

```bash
npm run db:push -- --force
```

### Empty dashboard

Run the seed script again to restore demo data:

```bash
npm run db:seed
```

## Recommended First Demo Flow

1. Open the landing page.
2. Sign in with the owner account.
3. Open the dashboard.
4. Create a test order.
5. Run the automation cycle.
6. Open the Team Access page.

## Where to Read Next

- [README.md](./README.md) for the full project explanation
- `lib/db/schema.ts` for the database model
- `lib/supply-chain/service.ts` for the workflow logic
- `lib/auth/service.ts` for auth and RBAC behavior
