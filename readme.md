# Wobot Task Management API

A RESTful backend API for a **Team Task Management** platform. Built with **Node.js + Express + TypeScript**, it uses a dual-database architecture — **MongoDB** for user authentication and **PostgreSQL** for project and task data — giving each concern the database best suited to it.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Seeding Demo Data](#seeding-demo-data)
- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Features](#features)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Data Models](#data-models)
- [Business Rules](#business-rules)
- [Background Jobs](#background-jobs)

---

## Getting Started

### Prerequisites
- Node.js 20+
- Docker (to run PostgreSQL and MongoDB as containers)

### 1. Start the databases

Run PostgreSQL and MongoDB as standalone Docker containers. These match the credentials and ports in `.env` exactly.

**PostgreSQL:**
```bash
docker run -d --name wobot_postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD="Root123$" -e POSTGRES_DB=task_mgmt -p 5432:5432 -v wobot_postgres_data:/var/lib/postgresql/data postgres:16-alpine
```

**MongoDB:**
```bash
docker run -d --name wobot_mongo -e MONGO_INITDB_DATABASE=task_mgmt -p 27017:27017 -v wobot_mongo_data:/data/db mongo:7-jammy
```

To stop the containers:
```bash
docker stop wobot_postgres wobot_mongo
```

To start them again after a restart:
```bash
docker start wobot_postgres wobot_mongo
```

To remove them entirely (data is preserved in the named volumes):
```bash
docker rm wobot_postgres wobot_mongo
```

### 2. Set up environment variables

Create a `.env` file in the project root:

```env
PORT=5000
DATABASE_URL=postgresql://postgres:Root123$@localhost:5432/task_mgmt?schema=public
MONGO_URI=mongodb://localhost:27017/task_mgmt
JWT_SECRET=<your-secret-key>
```

### 3. Install and run

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Start dev server
npm run dev
```

The API will be available at `http://localhost:5000`.

---

## Seeding Demo Data

```bash
npm run seed
```

This creates:
- **Alice** (`alice@example.com` / `Alice@123`) — project owner
- **Bob** (`bob@example.com` / `Bob@123`) — team member
- A **"Website Redesign"** project owned by Alice
- **6 tasks** covering all statuses, priorities and overdue states

After seeding, the cron job will automatically mark past-due tasks as overdue within the first minute.

### Postman collection (seeded)

A ready-to-use Postman collection is included in the repository:

```
Wobot-Task-Management-Seeded.postman_collection.json
```

Import it into Postman — all requests are pre-configured with Alice's and Bob's credentials, the seeded project ID, and task IDs. You can immediately verify every endpoint including authentication, project CRUD, task operations, filters, and the analytics report without any manual setup.

> There is also a generic `Wobot-Task-Management.postman_collection.json` collection if you prefer to supply your own tokens and IDs.

---

## Overview

This API powers a team collaboration tool where users can:

- Register and log in securely with JWT-based authentication
- Create and manage **projects** they own
- Create **tasks** inside projects, assign them to team members, set priorities and due dates
- Filter and query tasks across the platform
- View per-project **reports** with completion rates, overdue counts and unresolved high-priority tasks
- Have tasks automatically flagged as **overdue** by a background scheduler

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 |
| Framework | Express v5 |
| Language | TypeScript (strict mode) |
| User DB | MongoDB via Mongoose v9 |
| Project/Task DB | PostgreSQL via Prisma v7 |
| Auth | bcrypt + JSON Web Tokens |
| Scheduler | node-cron |
| Dev server | ts-node-dev |
| Containerisation | Docker |

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Express API (port 5000)         │
│                                                  │
│  /api/auth      → Auth Module (register/login)  │
│  /api/projects  → Project Module (CRUD)         │
│  /api/projects  → Report Module (analytics)     │
│  /api/tasks     → Task Module (CRUD + filter)   │
└────────────┬────────────────────┬───────────────┘
             │                    │
     ┌───────▼──────┐    ┌────────▼────────┐
     │   MongoDB    │    │   PostgreSQL     │
     │  (Users)     │    │  (Projects +     │
     │  Mongoose    │    │   Tasks) Prisma  │
     └──────────────┘    └─────────────────┘
```

**Cross-database hydration:** Every task response joins data from both databases in a single batch — PostgreSQL supplies the task and project fields; MongoDB supplies the `assignee` (name, email) and project `owner` (name, email) in one `User.find()` call. No N+1 queries.

---

## Features

### Authentication
- **Register** — creates a user account with a bcrypt-hashed password (12 salt rounds)
- **Login** — validates credentials and returns a signed JWT (7-day expiry)
- All protected routes require `Authorization: Bearer <token>`

### Projects
- Full **CRUD** for projects
- Only the **owner** can update or delete their own project
- `GET /api/projects` returns only projects owned by the authenticated user

### Tasks
- Full **CRUD** for tasks at a flat `/api/tasks` route (no nested URLs)
- Tasks belong to a project via `projectId`
- Tasks can be assigned to any registered user via `assignedTo` (MongoDB user ID)
- **Filtering** by `projectId`, `status`, `priority`, and `assignedTo` via query parameters
- Every task response includes a hydrated `project`, `assignee`, and `owner` object

### Reports
- `GET /api/projects/:id/report` — owner-only analytics for a project:
  - Total task count
  - Breakdown by status (`todo` / `in_progress` / `done`)
  - Overdue task count
  - Completion rate (%)
  - List of unresolved high-priority tasks with assignee details

### Overdue Detection
- A **cron job** runs every minute and marks tasks as `isOverdue: true` when their `dueDate` is within 24 hours and status is not `done`

---

## Project Structure

```
wobot-task-management-api/
├── prisma/
│   ├── schema.prisma          # PostgreSQL schema (Project, Task)
│   └── migrations/            # Prisma migration history
├── src/
│   ├── config/
│   │   ├── prisma.ts          # Prisma client with pg driver adapter
│   │   └── mongo.ts           # Mongoose connection
│   ├── models/
│   │   └── User.ts            # Mongoose User model
│   ├── middleware/
│   │   └── authenticate.ts    # JWT verification middleware
│   ├── types/
│   │   ├── auth.ts            # AuthRequest, RegisterInput, LoginInput
│   │   ├── project.ts         # ProjectRequest, CreateProjectInput
│   │   ├── task.ts            # TaskRequest, TaskWithAssignee, filters
│   │   └── report.ts          # ProjectReport, HighPriorityTask
│   ├── modules/
│   │   ├── auth/              # register + login (controller, service, routes)
│   │   ├── project/           # CRUD (controller, service, routes)
│   │   ├── task/              # CRUD + filter (controller, service, routes)
│   │   └── report/            # Analytics (controller, service, routes)
│   ├── jobs/
│   │   └── overdueTask.job.ts # node-cron overdue detection
│   ├── app.ts                 # Express app + route mounting
│   ├── server.ts              # DB connections + server start
│   └── seed.ts                # Demo data seeder
├── Dockerfile
├── docker-compose.yml
├── docker-entrypoint.sh
├── prisma.config.ts
└── .env
```

---

## API Endpoints

### Health
| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| GET | `/health` | No | Liveness check |

### Auth
| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Get JWT token |

### Projects
| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | `/api/projects` | Yes | Create project |
| GET | `/api/projects` | Yes | List own projects |
| GET | `/api/projects/:id` | Yes | Get project by ID |
| PUT | `/api/projects/:id` | Yes (owner) | Update project |
| DELETE | `/api/projects/:id` | Yes (owner) | Delete project |

### Tasks
| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | `/api/tasks` | Yes (project owner) | Create task |
| GET | `/api/tasks` | Yes | List tasks (filterable) |
| GET | `/api/tasks/:id` | Yes | Get task by ID |
| PUT | `/api/tasks/:id` | Yes (assignee) | Update task |
| DELETE | `/api/tasks/:id` | Yes (project owner) | Delete task |

**Task query filters:** `?projectId=&status=todo|in_progress|done&priority=low|medium|high&assignedTo=<userId>`

### Reports
| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| GET | `/api/projects/:id/report` | Yes (owner) | Project analytics |

---

## Data Models

### User (MongoDB)
```
id           ObjectId
name         String
email        String (unique, lowercase)
password_hash String
created_at   Date
```

### Project (PostgreSQL)
```
id           String (cuid)
name         String
description  String?
ownerId      String  ← MongoDB User _id
createdAt    DateTime
```

### Task (PostgreSQL)
```
id           String (cuid)
title        String
description  String?
status       Enum: todo | in_progress | done
priority     Enum: low | medium | high
assignedTo   String  ← MongoDB User _id
dueDate      DateTime?
isOverdue    Boolean (default: false)
projectId    String  → Project.id (cascade delete)
createdAt    DateTime
updatedAt    DateTime
```

---

## Business Rules

| Action | Who can do it |
|--------|---------------|
| Create project | Any authenticated user |
| Update / Delete project | Project owner only |
| Create task | Project owner only |
| Read tasks / task by ID | Any authenticated user |
| Update task | Assigned user only |
| Delete task | Project owner only |
| View project report | Project owner only |

---

## Background Jobs

**Overdue Task Detector** — runs every minute via `node-cron`:

- Finds all tasks where `dueDate ≤ now + 24h`, `status ≠ done`, and `isOverdue = false`
- Batch-updates them to `isOverdue: true`
- Logs the count of tasks updated on each tick

