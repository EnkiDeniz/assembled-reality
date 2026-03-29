# Assembled Reality

**The founding document of Lakin.ai** — an interactive, collaborative reader for the text that defines how Lakin coordinates intelligence.

## What is this?

Assembled Reality is Lakin.ai's core philosophy and protocol specification, presented as a web-based document with built-in collaboration tools. It articulates the company's founding claim:

> *The universal failure mode of coordinating intelligences is coherence without contact.*

The document spans 20 sections across three parts:

1. **The Claim** — The friction, foundational statement, first principles, and the problem of accumulation without contact.
2. **The Protocol** — The membrane, the seven-move space, the ledger, the alignment game, geometry of the seal, and the pre-seal audit.
3. **Instruments & Open Edges** — The four instruments (GetReceipts, Box7, PromiseMe, The Signet), builder implications, and open questions.

## Features

- **Passphrase gate** — Access requires knowing the passphrase, keeping the document within the intended audience.
- **Reader identity** — Each reader selects their name on arrival, tying all interactions to a person.
- **Shape signals** — Every section can be marked with three shapes:
  - **Triangle** (strengthens aim)
  - **Square** (needs evidence)
  - **Circle** (needs context)
- **Annotations** — Threaded comments per section for thoughts, questions, and pushback.
- **Pulse panel** — A live sidebar showing who's reading and recent annotation activity.
- **Navigation sidebar** — Section index with signal and annotation counts at a glance.

## Tech stack

- **React** + **Vite**
- Inline styles (no CSS framework)
- Google Fonts: Cormorant Garamond, DM Sans, JetBrains Mono
- **localStorage** for persistence (signals, annotations, reader identity)
- Deployed on **Vercel**

## Getting started

```bash
npm install
npm run dev
```

## Build & deploy

```bash
npm run build     # outputs to dist/
vercel --prod     # deploy to Vercel
```

## Note on persistence

All data (annotations, shape signals, reader selection) is stored in the browser's localStorage. This means:

- Data persists across sessions on the same browser.
- Data does **not** sync between different browsers or devices.
- For shared real-time collaboration, a backend (e.g. Vercel KV, Supabase, Firebase) would need to be added.

## Company

**Lakin.ai** — Products: GetReceipts, Box7, PromiseMe, The Signet

*Reality doesn't appear. It's assembled.*
