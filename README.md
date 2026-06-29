# Inhabit (Next.js + Apollo + Postgres)

Cross-device version of the habit dashboard: a full-screen reminder/pomodoro display backed by a real database, so reminders you create on your work computer show up on your personal one too. Protected by Google sign-in, locked to a single allowed email.

## Stack

Next.js 14 (App Router) · Apollo Server + Apollo Client (GraphQL API at `/api/graphql`) · Prisma + Postgres · NextAuth.js (Google OAuth) · Vercel Blob (image uploads)

## 1. Local setup

```bash
npm install
cp .env.example .env
```

Fill in `.env` (see section 3 for where each value comes from), then:

```bash
npx prisma db push      # creates tables from prisma/schema.prisma
npm run prisma:seed     # adds 5 starter reminders + 2 work blocks
npm run dev
```

Open `http://localhost:3000`. You'll be sent to Google sign-in first.

## 2. Deploying to Vercel

1. Push this folder to a GitHub repo, then [import it on Vercel](https://vercel.com/new).
2. In the Vercel project, go to **Storage → Create Database → Postgres**, attach it. Vercel sets `DATABASE_URL` (and a few related vars) automatically.
3. Go to **Storage → Create → Blob**, attach a store. Vercel sets `BLOB_READ_WRITE_TOKEN` automatically.
4. Add the remaining env vars under **Settings → Environment Variables**: `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (your production URL, e.g. `https://inhabit.vercel.app`), `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ALLOWED_EMAIL`.
5. Deploy. The build script (`prisma generate && next build`) generates the Prisma client automatically — no manual step needed on Vercel.
6. After the first deploy, run the schema push once against the production database:
   ```bash
   npx prisma db push   # with DATABASE_URL in your shell set to the Vercel Postgres URL
   npm run prisma:seed  # optional, adds starter reminders
   ```
   Easiest way: `vercel env pull .env.production.local` to grab the real `DATABASE_URL`, then run the two commands locally with that file loaded.

## 3. Google OAuth setup

1. [Google Cloud Console](https://console.cloud.google.com/) → create a project (or reuse one) → **APIs & Services → OAuth consent screen** → set it up for **External** users, add yourself as a test user if it stays in testing mode.
2. **APIs & Services → Credentials → Create Credentials → OAuth client ID** → Application type **Web application**.
3. Authorized redirect URI:
   - Local: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://<your-app>.vercel.app/api/auth/callback/google`
4. Copy the generated **Client ID** and **Client Secret** into `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
5. `ALLOWED_EMAIL` should be the Google account email you actually sign in with (`maxwellbenton@gmail.com`). Anyone else who tries to sign in will be rejected even though Google auth succeeds.

`NEXTAUTH_SECRET` — generate one with `openssl rand -base64 32`.

## 4. Using it day to day

Same feature set as the original static version: reminders with text/image/video that take over the screen and recede to a small badge, work blocks with pomodoro-style break takeovers, automatic theme/layout rotation to avoid burn-in, duplicate/skip-today on reminders. The difference is everything now lives in Postgres via GraphQL, so it's the same data from any signed-in browser.

Settings (takeover duration) and sign-out are in the gear icon in the top bar.

## Notes / known limitations

- **Scheduling runs in the browser tab**, not on a server — the dashboard needs to stay open (e.g. on your second monitor) to fire reminders. There's no server-side push/notification.
- **One-minute resolution**: reminders fire when the clock matches `HH:MM`, checked every 5 seconds.
- Video autoplay requires the video to be muted (browser policy) — already wired up for YouTube/Vimeo/direct file links.
- Image uploads go to Vercel Blob and are capped at 8MB.
- I could not run `npx prisma generate` in my sandbox while building this (its network access doesn't reach `binaries.prisma.sh`), so the Prisma-dependent files (`src/lib/prisma.ts`, `src/graphql/resolvers.ts`) are type-correct against the schema by inspection but weren't verified against a freshly generated client. Running `npx prisma generate` (or just `npm install` + `npm run dev`/`vercel build`) on your machine will generate it normally — if there's a mismatch you'd see it immediately as a TypeScript error pointing at the resolver file.

## Project structure

```
prisma/schema.prisma       Reminder / WorkBlock / AppSettings models
src/graphql/                schema.ts (typeDefs), resolvers.ts, queries.ts (client-side gql ops)
src/app/api/graphql/        Apollo Server route
src/app/api/upload/         Vercel Blob upload route
src/app/api/auth/           NextAuth route
src/components/             Dashboard, modals, MediaEmbed
src/lib/                    prisma client, auth options, time helpers, video embed parsing
```
