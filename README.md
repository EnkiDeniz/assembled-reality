# Assembled Reality

Assembled Reality is a Next.js App Router application for a multi-user reading instrument.

## Current stack

- Next.js App Router
- NextAuth with Apple sign-in and Resend-powered email magic links
- Prisma
- Supabase-hosted Postgres target via `DATABASE_URL`
- server-backed reader state for bookmarks, highlights, notes, and progress
- GetReceipts delegated integration scaffolding

## Reader capabilities in this version

- open sign-in flow on `/` with Apple and email magic links
- continuous long-form reader powered by the markdown document in [content/assembled_reality_v07_final.md](/Users/denizsengun/Projects/AR/content/assembled_reality_v07_final.md)
- per-user bookmarks, highlights, notes, and progress via database APIs
- in-reader account menu with account, settings, and logout affordances
- account surface for reader identity and GetReceipts connection status
- receipt-draft payload generation from reading context

## Important routes

- `/` sign-in
- `/read` authenticated reader app
- `/account` reader account and GetReceipts connection state
- `/api/reader/marks`
- `/api/reader/progress`
- `/api/reader/receipts/from-reading`

## Environment

Minimum local env for meaningful development:

- `NEXTAUTH_SECRET`
- `DATABASE_URL`
- `DIRECT_DATABASE_URL`

Recommended auth env:

- `NEXTAUTH_URL`
- `NEXT_PUBLIC_SITE_URL`
- `NEXTAUTH_EMAIL_FROM`
- `RESEND_API_KEY`
- `APPLE_WEB_CLIENT_ID`
- `APPLE_KEY_ID`
- `APPLE_TEAM_ID`
- `APPLE_PRIVATE_KEY`

Optional GetReceipts integration env:

- `GETRECEIPTS_BASE_URL`
- `GETRECEIPTS_APP_SLUG`
- `GETRECEIPTS_CLIENT_SECRET`
- `GETRECEIPTS_REDIRECT_URI`
- `INTEGRATIONS_STATE_SECRET`
- `INTEGRATIONS_TOKEN_KEY`

Optional Seven audio guide env:

- `OPENAI_API_KEY`
- `OPENAI_API_KEY_PROD`
- `OPENAI_API_KEY_PREVIEW`
- `OPENAI_SEVEN_MODEL`
- `OPENAI_SEVEN_SPEECH_MODEL`
- `OPENAI_SEVEN_VOICE`
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_VOICE_ID`
- `ELEVENLABS_MODEL_ID`
- `ELEVENLABS_OUTPUT_FORMAT`

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

When the database credentials are configured, the next setup step is to apply the Prisma migration for the reader tables or run a schema push in local development.
