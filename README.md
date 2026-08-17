# SecureNotes API

A note-taking REST API with JWT authentication, role-based access control, and
MongoDB aggregation pipelines — built for the Care Guide BD backend task.

## Try it now

| | |
|---|---|
| **Live API** | `<render-url>` — index at `/`, **Swagger at `/api/docs`**, health at `/api/health` |
| **Live frontend** | `<vercel-url>` |
| **Frontend repo** | `<github-url>` |

**Sign in with either account — no signup needed:**

| Role | Email | Password | What it demonstrates |
|---|---|---|---|
| **Admin** | `admin@test.com` | `admin123` | everything: all 70 notes with authors, user management, the grouped-by-interests aggregation |
| **User** | `alice@test.com` | `password123` | own 16 notes only, all 30 posts, own profile — and `403` on every admin route |

Sign in as **both** to see the access control work. The 22 other seeded users
(`bob@`, `charlie@`, `diana@` … all `@test.com`) share the password
`password123`.

> **Free-tier note:** Render idles the service after inactivity, so the very
> first request may take up to a minute to wake it. Everything after that is
> immediate. Open `<render-url>/api/health` first if the frontend looks stuck.

The fastest way to exercise the API directly is **Swagger at `/api/docs`** —
click *Authorize*, paste the token from `POST /api/auth/login`, and every
endpoint is callable from the browser.

**Stack:** NestJS 11 · Mongoose 9 · Passport (JWT + local) · bcrypt · MongoDB 7 / Atlas

---

## Contents

1. [Quick start](#quick-start)
2. [Seed data](#seed-data)
3. [Roles and permissions](#roles-and-permissions)
4. [Indexing strategy](#indexing-strategy) ← the graded part
5. [Aggregation pipelines](#aggregation-pipelines) ← the graded part
6. [API reference](#api-reference)
7. [Security](#security)
8. [Tests](#tests)
9. [Project layout](#project-layout)
10. [Deployment](#deployment)

---

## Quick start

```bash
# 1. A MongoDB to talk to — either Docker locally…
docker-compose up -d
#    …or MongoDB Atlas (put the connection string in .env)

# 2. Configure
cp .env.example .env        # fill in MONGODB_URI and JWT_SECRET

# 3. Install, seed, run
npm install
npm run seed                # sample data + syncs the indexes
npm run start:dev           # http://localhost:5001
```

Open <http://localhost:5001/api/docs> for Swagger, where you can log in and
call every endpoint from the browser.

The app refuses to start if `MONGODB_URI` or `JWT_SECRET` is missing, or if the
secret is shorter than 16 characters — a clear boot error beats a mysterious
500 on first login. Generate a secret with `openssl rand -hex 32`.

### Scripts

| Command | Purpose |
|---|---|
| `npm run start:dev` | watch mode |
| `npm run build` / `npm run start:prod` | compile / run compiled output |
| `npm run seed` | reset sample data **and** sync indexes |
| `npm test` | 34 unit tests, no database needed |
| `npm run smoke` | 41 end-to-end checks against a running server |

---

## Seed data

`npm run seed` loads a dataset sized so that **every list paginates** — a
single page of results would not show the pagination requirement working.

| Collection | Count | Pages at `limit=10` |
|---|---|---|
| users | 24 | 3 |
| notes | 70 (admin sees all) | 7 |
| notes owned by `alice@test.com` | 16 | 2 |
| posts | 30 | 3 |
| distinct interests | 14 | 2 pages at `limit=9` |
| posts by `alice@test.com` (Scenario 2) | 6 | 2 at `limit=5` |

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@test.com` | `admin123` |
| **User** | `alice@test.com` | `password123` |

The other 22 users are `bob@`, `charlie@`, `diana@`, `ethan@`, `fiona@`,
`george@`, `hannah@`, `ibrahim@`, `julia@`, `kabir@`, `lena@`, `marcus@`,
`nadia@`, `oliver@`, `priya@`, `quentin@`, `rania@`, `samuel@`, `tanvir@`,
`ursula@`, `victor@`, `wendy@` — all `@test.com` / `password123`.

Re-running the seed resets everything, including anything created during a
demo.

---

## Roles and permissions

| Capability | User | Admin |
|---|:--:|:--:|
| Create / read / update / delete **own** notes | ✅ | ✅ |
| Read / update / delete **anyone's** notes | ❌ | ✅ |
| Read all posts, write own posts | ✅ | ✅ |
| Edit own name and interests | ✅ | ✅ |
| List / create / update / delete users | ❌ | ✅ |
| Users-grouped-by-interest view | ❌ | ✅ |

Enforced in three layers:

1. **`JwtAuthGuard`** (global) — every route needs a valid token unless
   explicitly marked `@Public()`. Deny by default, so a new route is protected
   before anyone remembers to protect it.
2. **`RolesGuard`** (global) — `@Roles('admin')` sits on the whole
   `UsersController`; only the two `/users/me` routes step back down to
   `@Roles('user', 'admin')`.
3. **Ownership inside the query** — `NotesService` puts `userId` into the
   filter rather than checking it after reading:

   ```ts
   private scope(user: AuthUser, extra = {}) {
     return user.role === 'admin'
       ? extra
       : { ...extra, userId: new Types.ObjectId(user.userId) };
   }
   ```

   A user's request can only ever match their own document, so there is no
   read-then-check window, and someone else's note is reported as `404` rather
   than `403` — no way to probe which note IDs exist.

Two things that are easy to get wrong and are handled here:

- **The token is not the source of truth.** `JwtStrategy.validate()` re-reads
  the user on every request, so deleting a user or changing their role takes
  effect immediately instead of lingering until the token expires.
- **Password hashes never leave the database.** `password` is `select: false`
  on the schema, and `toJSON`/`toObject` strip it as a second line of defence.
  Only `AuthService` opts back in, via `.select('+password')`.

---

## Indexing strategy

The brief penalises unnecessary indexes, so every index here is justified by a
query that ships, and the numbers below come from `explain('executionStats')`
against a seeded Atlas cluster — not from intuition. All are declared with
`schema.index()`.

| Collection | Index | Query it serves |
|---|---|---|
| users | `{ email: 1 }` unique | login lookup + registration uniqueness |
| users | `{ interests: 1, _id: -1 }` | `GET /users?interest=…` and Scenario 1 |
| notes | `{ userId: 1, _id: -1 }` | a user's notes list, and every `/notes/:id` operation |
| posts | `{ userId: 1, _id: -1 }` | Scenario 2's `$match` **and** its `$sort` |

Three declared indexes, plus the default `_id` index — deliberately relied
upon rather than duplicated.

### Why `_id` is the sort key everywhere

ObjectIds are monotonic by creation time, so ordering by `_id` **is** ordering
by creation time. Sorting on `createdAt` instead would have needed a
`createdAt` component in every index — three extra index fields buying nothing.
The measurable result: Scenario 2 has no `SORT` stage at all.

### What the default `_id` index already covers

No extra index is needed for `GET /users/:id`, `GET /notes/:id`,
`GET /auth/me`, `GET /users/me`, the `$lookup` join on `users._id`, or the
admin "list everything" views (no filter, sorted by `_id`). Adding indexes for
these would be exactly the redundancy the brief warns about.

### Measured plans

Against the seeded database (24 users, 70 notes, 30 posts):

```
login by email          EXPRESS_IXSCAN(email_1)               keys=1  docs=1  returned=1

notes page for a user   IXSCAN(userId_1__id_-1) → FETCH → LIMIT
(limit=10 of 16 owned)                                        keys=10 docs=10 returned=10
                        …only the requested page is touched, not all 16

users ?interest=chess   IXSCAN(interests_1__id_-1) → FETCH → LIMIT
                                                              keys=7  docs=7  returned=7
                        …7 of 24 users examined, and no SORT stage

Scenario 2 ($lookup)    IXSCAN(userId_1__id_-1) → FETCH       keys=6  docs=6  returned=6
                        …no SORT stage: the index already supplies _id order

Scenario 1 (grouping)   IXSCAN(interests_1__id_-1) → FETCH    keys=64 docs=24 returned=24
                        drop the index and the identical pipeline becomes a COLLSCAN
```

`keys=64` against `docs=24` in Scenario 1 is expected, not a defect: a multikey
index holds one entry per array element, and these 24 users have 64 interests
between them. Every document is visited because grouping *all* users requires
it — see the caveat below.

### How the interests index was chosen

Three candidates were built and measured on a 5,000-user collection:

| Index | `?interest=chess` page (keys / docs examined) |
|---|---|
| `{ interests: 1 }` | 100 / 100 — planner falls back to `_id`, then filters |
| `{ interests: 1, name: 1, email: 1 }` | 100 / 100 — same fallback |
| **`{ interests: 1, _id: -1 }`** | **10 / 10** |

The trailing `_id: -1` is what lets a single index satisfy the equality match
*and* the page ordering. The `name`/`email` variant was an attempt at a covered
query; it does not work, because **a multikey index can never cover a query** —
MongoDB cannot rebuild the original array from index entries, so the `FETCH`
stage stays regardless. Those two fields would have cost index size for zero
benefit, so they were dropped.

Honest caveat: the grouping pipeline visits every user by nature, so the index
turns a `COLLSCAN` into an `IXSCAN` without changing the asymptotic work. Its
decisive win is the filtered query above.

### Keeping the deployed indexes honest

`npm run seed` calls `syncIndexes()`, which creates what the schemas declare
**and drops anything they no longer declare**. So `db.users.getIndexes()` on
the live database matches the code exactly — leftovers from an earlier
iteration cannot quietly inflate the count. The seed prints the resulting
index names on every run:

```
users: 8  [_id_, email_1, interests_1__id_-1]
notes: 25 [_id_, userId_1__id_-1]
posts: 15 [_id_, userId_1__id_-1]
```

---

## Aggregation pipelines

### Scenario 1 — users grouped by interests

`GET /api/users/grouped-by-interests?page=1&limit=9` *(admin)* →
[`users.service.ts`](src/modules/users/users.service.ts)

Exactly **one** `collection.aggregate()` call, no other method:

```
$match  { interests: { $exists: true, $ne: [] } }   ← makes the index eligible
$unwind '$interests'
$group  by interest → count + the users in it
$sort   count desc, then interest name
$facet  { data: [$skip, $limit], total: [$count] }  ← pagination, same pass
```

`$facet` is what allows pagination without breaking the single-call
constraint: the page slice and the total group count are two branches of one
pipeline, so there is no second query and no second method call.

```json
{
  "data": [
    { "_id": "chess", "count": 4, "users": [{ "name": "Alice Johnson", "email": "alice@test.com" }] }
  ],
  "meta": { "page": 1, "limit": 3, "total": 9, "totalPages": 3 }
}
```

### Scenario 2 — a user's posts via `$lookup`

`GET /api/posts/by-user/:userId?page=1&limit=10` →
[`posts.service.ts`](src/modules/posts/posts.service.ts)

One pipeline, one `$lookup`:

```
$match  { userId }        ← IXSCAN on { userId: 1, _id: -1 }
$sort   { _id: -1 }       ← same index; no blocking sort
$facet
  total: [$count]
  data:  [$skip, $limit,
          $lookup users (sub-pipeline projects name/email only),
          $unwind, $project]
```

Two deliberate choices:

- The `$lookup` runs **inside** the page branch, so it joins only the ten
  documents being returned rather than the user's entire post history.
- Its sub-pipeline projects `{ name, email }`, so the author's password hash
  never enters the pipeline in the first place.

---

## API reference

### Interactive docs

**Swagger UI at `/api/docs`** is the fastest way to explore the API: log in via
`POST /api/auth/login`, click **Authorize**, paste the token, and every
endpoint is callable from the browser. Authorisation persists across reloads.

The OpenAPI document is generated from the code, so it cannot drift from the
implementation, and it documents the whole contract rather than just the happy
path:

- **Response envelopes are in the schema.** `{ data: Model }` for a single
  item, `{ data: Model[], meta: PaginationMeta }` for lists — not the bare
  model, which is what the global interceptor actually returns.
- **Every failure is listed per endpoint** — `400`, `401`, `403`, `404`, `409`,
  `429` — each with a description of *why* it happens, not just its name.
- **Response entities are explicit** (`UserEntity`, `NoteEntity`,
  `PostWithAuthorEntity`, …), so the schema shows exactly what comes back —
  including the absence of `password`.
- Raw OpenAPI JSON is at **`/api/docs-json`**, importable straight into Postman
  or Insomnia.

### Contract

Every response is wrapped as `{ "data": … }`. List endpoints add `meta`:

```json
{ "data": [ … ], "meta": { "page": 1, "limit": 10, "total": 25, "totalPages": 3 } }
```

All list endpoints accept `?page=` and `?limit=` (1–100, default 10) —
including both aggregations.

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | `/` | public | service index |
| GET | `/api/health` | public | status + database connectivity |
| GET | `/api/docs` | public | Swagger UI |
| POST | `/api/auth/register` | public | rate limited 10/min |
| POST | `/api/auth/login` | public | rate limited 10/min |
| GET | `/api/auth/me` | any | read through to the database |
| GET | `/api/users/me` | any | own profile |
| PATCH | `/api/users/me` | any | own name + interests only |
| GET | `/api/users` | admin | paginated, `?interest=` filter |
| POST | `/api/users` | admin | |
| GET | `/api/users/:id` | admin | |
| PUT | `/api/users/:id` | admin | cannot demote yourself |
| DELETE | `/api/users/:id` | admin | cascades to notes + posts; cannot delete yourself |
| GET | `/api/users/grouped-by-interests` | admin | **Scenario 1** |
| GET | `/api/notes` | any | own notes; admin sees all, with authors populated |
| POST | `/api/notes` | any | |
| GET/PUT/DELETE | `/api/notes/:id` | owner or admin | |
| GET | `/api/posts` | any | all posts, author populated |
| POST | `/api/posts` | any | |
| GET | `/api/posts/by-user/:userId` | any | **Scenario 2** |

**Status codes:** `400` validation or malformed ObjectId · `401` missing,
invalid, expired or revoked token · `403` wrong role · `404` missing *or not
yours* · `409` duplicate email · `429` rate limited.

### Try it

```bash
TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@test.com","password":"admin123"}' | jq -r .data.access_token)

curl -s "http://localhost:5001/api/users/grouped-by-interests?limit=3" \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## Security

| Concern | Handling |
|---|---|
| Password storage | bcrypt, 12 rounds |
| Password exposure | `select: false` + `toJSON`/`toObject` strip |
| Token revocation | user re-read from the database on every request |
| Privilege escalation | `/users/me` accepts only name and interests; unknown fields rejected outright |
| Brute force | 100 req/min globally, 10/min on login and register |
| Account enumeration | an unknown email still runs a bcrypt comparison, so timing matches a wrong password |
| Registration race | the unique index decides, not a read-then-write check → `409` |
| Admin lockout | an admin cannot delete or demote themselves |
| Headers | `helmet` |
| CORS | explicit allow-list from `FRONTEND_URL`, plus Vercel preview URLs |
| Input | `whitelist` + `forbidNonWhitelisted` + per-field length caps |
| Error leakage | one exception filter; internals logged server-side, never returned |
| Boot safety | missing `MONGODB_URI`/`JWT_SECRET`, or a short secret, fails at startup with a clear message |

---

## Tests

```bash
npm test                                       # 34 unit tests, no database
npm run smoke                                  # 41 end-to-end checks
API=https://your-api.onrender.com npm run smoke  # …or against the deployment
```

**Unit tests** (`*.spec.ts`, alongside the code) cover role-guard decisions,
notes ownership scoping for both roles, login (hash never returned, unknown
email rejected, timing parity), env validation, and pagination maths.

**[`scripts/smoke.sh`](scripts/smoke.sh)** walks the whole contract against a
running server: RBAC for both roles, ownership isolation, hash-leak checks on
every user-shaped response, pagination bounds, both aggregations, the admin
safety rails, and token revocation after a delete.

---

## Project layout

```
src/
  main.ts                  helmet, CORS, Swagger, global pipes/filters
  app.module.ts            config, Mongoose, throttler, global guards
  app.controller.ts        service index + health check
  config/env.validation.ts fail fast on bad configuration
  common/
    decorators/            @Public, @Roles, @CurrentUser
    guards/                JwtAuthGuard, RolesGuard
    dto/                   pagination + $facet helpers
    filters/               database errors → HTTP
    interceptors/          { data } response envelope
    pipes/                 ObjectId validation
  modules/
    auth/                  register, login, /me, JWT + local strategies
    users/                 admin CRUD, self-service profile, Scenario 1
    notes/                 ownership-scoped CRUD
    posts/                 public posts, Scenario 2
  seed.ts                  sample data + syncIndexes()
scripts/smoke.sh           end-to-end contract checks
```

---

## Deployment

**Render** — [`render.yaml`](render.yaml) is committed; this repository is the
service root. Set in the dashboard:

| Variable | Value |
|---|---|
| `MONGODB_URI` | your Atlas connection string |
| `FRONTEND_URL` | the deployed frontend origin, comma-separated for several |
| `JWT_SECRET` | generated by Render |

Atlas **Network Access** must allow `0.0.0.0/0` — Render's free tier has no
static outbound IP, and anything narrower fails the TLS handshake with
`SSL alert number 80`.

The service binds `0.0.0.0` on `$PORT` and exposes `/api/health` as its health
check.
