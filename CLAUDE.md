@AGENTS.md

# Lazy Agent — Codebase Guide

## Project Overview

**Lazy Agent** is an AI-powered productivity assistant built as a portfolio project. It provides a streaming chat interface backed by Claude, with quick-action templates for common tasks (drafting emails, summarizing, brainstorming, etc.). A secondary API endpoint generates hotel guest recovery emails using adaptive thinking.

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.2 |
| UI | React | 19.2.4 |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| AI | Anthropic SDK | 0.81.0 |
| Linting | ESLint (flat config) | 9.x |

> **CRITICAL**: Next.js 16 has breaking changes versus earlier versions. Before writing any Next.js-specific code, read `node_modules/next/dist/docs/`. Do not rely on training-data knowledge of Next.js APIs.

## Directory Structure

```
hayslip-portfolio/
├── src/
│   └── app/
│       ├── layout.tsx          # Root layout, metadata
│       ├── page.tsx            # Main chat UI (client component)
│       ├── globals.css         # Tailwind import + CSS variables
│       └── api/
│           ├── chat/
│           │   └── route.ts    # Streaming chat endpoint
│           └── generate-email/
│               └── route.ts    # Hotel email generation endpoint
├── public/                     # Static SVG assets
├── next.config.ts              # Next.js config (minimal)
├── tsconfig.json               # TypeScript config
├── eslint.config.mjs           # ESLint flat config
├── postcss.config.mjs          # PostCSS (Tailwind 4)
├── AGENTS.md                   # Next.js breaking-changes warning
└── CLAUDE.md                   # This file
```

## Development Workflow

### Required Environment Variables

Create `.env.local` (never commit it):

```
ANTHROPIC_API_KEY=your_key_here
```

The Anthropic client (`new Anthropic()`) reads this automatically. Both API routes will fail at runtime without it.

### Scripts

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

### No Test Suite

There is no test framework configured. No Jest, Vitest, or test files exist. Do not assume tests exist when diagnosing issues.

### No CI/CD

No GitHub Actions or deployment pipelines are configured. The project is Vercel-ready (no extra config needed), but deployment is manual.

## Key Conventions

### Path Aliases

`@/*` maps to `./src/*`. Use `@/app/...` for imports rather than relative paths.

### Component Boundaries

- `src/app/page.tsx` is a **client component** (`"use client"`). All interactive state, refs, and streaming logic lives here.
- `src/app/layout.tsx` is a **server component** (no directive). Keep it that way.
- API routes in `src/app/api/` are **server-only**; do not import client-only APIs there.

### Styling

Tailwind CSS 4 is used via `@import "tailwindcss"` in `globals.css` (not `@tailwind base/components/utilities` — that's Tailwind 3 syntax). The design uses a **stone** color palette (stone-50 through stone-900). Dark mode is handled via `prefers-color-scheme` CSS media query in `globals.css`.

### TypeScript

- Strict mode is enabled.
- `tsconfig.json` uses `"moduleResolution": "bundler"` — not `"node"`.
- Target is ES2017.

### ESLint

Flat config format (`eslint.config.mjs`). Ignored paths: `.next/`, `out/`, `build/`, `next-env.d.ts`. Run with `npm run lint`.

## API Routes

### `POST /api/chat`

Streaming chat endpoint. Accepts `{ messages: Array<{ role: "user"|"assistant", content: string }> }`. Returns a `text/plain` stream. Uses `claude-opus-4-6` with `max_tokens: 2048`. The system prompt instructs the model to produce complete, ready-to-use output immediately without explanation.

Streaming pattern: `ReadableStream` → `client.messages.stream()` → forward `content_block_delta` / `text_delta` events as raw bytes.

### `POST /api/generate-email`

Non-streaming endpoint for hotel guest recovery emails. Accepts `{ guestName, guestRoom?, issueDescription, resolutionTaken, compensation }`. Returns `{ email: string }`. Uses `claude-opus-4-6` with `thinking: { type: "adaptive" }` and `max_tokens: 1024`. Filters response content to text blocks only.

## Anthropic SDK Usage

Both routes instantiate `new Anthropic()` at module scope (reads `ANTHROPIC_API_KEY` from environment). The chat route uses `client.messages.stream()` for streaming; the email route uses `client.messages.create()` for a standard request. Model used throughout: `"claude-opus-4-6"`.

When upgrading the SDK or changing models, update both route files.

## Active Branches

- `claude/add-claude-documentation-4BU8x` — current documentation branch
- `claude/hotel-guest-email-generator-AsExQ` — hotel email feature branch
