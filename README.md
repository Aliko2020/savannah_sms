# SavannaSMS

A modern school management system backend built with **Express**, **TypeScript**, and **Prisma**. It handles authentication and role-based access control for users (SUPER_ADMIN / ADMIN / TEACHER / STUDENT), and models the core academic domain: academic years, terms, classes, subjects, enrollment, scores, attendance, and guardians.

## Tech stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Web framework | Express 5 |
| ORM | Prisma 7 (`prisma-client` generator, driver adapters) |
| Database | PostgreSQL 15 (via `pg` + `@prisma/adapter-pg`) |
| Auth | JWT (`jsonwebtoken`) + bcrypt password hashing |
| Local DB | Docker Compose |

## Project structure

```
prisma/
  schema.prisma          Data model (User, profiles, academics, guardians, etc.)
  migrations/             Migration history
  seed.ts                 Seeds the initial SUPER_ADMIN account
src/
  config/db.ts             Prisma client instance
  controllers/
    authController.ts      login
    userController.ts       createUser (admin-only account creation for all roles)
  middlewares/
    auth.ts                 authenticate + authorize JWT middleware
    errorHandler.ts          Central error handler
  routes/
    userRoutes.ts            /api/users (admin-only)
  services/
    userService.ts           Shared user + profile creation logic
  types/express.d.ts        Adds `req.user` to Express's Request type
  utils/appError.ts          Operational error class
  index.ts                   App entrypoint
```

## Prerequisites

- Node.js 20+
- Docker (for local PostgreSQL) — or a PostgreSQL 15+ instance you manage yourself

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Copy the env template and fill in your own values (see table below)
cp .env.example .env

# 3. Start PostgreSQL locally via Docker
docker-compose up -d

# 4. Apply the database schema
npx prisma migrate deploy

# 5. Generate the Prisma client (needed after schema changes)
npx prisma generate

# 6. Seed the initial SUPER_ADMIN account
npm run seed

# 7. Start the dev server (auto-reloads on file changes)
npm run dev
```

The API is now available at `http://localhost:5000` (or whatever `PORT` you configured).

## Environment variables

Set these in a `.env` file at the project root (never commit it — it's gitignored).

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Full PostgreSQL connection string used by Prisma at runtime |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | Individual DB connection pieces, used by `docker-compose.yml` to provision the local Postgres container |
| `PORT` | Port the Express server listens on (defaults to `5000`) |
| `JWT_SECRET` | Secret used to sign/verify login JWTs — use a long random string, never reuse across environments |
| `SEED_ADMIN_USERNAME` | Username/phone for the SUPER_ADMIN created by `npm run seed` |
| `SEED_ADMIN_PASSWORD` | Password for that seeded SUPER_ADMIN |

## Data model overview

Defined in [`prisma/schema.prisma`](prisma/schema.prisma):

- **User** — the auth table. `username` is the login identifier (phone for staff, admission number for students). Has a `role` (`SUPER_ADMIN` / `ADMIN` / `TEACHER` / `STUDENT`) and an optional `TeacherProfile` or `StudentProfile`.
- **TeacherProfile** / **StudentProfile** — role-specific data (employee ID/department; admission number/date of birth).
- **Guardian** / **StudentGuardian** — many-to-many: a guardian can have multiple children, a student can have multiple guardians.
- **AcademicYear** / **Term** — the academic calendar.
- **Class** — a homeroom for one academic year, optionally assigned a form teacher.
- **Subject** / **ClassSubject** — a subject taught to a specific class by a specific teacher.
- **Enrollment** — links a student to a homeroom class.
- **Score** — one row per student, per subject, per term.
- **Attendance** — one row per student, per day.

## Authentication & authorization

Auth uses stateless JWTs. On successful login, the server signs a token containing `{ userId, role }`, valid for 24 hours.

Protected routes use two middlewares from [`src/middlewares/auth.ts`](src/middlewares/auth.ts):

- **`authenticate`** — requires a valid `Authorization: Bearer <token>` header; attaches `req.user = { id, role }`.
- **`authorize(...roles)`** — requires `authenticate` to have run first; rejects with `403` if `req.user.role` isn't in the allowed list.

**Role creation policy:**
- There is no public self-registration endpoint. Every account — `STUDENT` included — is created by an existing, authenticated `ADMIN`/`SUPER_ADMIN` calling `POST /api/users`.
- This is deliberate: identifiers like a student's admission number are issued by school administration, not chosen by whoever's signing up. Letting students self-register would mean anyone could invent their own admission number. The one exception is the very first `SUPER_ADMIN`, which is created out-of-band by `npm run seed`.

## API reference

All request/response bodies are JSON. Send `Content-Type: application/json`.

### `GET /status`

Health check.

```json
{ "message": "Welcome to SavannaSMS API backend!", "documentation": "..." }
```

### `POST /api/auth/login`

**Request**
```json
{ "username": "STU-2026-001", "password": "SomeStrongPassword!" }
```

**Response — `200 OK`**
```json
{
  "message": "Login successful!",
  "token": "<jwt>",
  "user": {
    "id": "...",
    "username": "STU-2026-001",
    "firstName": "Jane",
    "lastName": "Doe",
    "role": "STUDENT"
  }
}
```

**Errors**
- `400` — missing `username`/`password`
- `401` — invalid credentials
- `403` — account deactivated (`isActive: false`)

### `POST /api/users` 🔒 ADMIN / SUPER_ADMIN only

Creates any account type (`TEACHER`, `ADMIN`, `SUPER_ADMIN`, or `STUDENT`) — this is the *only* way to create an account. Requires `Authorization: Bearer <token>` for a caller whose role is `ADMIN` or `SUPER_ADMIN`.

**Request — creating a teacher**
```json
{
  "username": "0501112222",
  "password": "SomeStrongPassword!",
  "firstName": "Tina",
  "lastName": "Teach",
  "role": "TEACHER",
  "profileData": {
    "employeeId": "EMP-001",
    "department": "Science"
  }
}
```

**Request — creating a student**
```json
{
  "username": "STU-2026-001",
  "password": "SomeStrongPassword!",
  "firstName": "Jane",
  "lastName": "Doe",
  "email": "jane@example.com",
  "role": "STUDENT",
  "profileData": {
    "admissionNumber": "STU-2026-001",
    "dateOfBirth": "2012-05-14",
    "guardianName": "John Doe",
    "guardianPhone": "0501234567",
    "guardianEmail": "john@example.com"
  }
}
```

`email` and `profileData` (and everything inside it) are optional. For a `STUDENT`, if `admissionNumber` is omitted it falls back to `username`; if `guardianName` and `guardianPhone` are both supplied, a `Guardian` record is created and linked as the student's primary guardian.

**Response — `201 Created`**
```json
{ "message": "TEACHER account created successfully!", "userId": "..." }
```

**Errors**
- `400` — missing required fields, invalid `role`, or duplicate identifier
- `401` — missing/invalid/expired token
- `403` — authenticated but not `ADMIN`/`SUPER_ADMIN`
- `500` — unexpected server error

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the server with `tsx watch` (auto-restarts on changes) |
| `npm run seed` | Creates the initial SUPER_ADMIN from `SEED_ADMIN_USERNAME`/`SEED_ADMIN_PASSWORD` in `.env` (no-op if that username already exists) |
| `npx prisma migrate dev` | Creates and applies a new migration during development |
| `npx prisma migrate deploy` | Applies pending migrations (use in production/CI) |
| `npx prisma generate` | Regenerates the Prisma client into `src/generated/prisma` after schema changes |
| `npx prisma studio` | Opens a local GUI for browsing/editing the database |

## Security notes

- Passwords are hashed with `bcrypt` before storage — never stored or logged in plain text by the application code.
- `.env` is gitignored; never commit real secrets. Rotate `JWT_SECRET` and any seeded admin password if they're ever accidentally exposed (e.g. committed to git history).
- `JWT_SECRET` must be set for the server to issue or verify tokens.
- Role escalation is only possible through an authenticated `ADMIN`/`SUPER_ADMIN` session — treat those accounts' credentials with the same care as your database credentials.
