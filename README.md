# Inventory & Supply Chain Management System

Software Requirements Specification implementation for a polished web product built with Next.js, Neon Postgres, and Drizzle ORM.

For the fastest first-time setup, see [SETUP.md](./SETUP.md).

Submitted By:
- Avni Singhal (202451026)
- Ashay Gupta (202451024)
- Nandish Chauhan (202451040)
- Arpit Maheshwari (202451022)

Course: Software Engineering Lab (CS 264)

Submission Date: February 4, 2026

## Abstract

This project turns the SRS for an Inventory and Supply Chain Management System into a working full-stack application.

The current build includes:
- a public landing page
- a Neon-backed authentication flow
- role-based dashboard access
- order creation and routing
- inventory-aware warehouse allocation
- carrier assignment
- delay detection and reassignment automation
- workflow logging and traceability
- an owner-only internal access management screen

In short: the SRS is no longer only a document. It is implemented as a real product surface that can be run locally, connected to Neon Postgres, and demonstrated through a proper UI.

## What This Project Is

This application is a supply-chain control tower for handling the lifecycle of an order:

1. An order is created.
2. Inventory is checked.
3. A warehouse is selected.
4. A carrier is assigned.
5. Delay conditions are monitored.
6. Reassignment or delivery completion is recorded.
7. All important events are logged for traceability.

The app is designed for classroom demonstration, backend understanding, and future extension into a more complete enterprise workflow.

## Current Product Snapshot

### Public experience
- polished landing page
- product-oriented navigation
- project summary based on the SRS

### Secure experience
- login page with Neon-backed sessions
- role-aware navigation and route protection
- owner, org admin, and admin dashboard access

### Control tower
- create orders from the dashboard
- inspect live order status
- monitor inventory signals
- monitor carrier and warehouse signals
- run automation cycles
- view workflow logs and traceability data

### Owner tools
- owner-only access to the team access route
- create internal users with `admin` or `org_admin` roles

## What Is Implemented vs Planned

### Implemented now
- RBAC roles: `owner`, `org_admin`, `admin`, `customer`, `automated_system`
- custom auth tables stored in Postgres
- dashboard and API protection
- seeded owner account
- sample products, warehouses, carriers, orders, automation logs

### Planned next
- full organization modeling where owner creates orgs
- org-bound products and orders
- org admin visibility limited to their org only
- richer invite and password reset flows

This distinction matters: the UI already includes `org_admin` as a role, but full organization tenancy is the next extension, not a completed feature in the current codebase.

## SRS to Implementation Mapping

| SRS Area | Current Implementation |
| --- | --- |
| Order Creation | Dashboard form and `POST /api/orders` |
| Inventory Check | Inventory lookup before order creation |
| Warehouse Allocation | Automatic warehouse selection based on region and stock |
| Carrier Assignment | Automatic carrier selection based on availability and region |
| Delay Detection | Automation cycle checks ETA drift and carrier degradation |
| Automatic Reassignment | Automation cycle and admin override can reassign |
| Order State Management | `created`, `assigned`, `in_transit`, `delayed`, `reassigned`, `delivered` |
| Logging and Traceability | Workflow log table and recent activity UI |
| Dashboard Monitoring | Protected control tower dashboard |
| Role-Based Security | Owner, org admin, and admin access rules |

## Tech Stack

- Next.js 16.2.1
- React 19
- TypeScript
- Tailwind CSS 4
- Neon Postgres 17
- Drizzle ORM
- `@neondatabase/serverless`
- `lucide-react`

## Architecture Overview

### Frontend
- App Router based Next.js application
- landing page, login page, dashboard, and owner-only access page
- reusable dashboard components for orders, automation, status pills, and forms

### Backend
- route handlers under `app/api`
- typed business logic inside `lib/supply-chain/service.ts`
- authentication and session management in `lib/auth/service.ts`

### Database
- schema defined in `lib/db/schema.ts`
- Drizzle used for typed SQL access and schema pushes
- Neon Postgres used as the primary backend database

### Authentication model

This project currently uses custom Postgres-backed authentication, not Neon Auth.

The auth model is implemented through:
- `app_user_profiles`
- `auth_accounts`
- `auth_sessions`

That means you can keep Neon Auth disabled for this project unless you decide to migrate to it later.

## Repository Structure

```text
app/
  api/                     Route handlers
  dashboard/               Protected dashboard routes
  login/                   Login screen and action
  page.tsx                 Public landing page

components/
  auth/                    Login form UI
  dashboard/               Control tower widgets
  site/                    Navbar and brand UI

lib/
  auth/                    Password hashing and session logic
  db/                      Neon + Drizzle client and schema
  supply-chain/            Core business logic and seed data

scripts/
  seed.ts                  Seed script

drizzle/
  *.sql                    Generated migration artifacts
```

## Prerequisites

Before initializing the project, make sure you have:

- Node.js 20+
- npm
- a Neon account
- VS Code, Cursor, or another VS Code-compatible editor if you want the Neon extension workflow

## Recommended Neon Project Setup

When creating your Neon project, the settings used for this project are:

- Project name: `srs`
- Postgres version: `17`
- Cloud provider: `AWS`
- Region: `AWS Asia Pacific 1 (Singapore)`

Neon Auth:
- optional
- safe to leave disabled for this codebase because authentication is currently handled through app tables in Postgres

## Quick Start

### 1. Clone and install dependencies

```bash
npm install
```

### 2. Create an environment file

For this repository, use `.env` so both Next.js and the Drizzle seed script can read the same values.

Copy `.env.example` to `.env` and fill in your database URL:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>/<database>?sslmode=require
NEONDB_CONN=
SEED_OWNER_PASSWORD=AvniOwner@2026
```

Notes:
- `DATABASE_URL` is the preferred variable.
- `NEONDB_CONN` is kept as a legacy fallback.
- `SEED_OWNER_PASSWORD` is optional. If omitted, the project uses `AvniOwner@2026` during seeding.

### 3. Create or choose a Neon branch

Recommended workflow:
- keep `production` for stable data
- create a `development` branch for team work
- create feature branches for experiments

Use a non-production branch before pushing schema changes.

### 4. Push the schema

```bash
npm run db:push -- --force
```

This creates or updates the database tables defined in `lib/db/schema.ts`.

If you want to inspect generated SQL when the schema changes:

```bash
npm run db:generate
```

### 5. Seed demo data

```bash
npm run db:seed
```

This seeds:
- the owner account
- sample products
- sample warehouses
- sample carriers
- sample inventory rows
- sample orders in different states
- workflow logs
- automation summary data

### 6. Start the app

```bash
npm run dev
```

Open:

- `http://localhost:3000` for the landing page
- `http://localhost:3000/login` for sign in

### 7. Use the seeded owner account

Default seeded credentials:

- Email: `avni.owner@srs.local`
- Password: `AvniOwner@2026`

If you set `SEED_OWNER_PASSWORD`, use that instead.

## Working with Neon in VS Code

This is the best onboarding path for new developers and admins who want the local app to work against a remote Neon Postgres branch.

### Recommended workflow for this repository

1. Open the project in VS Code.
2. Install the Neon extension:
   - search for `Neon - Serverless Postgres`
3. Run the following command in the project root:

```bash
npx neonctl@latest init
```

4. Complete Neon sign-in in your browser when prompted.
5. In the Neon extension, connect:
   - Organization
   - Project
   - Branch
6. Copy the branch connection string into your `.env` file as `DATABASE_URL`.
7. Run:

```bash
npm run db:push -- --force
npm run db:seed
npm run dev
```

### Why this works well

This project runs locally, but its data lives in your selected Neon branch.

That gives you:
- a local Next.js development server
- a remote Postgres database branch
- branch-based collaboration without manually changing your app logic
- direct visibility inside VS Code through Neon tooling

### What `npx neonctl@latest init` helps with

Based on current Neon documentation, the command is used to initialize Neon tooling for your project and streamline IDE integration, including MCP-related setup for supported editors.

For this project, think of it as the easiest way to prepare your workspace for:
- Neon sign-in
- Neon editor integration
- faster branch-aware development

### What the Neon VS Code extension gives you

- connect to a specific organization, project, and branch
- browse schemas and tables from the sidebar
- run SQL in the editor
- inspect and edit table data
- switch branches without leaving the IDE
- use Neon AI tooling where available

## Local App + Remote Postgres Sync

For this repository, the recommended meaning of "local sync" is:

- the app runs on your machine
- the database is a Neon branch in the cloud
- your `.env` points to that branch

This is the cleanest approach for the current codebase because `lib/db/client.ts` is already configured for direct Neon connections through `@neondatabase/serverless`.

## About Neon Local and `localhost`

Neon also provides a Neon Local workflow and a VS Code extension workflow that can expose a stable local connection string such as:

```env
DATABASE_URL=postgres://neon:npg@localhost:5432/<database_name>
```

However, there is one important note for this repository:

- this app currently uses `drizzle-orm/neon-serverless` with a `Pool` and WebSocket configuration
- Neon Local's official serverless-driver setup is HTTP-based, not WebSocket-based

So for this exact codebase, the safest documented setup is:
- use your remote Neon branch connection string directly in `.env`

If you later want full Neon Local proxy support, you should first adapt the database client configuration specifically for that workflow.

## Application Routes

### Public routes
- `/` - landing page
- `/login` - sign in page

### Protected routes
- `/dashboard` - control tower
- `/dashboard/admins` - owner-only team access page

## API Summary

- `GET /api/dashboard` - dashboard snapshot
- `GET /api/orders` - list orders
- `POST /api/orders` - create order
- `GET /api/orders/:orderId` - fetch one order
- `PATCH /api/orders/:orderId` - deliver or reassign order
- `POST /api/automation/run` - execute automation cycle

## User Roles

### Owner
- full dashboard access
- can access team access route
- can create internal admin users

### Org Admin
- dashboard access
- currently treated as an internal dashboard role
- full org data scoping is planned next

### Admin
- dashboard access
- can create and monitor orders
- can trigger admin overrides

### Customer
- seeded as domain data for the order model
- not currently used as a login-facing role in the UI

### Automated System
- internal actor for logs and automation events

## Seed Data Overview

The seed script creates realistic demo data so the dashboard does not look empty.

Included demo entities:
- one owner account
- one customer profile
- one automated system profile
- multiple products
- multiple warehouses
- multiple carriers
- multiple inventory rows
- multiple orders across different states
- workflow logs and automation summaries

## How the Core Workflow Works

### Order creation

When a dashboard user creates an order:
- the product is validated
- inventory rows are checked
- a warehouse is selected
- a carrier is selected
- the order is inserted
- inventory is reserved
- workflow logs are added

### Automation cycle

When automation runs:
- assigned orders can move into transit
- in-transit orders can become delayed
- delayed orders can be reassigned
- recovered orders can be delivered
- an automation summary is saved

### Manual admin override

An internal dashboard user can:
- mark an order as delivered
- manually reassign an order

## How We Built It

This is the implementation path used in the project:

1. Start with the SRS and extract the core domain objects:
   - users
   - products
   - warehouses
   - carriers
   - orders
   - workflow logs
2. Model the database in Drizzle.
3. Connect Next.js to Neon Postgres using `@neondatabase/serverless`.
4. Build a service layer in `lib/supply-chain/service.ts` so route handlers stay thin.
5. Add custom auth and session tables for RBAC.
6. Build the public landing page and login flow.
7. Move operations into a protected dashboard route.
8. Add owner-only navigation and access provisioning.
9. Seed realistic demo data for evaluation and demos.

The important design decision here is that the UI and the backend were built together. The landing page, login, dashboard, services, and schema all reflect the same supply-chain workflow instead of being unrelated pieces.

## Useful Scripts

```bash
npm run dev
npm run build
npm run lint
npm run db:generate
npm run db:push -- --force
npm run db:seed
npm run db:studio
```

## Notes for New Admins and Developers

- use a dedicated Neon development branch before running schema pushes
- keep your real connection string in `.env`
- use the owner account for the first sign-in
- use the Team Access page to provision internal users
- treat the seeded password as a development default, not a production credential

## Known Limitations

- full organization tenancy is not implemented yet
- password reset and invite links are not implemented yet
- customer-facing ordering is not implemented yet
- notifications and GPS tracking are still future enhancements

## Future Enhancements

Planned extensions aligned with the SRS:
- organization-aware products and orders
- org-scoped dashboards
- predictive delay detection
- customer notification service
- richer reporting and analytics
- dynamic carrier optimization

## Reference Setup Links

Official references used while preparing the onboarding flow:

- Neon VS Code Extension: https://neon.com/docs/local/vscode-extension
- Neon Local: https://neon.com/docs/local/neon-local
- Neon changelog note covering `npx neonctl@latest init`: https://neon.com/docs/changelog/2026-01-23

## Final Note

If you are opening this project for the first time, the fastest path is:

1. create a Neon project and development branch
2. put the branch connection string in `.env`
3. run `npm install`
4. run `npm run db:push -- --force`
5. run `npm run db:seed`
6. run `npm run dev`
7. sign in with the seeded owner account

That will give you the complete current demo flow of the Inventory & Supply Chain Management System.
