# Assembled Reality

This repository has been reset to a clean Vite + React + Vercel scaffold.

## What remains

- Vite build setup
- React app entrypoint
- Tailwind v4 import path in [src/index.css](/Users/denizsengun/Projects/AR/src/index.css)
- Vercel SPA rewrite config in [vercel.json](/Users/denizsengun/Projects/AR/vercel.json)
- Existing project linkage in `.vercel/` for local Vercel workflows
- ESLint configuration

## Current app

The live app is now a minimal placeholder in [src/App.jsx](/Users/denizsengun/Projects/AR/src/App.jsx). Product-specific components, hooks, utilities, and legacy experiments were removed so the next version can be rebuilt from a clean base.

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run lint
```

## Deploy

If the project is already linked to Vercel, a push to the connected branch should redeploy automatically. Otherwise:

```bash
vercel
vercel --prod
```
