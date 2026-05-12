# Backend Assignment
## Project & Task Management API

---

## Background

You are building the backend for a **Team Task Management** platform, similar in spirit to what powers exception reporting and analytics dashboards. Teams create projects, assign tasks, track statuses, and get summary reports.

---

## Architecture Overview

This service uses **two databases** intentionally:

| Concern | Database | Reason |
|---|---|---|
| Users & Auth | MongoDB | Flexible schema for user profiles, easy to extend |
| Projects & Tasks | PostgreSQL | Relational data, complex queries, reporting |

You are expected to manage both connections cleanly and justify this split in your README.

---

## Core Requirements

### 1. Authentication (MongoDB)

- Register and login with email + password (bcrypt for hashing)
- JWT-based auth (access token)
- User document stored in MongoDB: `name`, `email`, `password_hash`, `created_at`
- All routes below must be protected
- **Cross-DB join requirement:** Tasks in PostgreSQL reference users by their MongoDB `_id` (stored as a `user_id` text/uuid column). The API response for a task must include the assignee's `name` and `email` -- meaning the candidate must manually resolve this across both databases

### 2. Projects (PostgreSQL)

- Create, read, update, delete projects
- A project has: `name`, `description`, `owner_id` (MongoDB user `_id`), `created_at`

### 3. Tasks (PostgreSQL)

- Create tasks under a project
- Each task has:
  - `title`
  - `description`
  - `status` (`todo` / `in_progress` / `done`)
  - `priority` (`low` / `medium` / `high`)
  - `assigned_to` (MongoDB user `_id`)
  - `due_date`
- Update task status and other fields
- Filter tasks by status, priority, assigned user

### 4. Database Schema (PostgreSQL)

- Design normalized tables with proper foreign keys and indexes
- Include a `migrations/` folder or SQL seed file -- schema must be reproducible
- `owner_id` and `assigned_to` columns store MongoDB ObjectIDs as `TEXT` (no FK to Mongo, enforced at app layer)

### 5. Background Job

- When a task's `due_date` is within 24 hours and status is not `done`, mark it as overdue (`is_overdue` boolean flag on the task)
- Should run as a scheduled job (e.g. `node-cron`) -- not triggered by an API call
- Demonstrate it works in the README (can use a short polling interval for demo purposes)

### 6. Reporting Endpoint

```
GET /projects/:id/report
```

Returns a summary for a project:

- Total tasks, broken down by status
- Number of overdue tasks
- Task completion rate (%)
- List of high-priority unresolved tasks, each with assignee `name` + `email` (resolved from MongoDB)

---

## Bonus *(Optional, only if time permits)*

- Pagination on task listing
- Role-based access: only project owners can delete a project
- Unit test for the report logic or the overdue job
- Docker Compose setup that spins up the app, PostgreSQL, and MongoDB together with a single `docker-compose up`

---

## Submission Guidelines

- Push to a **public GitHub repository**
- Each feature must be a **separate commit** -- we evaluate your thought process and how you break down work, not just the final result

**Example commit progression:**

```
init project setup
add auth (register/login)
add projects CRUD
add tasks CRUD
add overdue background job
add reporting endpoint
```

- You do not need to complete the entire assignment to submit. A polished, working subset is far better than rushed incomplete code across all features. Submit whatever you finish within the time limit.

**`README.md` must include:**

- Setup instructions (env vars, both DB setups, running locally)
- API documentation (endpoints, request/response shapes)
- Brief note on why the DB split is designed this way and how cross-DB references are handled
- Any trade-offs or things you'd improve with more time

---

## Evaluation Criteria

| Criterion | What We Look For |
|---|---|
| **API Design** | Clean REST conventions, consistent error responses, proper status codes |
| **Schema Design** | Normalized PG tables, sensible MongoDB schema, reproducible migrations |
| **Polyglot Persistence** | Clean separation of DB concerns, both connections managed properly |
| **Cross-DB Resolution** | User data correctly hydrated into task/report responses without leaking DB internals |
| **Auth** | Secure JWT implementation, protected routes, no obvious vulnerabilities |
| **Background Job** | Correct scheduling logic, separation from request cycle |
| **Code Quality** | TypeScript usage (avoid `any`), folder structure, separation of concerns |
| **Commit History** | Are features broken down logically? Does the history tell a clear story? |
| **README** | Can another engineer run this in under 5 minutes? |

---

## Notes

- You don't need a frontend -- Postman or cURL is fine for testing
- Use any libraries you're comfortable with (`mongoose`, `prisma`, `knex`, `pg`, `node-cron`, etc.)
- AI tools are allowed, but your README should reflect your own thinking, especially around the dual-DB design