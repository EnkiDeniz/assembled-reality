# Assembled Reality

Assembled Reality is now a Next.js App Router application for a private multi-user reading instrument.

## Current stack

- Next.js App Router
- NextAuth with a bootstrap credentials flow
- Prisma
- Supabase-hosted Postgres target via `DATABASE_URL`
- server-backed reader state for bookmarks, highlights, notes, and progress
- GetReceipts delegated integration scaffolding

## Reader capabilities in this version

- authenticated entry flow
- ceremonial unlock screen after sign-in
- continuous long-form reader powered by the markdown document in [content/assembled_reality_v07_final.md](/Users/denizsengun/Projects/AR/content/assembled_reality_v07_final.md)
- per-user bookmarks, highlights, notes, and progress via database APIs
- account surface for reader identity and GetReceipts connection status
- receipt-draft payload generation from reading context

## Important routes

- `/` entry and sign-in
- `/read` authenticated reader
- `/account` reader account and GetReceipts connection state
- `/api/reader/marks`
- `/api/reader/progress`
- `/api/reader/aggregate`
- `/api/reader/receipts/from-reading`

## Environment

Minimum local env for meaningful development:

- `NEXTAUTH_SECRET`
- `DATABASE_URL`
- `DIRECT_DATABASE_URL`

Recommended auth/invite env:

- `READER_BOOTSTRAP_CODE`
- `READER_INVITED_EMAILS`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_SITE_URL`

Optional GetReceipts integration env:

- `GETRECEIPTS_BASE_URL`
- `GETRECEIPTS_APP_SLUG`
- `GETRECEIPTS_CLIENT_SECRET`
- `GETRECEIPTS_REDIRECT_URI`
- `INTEGRATIONS_STATE_SECRET`
- `INTEGRATIONS_TOKEN_KEY`

## Local development

```bash
npm install
npm run dev
```

## Build and lint

```bash
npm run build
npm run lint
```

## Database

Generate the Prisma client:

```bash
npx prisma generate
```

When the database credentials are configured, the next setup step is to run a Prisma migration or schema push for the new reader tables.
