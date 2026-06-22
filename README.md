# Notepad++ Themed Todo App

Full-stack todo app styled to look like **Notepad++**. Each user gets a public profile at `/u/:username`; visitors can read another user's todos and **Copy to my list** to clone any item into their own.

## Stack

- **Frontend:** Vue 3 (Composition API) + Vue Router + Vite
- **Backend:** Node.js + Express
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Auth:** Custom (bcrypt-hashed passwords + JWT bearer tokens)

## Project layout

```
todo/
├── backend/
│   ├── prisma/schema.prisma      # Profile + Todo models
│   ├── src/
│   │   ├── middleware/auth.js    # JWT verify → req.user
│   │   ├── routes/auth.js        # /api/auth/{signup,login,logout}
│   │   ├── routes/todos.js       # /api/todos (CRUD + clone)
│   │   ├── routes/users.js       # /api/users/:username/todos
│   │   └── prisma.js             # PrismaClient + serializer
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── assets/notepad.css
    │   ├── components/{MenuBar,TabBar,StatusBar,TodoItem}.vue
    │   ├── views/{AuthView,DashboardView,PublicProfileView}.vue
    │   ├── router/index.js
    │   ├── stores/auth.js
    │   ├── lib/api.js
    │   ├── App.vue
    │   └── main.js
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## 1. Database

Any Postgres works (local install, Docker, Neon, Supabase Postgres, Railway, etc.).

### Option A — Supabase Postgres (recommended)

From **Dashboard → Project Settings → Database** copy the two connection strings:

```
DATABASE_URL = transaction-mode pooler (port 6543, pgbouncer=true)  ← app queries
DIRECT_URL   = session-mode pooler     (port 5432)                  ← migrations
```

The `directUrl` block in `prisma/schema.prisma` makes Prisma use the session-mode URL for `migrate`/`db push` (pgbouncer in transaction mode can't run DDL), and the pooled URL for normal runtime queries.

### Option B — Local Docker

```bash
docker run --name notepad-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16
```

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/notepad_todo?schema=public
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/notepad_todo?schema=public
```

## 2. Backend

```bash
cd backend
cp .env.example .env       # set DATABASE_URL + JWT_SECRET
npm install
npx prisma migrate dev --name init    # creates the tables
npm run dev                           # http://localhost:4000
```

Useful Prisma scripts:

| Command                  | Purpose                                 |
|--------------------------|-----------------------------------------|
| `npm run prisma:generate`| Regenerate Prisma Client                |
| `npm run prisma:migrate` | Create + apply a new migration (dev)    |
| `npm run prisma:deploy`  | Apply pending migrations (prod)         |
| `npm run prisma:studio`  | Open Prisma Studio data browser         |

Routes:

| Method | Path                              | Auth | Purpose                          |
|--------|-----------------------------------|------|----------------------------------|
| POST   | /api/auth/signup                  | no   | `{ email, password, username }`  |
| POST   | /api/auth/login                   | no   | `{ email, password }`            |
| POST   | /api/auth/logout                  | no   | client drops token (stateless)   |
| GET    | /api/todos                        | yes  | own todos                        |
| POST   | /api/todos                        | yes  | `{ title }`                      |
| PUT    | /api/todos/:id                    | yes  | `{ title?, is_completed? }`      |
| DELETE | /api/todos/:id                    | yes  | own only                         |
| POST   | /api/todos/:id/clone              | yes  | clones any todo into caller's    |
| GET    | /api/users/:username              | no   | profile lookup                   |
| GET    | /api/users/:username/todos        | no   | public list                      |

## 3. Frontend

```bash
cd frontend
npm install
npm run dev                # http://localhost:5173
```

`vite.config.js` proxies `/api/*` to the backend on port 4000.

## Authorization model

- **Passwords** are hashed with bcrypt (cost 10) before insert.
- **Sessions** are stateless JWTs (`HS256`, `sub` = profile id, 7-day TTL by default).
- Every mutation route uses `requireAuth` which decodes the token, looks up the profile, and attaches it to `req.user`.
- Mutations are scoped by `userId` directly inside the Prisma query (`updateMany({ where: { id, userId } })` etc.), so a request can only ever touch rows owned by the caller.
- `POST /api/todos/:id/clone` reads the source todo with no ownership filter (so any user's todo can be copied) but writes with `userId: req.user.id`, so the new row is always owned by the caller.

## Data model (Prisma)

```prisma
model Profile {
  id           String   @id @default(uuid()) @db.Uuid
  username     String   @unique
  email        String   @unique
  passwordHash String   @map("password_hash")
  createdAt    DateTime @default(now()) @map("created_at")
  todos        Todo[]
  @@map("profiles")
}

model Todo {
  id          String   @id @default(uuid()) @db.Uuid
  userId      String   @map("user_id") @db.Uuid
  title       String
  isCompleted Boolean  @default(false) @map("is_completed")
  createdAt   DateTime @default(now()) @map("created_at")
  user        Profile  @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@map("todos")
}
```

`@map` keeps the underlying column names in snake_case so SQL inspection stays readable.

## Deploy (Vercel × 2 + Supabase) — fully free

You'll create **two** Vercel projects from the same GitHub repo: one rooted at `backend/` (Serverless Function), one rooted at `frontend/` (static site). Supabase Postgres stays where it is.

### 0. Push to GitHub

```bash
cd C:\Users\fikre\Desktop\todo
git init
git add .
git commit -m "init"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

### 1. Backend → Vercel project #1

1. Vercel Dashboard → **Add New… → Project** → import the repo.
2. **Root Directory:** `backend`
3. **Framework Preset:** Other
4. **Environment Variables** (Production + Preview + Development):
   - `DATABASE_URL` — Supabase pooled URL (port 6543, `?pgbouncer=true`)
   - `DIRECT_URL` — Supabase session-mode URL (port 5432)
   - `JWT_SECRET` — long random string
   - `JWT_TTL` — `7d` (optional)
   - `CORS_ORIGIN` — your frontend URL (you'll fill this in after step 2 deploys; for now use `*`)
5. **Deploy**. The `buildCommand` from `vercel.json` runs `prisma generate && prisma migrate deploy` — this applies migrations against Supabase on every deploy.
6. Copy the deployed URL — e.g. `https://notepad-todo-api.vercel.app`.

### 2. Frontend → Vercel project #2

1. **Add New… → Project** → import the **same** repo.
2. **Root Directory:** `frontend`
3. **Framework Preset:** Vite (auto-detected)
4. **Environment Variable:**
   - `VITE_API_BASE` = `https://notepad-todo-api.vercel.app/api` (from step 1.6)
5. **Deploy**. Copy the frontend URL — e.g. `https://notepad-todo.vercel.app`.

### 3. Lock down CORS

Go back to **backend project → Settings → Environment Variables**, update `CORS_ORIGIN` to the exact frontend URL (e.g. `https://notepad-todo.vercel.app`), then **Redeploy**. Multiple origins? Comma-separate them.

### 4. Smoke test

- Visit the frontend URL → sign up.
- Visit `https://<backend-url>/api/health` → should return `{"ok":true}`.
- Create todos, copy your public URL, open it in incognito → read-only mode with hashed display name.

### Cost & limits (Hobby tier)

| Resource         | Limit            | Notes |
|------------------|------------------|-------|
| Vercel Functions | 100 GB-hrs / mo  | More than enough for hobby/demo |
| Vercel Bandwidth | 100 GB / mo      | Static frontend uses very little |
| Vercel Builds    | unlimited        | |
| Supabase DB      | 500 MB           | Tens of thousands of todos fit |
| Cold start       | ~500ms–1.5s      | First request after idle; warm requests <200ms |

Everything stays on $0 unless you blow past those limits.
