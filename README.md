# BoomBox 🎧

**A real-time social music app — listen together, build collaborative playlists, and broadcast your own radio.** Share what you're playing live, see friends' activity in real time, discover music, and host synced listening sessions.

> **Status:** working prototype — full source and test suite are here. Not publicly deployed;
> run it locally with the instructions below.
> _Built by Brian Mathew · [github.com/bmath8](https://github.com/bmath8)_


---

## What it does
- **Live listening & radio** — broadcast a session and keep listeners in sync, with client-side latency compensation.
- **Collaborative playlists** — drag-and-drop, multi-user, real-time updates.
- **Spotify integration** — pulls track data and syncs playback state.
- **Discovery & social** — friends, listening activity feeds, badges, challenges, song requests.
- **Real-time everything** — WebSocket layer with presence, heartbeats, and live counts.

## Tech highlights (why it's interesting)
- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind 4, Radix UI, Framer Motion, TanStack Query, Zustand, Zod. Tested with Jest + React Testing Library; Sentry + Vercel Analytics wired in.
- **Real-time backend:** Node WebSocket server with Redis Pub/Sub, so more than one server process can share a room. Heartbeat/ping-pong monitoring, message compression, and rate limiting.
- **Data:** PostgreSQL via **Supabase** with Row-Level Security, table partitioning for high-volume activity, GIN/BRIN indexes, materialized views for analytics, and PgBouncer connection pooling.
- **Operations pieces, built for the prototype:** Docker Compose stack, Prometheus metrics, health-check endpoints, a backup script, caching, idempotency keys, API-key rotation, and CI.

It has run on my own machine only: not in production, and not under real load. The aim was to build the parts a real-time product needs (sync, caching, observability, security) and test them locally.

## Architecture (high level)
```
Next.js frontend ──► Supabase (Postgres + RLS + Auth)
       │
       └──► WebSocket server (Node) ──► Redis Pub/Sub (rooms shared across processes)
                                   └──► Spotify API (cached wrapper)
Observability: Sentry · Prometheus · health checks · backup script
```

## Run it locally
```bash
# Frontend
cd frontend
cp ../.env.example .env.local   # add Supabase + Spotify keys
npm install
npm run dev                     # http://localhost:3000

# Full stack (optional)
docker-compose up -d            # postgres, redis, websocket, frontend
```

## Deploying it yourself (Vercel, frontend only)
1. Import this repo into **Vercel**, root = `frontend`.
2. Set env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, Spotify client keys.
3. Provision a free **Supabase** project; run the SQL in `database/` (`schema.sql` + migrations).
4. Deploy.

## Status
A working prototype that runs locally. The core social, playback and real-time features are built, with tests in Jest and React Testing Library. It has not been deployed publicly or load-tested. Notes written during development are in [`docs/notes/`](docs/notes/).

---
_Stack: Next.js · React · TypeScript · Tailwind · Supabase/Postgres · Redis · WebSockets · Spotify API · Docker_

---

_This is a public showcase mirror of a private repository. It contains the full source and
test suite; day-to-day operational notes and machine state are kept in the private original._
