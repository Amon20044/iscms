# Inventory & Supply Chain Management System

Software Engineering Lab project that implements the SRS as a working full-stack control tower for order orchestration, inventory visibility, logistics assignment, delay detection, and organization-aware administration.

For first-time setup, see [SETUP.md](./SETUP.md).

**Submitted By**
- Avni Singhal (202451026)
- Ashay Gupta (202451024)
- Nandish Chauhan (202451040)
- Arpit Maheshwari (202451022)

**Course**: Software Engineering Lab (CS 264)

**Submission Date**: February 4, 2026

## Index
- [1 Project Summary](#1-project-summary)
- [2 Problem Statement](#2-problem-statement)
- [3 Stakeholders and User Classes](#3-stakeholders-and-user-classes)
- [4 Scope](#4-scope)
- [5 Functional Requirements](#5-functional-requirements)
- [6 Non-Functional Requirements](#6-non-functional-requirements)
- [7 System Architecture](#7-system-architecture)
- [8 Database Concepts Used](#8-database-concepts-used)
- [9 Backend Concepts Used](#9-backend-concepts-used)
- [10 Frontend Concepts Used](#10-frontend-concepts-used)
- [11 Organization-Based Access Model](#11-organization-based-access-model)
- [12 API and Route Map](#12-api-and-route-map)
- [13 Project Structure](#13-project-structure)
- [14 Setup and Initialization](#14-setup-and-initialization)
- [15 Seed Data and Demo Accounts](#15-seed-data-and-demo-accounts)
- [16 Current Status](#16-current-status)
- [17 Future Enhancements](#17-future-enhancements)

## 1 Project Summary
This project converts the Software Requirements Specification for an Inventory and Supply Chain Management System into an implemented web product.

The system acts as a supply chain control tower:
- orders are created and stored
- inventory is checked before commitment
- a warehouse is selected
- a carrier is assigned
- delay conditions are evaluated
- reassignment and delivery updates are recorded
- workflow actions are logged for traceability

The implementation is not only a UI mockup. It includes:
- a public landing page
- a protected login flow
- role-based and organization-based dashboard access
- a Neon Postgres database using Drizzle ORM
- a backend service layer for business logic
- owner-only administration for organization and admin management

## 2 Problem Statement
Modern inventory and logistics workflows are difficult to manage when order intake, stock status, warehouse allocation, carrier selection, and delay handling are handled in separate places.

This project solves that problem by bringing these decisions into one system that can:
- centralize order processing
- maintain data consistency across workflow states
- enforce role-based access control
- support organization-level data isolation
- provide monitoring and audit visibility for operations

From a software engineering perspective, the project demonstrates how an SRS is translated into:
- domain entities
- data models
- APIs
- user roles
- operational dashboards
- non-functional design decisions such as indexing, access control, and maintainability

## 3 Stakeholders and User Classes
### Primary stakeholders
- **Owner**: platform-level authority who manages organizations and internal access
- **Organization Admin**: manages and monitors orders for a specific organization only
- **Platform Admin**: operations user with cross-organization visibility
- **Customer**: business-side actor represented in the domain model as the requester of orders
- **Automated System**: internal system actor that performs automation runs and writes logs
- **Developers and Evaluators**: maintain, review, test, and demonstrate the system

### User classes in the current implementation
| User Class | Purpose in the System | Current Access |
| --- | --- | --- |
| Owner | Manage platform, create orgs, create internal admins | Full dashboard plus owner-only admin route |
| Org Admin | Operate inside one organization boundary | Dashboard restricted to assigned org |
| Admin | Cross-org operations and monitoring | Dashboard across organizations |
| Customer | Domain actor for order ownership | Not yet a direct UI login role |
| Automated System | Workflow automation actor | Internal-only system behavior |

## 4 Scope
### In scope
- public product landing page
- login and session management
- role-based access control
- organization creation by owner
- org-admin assignment to an existing organization
- organization-scoped order visibility for org admins
- product, warehouse, carrier, and inventory modeling
- order creation and lifecycle tracking
- workflow logging and automation summaries
- local Next.js development connected to Neon Postgres

### Out of scope for the current release
- customer self-service portal
- external carrier integrations or live tracking feeds
- password reset and invitation emails
- predictive AI delay models
- production deployment automation

## 5 Functional Requirements
The table below translates the SRS-style functional requirements into implemented behavior.

| FR ID | Requirement | Implementation in This Project |
| --- | --- | --- |
| FR-1 | Create order | Dashboard form and `POST /api/orders` create orders with product, quantity, location, priority, and requested delivery time |
| FR-2 | Verify inventory | Service layer checks stock availability before order confirmation |
| FR-3 | Allocate warehouse | Warehouse is chosen according to region and inventory suitability |
| FR-4 | Assign carrier | Carrier is chosen according to route fitness and operational state |
| FR-5 | Detect delay | Automation cycle checks delivery timing and carrier conditions |
| FR-6 | Reassign logistics | Delayed orders can be reassigned automatically or through admin action |
| FR-7 | Maintain order states | Order states include `created`, `assigned`, `in_transit`, `delayed`, `reassigned`, and `delivered` |
| FR-8 | Log workflow history | Workflow logs record transitions, reasons, timestamps, and actors |
| FR-9 | Monitor dashboard | Dashboard shows orders, signals, alerts, and automation outputs |
| FR-10 | Support admin control | Owner can create organizations and internal admin accounts |
| FR-11 | Restrict org data | Org admins only see and act on their own organization data |

### How functional requirements are supported by technical design
- **FR-1 and FR-2** depend on relational consistency between products, warehouse inventory, and orders.
- **FR-3 and FR-4** depend on backend business rules for selecting a valid warehouse and carrier.
- **FR-8** depends on audit-oriented schema design through workflow log tables.
- **FR-11** depends on organization foreign keys and RBAC checks in the service layer.

## 6 Non-Functional Requirements
The project also demonstrates how non-functional requirements are handled in implementation.

| NFR ID | Category | How It Is Addressed |
| --- | --- | --- |
| NFR-1 | Performance | Database indexes support fast filtering by organization, state, ETA, role, and inventory lookups |
| NFR-2 | Reliability | Foreign keys, enums, and typed services keep order states and references valid |
| NFR-3 | Scalability | Org-aware schema and indexed access patterns prepare the system for larger data volumes |
| NFR-4 | Security | RBAC, session-based authentication, protected routes, and owner-only admin actions are implemented |
| NFR-5 | Maintainability | Clear separation of schema, auth, service logic, UI components, and seed scripts |
| NFR-6 | Availability | Neon Postgres provides managed hosted database infrastructure |
| NFR-7 | Traceability | Workflow logs and automation run history preserve operational events |
| NFR-8 | Usability | Navigation and dashboard layout are aligned with the supply-chain domain instead of generic admin UI |

### Example: why indexes matter for software engineering
Indexes are not only a database optimization detail. They directly support both functional and non-functional requirements.

| Example Need | Engineering Concern | Index Benefit |
| --- | --- | --- |
| Org admin opens dashboard and should only see their org orders | FR-11 plus NFR-1 | `orders.organization_id` index helps fast org-scoped filtering |
| Operations team filters by order state | FR-9 plus NFR-1 | `orders.current_state` index reduces dashboard query cost |
| Delay detection checks upcoming deliveries | FR-5 plus NFR-1 | `orders.expected_delivery_at` index supports ETA-oriented queries |
| Inventory lookup must avoid duplicate rows per warehouse-product pair | FR-2 plus NFR-2 | unique index on warehouse inventory enforces one valid row for each pair |
| Owner lists admins by role | FR-10 plus NFR-4 | user role index supports fast role-scoped access management queries |

## 7 System Architecture
### Architectural style
The application follows a layered full-stack web architecture:
- **Frontend layer**: Next.js pages and React components
- **Backend layer**: route handlers and service-layer business logic
- **Database layer**: Neon Postgres with Drizzle schema definitions
- **Authentication layer**: session-backed login and RBAC tables stored in Postgres

### Request flow
1. User interacts with a page or dashboard form.
2. Server-side auth checks the current session.
3. Route handler calls the service layer.
4. Service layer applies business rules and RBAC checks.
5. Drizzle ORM reads or writes Neon Postgres.
6. Result is returned to the UI.

### Why this architecture is suitable
- keeps UI logic separate from business logic
- keeps SQL concerns separate from page concerns
- makes role and organization checks reusable
- improves maintainability and testing readiness
- maps cleanly to the original SRS workflow

## 8 Database Concepts Used
### Database technology choices
- **Neon Postgres 17**: managed PostgreSQL with branch-friendly development workflow
- **Drizzle ORM**: typed schema, relational modeling, and safer database access from TypeScript
- **PostgreSQL enums**: used for roles, order states, priorities, and carrier status

### Core database concepts applied
#### 1. Relational modeling
The domain is modeled as related tables rather than disconnected JSON blobs.

Main entities include:
- organizations
- app user profiles
- auth accounts
- auth sessions
- products
- warehouses
- carriers
- warehouse inventory
- orders
- workflow logs
- automation runs

#### 2. Foreign keys
Foreign keys ensure valid references across the system.

Examples:
- each product belongs to an organization
- each order belongs to an organization and a product
- each order may reference a warehouse and a carrier
- each workflow log belongs to an order
- org-admin users can be tied to a specific organization

This improves reliability because invalid cross-table references are blocked at the database level.

#### 3. Enumerated states
Enums are used for controlled values such as:
- user roles
- order states
- priority levels
- carrier status
- geographic region

This supports software engineering quality by preventing invalid string values from spreading through the system.

#### 4. Indexing strategy
Indexes are used where the application repeatedly filters, sorts, or enforces uniqueness.

Important examples from the schema:
- organization indexes for org-scoped access
- role indexes for access-management queries
- order state and ETA indexes for dashboard and automation logic
- carrier status indexes for operational queries
- unique warehouse inventory index for one product-row per warehouse

#### 5. Auditability
Workflow logs and automation run tables provide traceability. This is important in supply-chain systems because the system should explain what changed, when it changed, and why it changed.

### Why the database design fits the domain
The system is transactional and relationship-heavy. Orders depend on products, inventory, warehouse selection, and delivery state. That makes PostgreSQL a better fit than a loosely structured store for this project.

## 9 Backend Concepts Used
### 1. Service-layer architecture
Business logic is implemented in a dedicated service layer rather than being embedded directly inside pages.

Benefits:
- thinner route handlers
- reusable rules for order creation and updates
- centralized org-scoping and RBAC checks
- easier maintenance as the system grows

### 2. RBAC and authorization
Authorization is handled by application-level role checks.

Current role model:
- `owner`
- `org_admin`
- `admin`
- `customer`
- `automated_system`

The important backend rule is not only "who is logged in" but also "what organization they belong to".

### 3. REST-style API design
The application exposes focused route handlers for dashboard retrieval, order creation, order updates, and automation execution.

This improves separation of concerns between:
- page rendering
- client interactions
- domain behavior
- persistence logic

### 4. Workflow orchestration
The backend models supply-chain behavior as state transitions.

Examples:
- `created` to `assigned`
- `assigned` to `in_transit`
- `in_transit` to `delayed`
- `delayed` to `reassigned`
- `reassigned` or `in_transit` to `delivered`

This mirrors real operational flows and aligns the implementation with the SRS.

### 5. Session-based authentication
The system uses application tables inside Postgres for:
- user profiles
- login accounts
- active sessions

This keeps authentication tightly integrated with the RBAC model and current project needs.

## 10 Frontend Concepts Used
### 1. Domain-driven information architecture
The navigation is based on the supply-chain domain, not a generic template.

Examples:
- platform overview on the public landing page
- control tower navigation after login
- owner-only access to team and organization management

### 2. Role-aware UI
The interface changes according to the logged-in role.

Examples:
- owner sees organization and admin management capabilities
- org admin sees only organization-relevant dashboard data
- non-dashboard roles do not receive internal navigation

### 3. Task-oriented dashboard design
The dashboard is structured around operational tasks:
- reviewing orders
- monitoring inventory signals
- checking carrier and warehouse conditions
- triggering automation
- reading traceability logs

### 4. Reusable component design
UI behavior is split into focused components such as:
- order explorer
- create-order form
- status pills
- admin access panel
- site header

This supports maintainability and consistent behavior across the app.

## 11 Organization-Based Access Model
This is one of the most important software engineering improvements in the current implementation.

### Owner responsibilities
- create organizations
- create platform admins
- create org admins for a chosen organization
- view all organizations and all orders

### Org admin responsibilities
- operate only inside their assigned organization
- see only that organization's orders and related dashboard data
- create orders only for that organization

### Platform admin responsibilities
- view and manage cross-organization operations
- support the platform without owner-only provisioning powers

### Why this matters
Without organization scoping, an "org admin" role is only a label. With organization IDs in the schema and org-aware filtering in the backend, the role becomes meaningful and aligned with real multi-tenant operations.

## 12 API and Route Map
### Public routes
- `/` - landing page
- `/login` - login page

### Protected routes
- `/dashboard` - main control tower
- `/dashboard/admins` - owner-only team and organization management

### API routes
- `GET /api/dashboard` - dashboard snapshot for the current authorized user
- `GET /api/orders` - list orders within the user's allowed scope
- `POST /api/orders` - create order within permitted scope
- `GET /api/orders/:orderId` - fetch a single order within permitted scope
- `PATCH /api/orders/:orderId` - update delivery state or reassign logistics
- `POST /api/automation/run` - execute an automation cycle

## 13 Project Structure
```text
app/
  api/                     Route handlers
  dashboard/               Protected dashboard routes
  login/                   Login page
  page.tsx                 Public landing page

components/
  auth/                    Login UI
  dashboard/               Order, status, and admin widgets
  site/                    Navigation and header UI

lib/
  auth/                    Authentication and RBAC services
  db/                      Database client and schema
  supply-chain/            Domain types, services, and seed data

scripts/
  seed.ts                  Seed script

drizzle/
  *.sql                    Generated migration artifacts
```

## 14 Setup and Initialization
### Prerequisites
- Node.js 20+
- npm
- Neon account
- VS Code or another compatible editor for Neon extension workflow

### Project stack
- Next.js 16.2.1
- React 19
- TypeScript
- Tailwind CSS 4
- Neon Postgres 17
- Drizzle ORM
- `@neondatabase/serverless`
- `lucide-react`

### Recommended Neon project settings
- Project name: `srs`
- Postgres version: `17`
- Cloud provider: `AWS`
- Region: `AWS Asia Pacific 1 (Singapore)`

### Quick initialization
```bash
npm install
npm run db:push -- --force
npm run db:seed
npm run dev
```

### Environment variables
Use `.env` in the project root.

```env
DATABASE_URL=postgresql://<user>:<password>@<host>/<database>?sslmode=require
NEONDB_CONN=
SEED_OWNER_PASSWORD=AvniOwner@2026
SEED_ORG_ADMIN_PASSWORD=NandishOrg@2026
SEED_ADMIN_PASSWORD=ArpitAdmin@2026
```

### Neon integration in VS Code
Recommended command:

```bash
npx neonctl@latest init
```

This helps connect your local workspace to a Neon project and branch through the Neon tooling flow.

For detailed onboarding instructions, use [SETUP.md](./SETUP.md).

## 15 Seed Data and Demo Accounts
The project includes seeded organizations, internal users, products, warehouses, carriers, inventory rows, orders, logs, and automation data.

### Seeded demo accounts
- Owner: `avni.owner@srs.local` / `AvniOwner@2026`
- Org Admin: `nandish.orgadmin@srs.local` / `NandishOrg@2026`
- Platform Admin: `arpit.admin@srs.local` / `ArpitAdmin@2026`

These are development-only credentials and should not be reused for production systems.

## 16 Current Status
### Implemented now
- public landing page
- login and session system
- role-aware navigation
- owner-only organization and admin provisioning
- org-aware data model
- org-scoped order visibility for org admins
- dashboard monitoring
- workflow logging and traceability
- Neon Postgres with Drizzle ORM

### Verification completed
- schema generation works
- schema push works
- seed script works
- lint passes
- production build passes

## 17 Future Enhancements
Planned next steps aligned with the SRS:
- customer-facing self-service portal
- invite and password reset flow for internal users
- richer analytics and reporting dashboards
- GPS or external carrier feed integration
- predictive delay detection
- advanced notification services

## Final Note
This repository is best understood as a software engineering implementation of an SRS, not only a frontend website.

It demonstrates how requirements become:
- structured relational data
- role-aware backend logic
- organization-aware authorization
- operational UI workflows
- performance and maintainability decisions such as indexing, modular services, and audit logging
