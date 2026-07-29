# Boombox 🎧

**A real-time social music app — listen together, build collaborative playlists, and broadcast your own radio.** Share what you're playing live, see friends' activity in real time, discover music, and host synced listening sessions.

> **🔴 Live demo:** https://boom-box-v-5-git-main-bmath8s-projects.vercel.app
> **Demo login:** `demo@boombox.app` · `BoomBoxDemo2026` (pre-seeded account with a live radio station + collaborative playlist)
> _Built by Brian Mathew · [github.com/bmath8](https://github.com/bmath8)_


---

## What it does
- **Live listening & radio** — broadcast a session and keep listeners in sync to within ~500ms (client-side latency compensation).
- **Collaborative playlists** — drag-and-drop, multi-user, real-time updates.
- **Spotify integration** — pulls track data and syncs playback state.
- **Discovery & social** — friends, listening activity feeds, badges, challenges, song requests.
- **Real-time everything** — WebSocket layer with presence, heartbeats, and live counts.

## Tech highlights (why it's interesting)
- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind 4, Radix UI, Framer Motion, TanStack Query, Zustand, Zod. Tested with Jest + React Testing Library; Sentry + Vercel Analytics wired in.
- **Real-time backend:** Node WebSocket server with **Redis Pub/Sub for horizontal scaling**, heartbeat/ping-pong monitoring, message compression, and rate limiting.
- **Data:** PostgreSQL via **Supabase** with Row-Level Security, table partitioning for high-volume activity, GIN/BRIN indexes, materialized views for analytics, and PgBouncer connection pooling.
- **Production-grade:** Docker Compose stack, Prometheus metrics, health-check endpoints, automated backups, multi-tier caching, idempotency keys, API-key rotation, and CI/CD.

This isn't a tutorial app — it's architected like a product that has to scale: real-time sync, caching, observability, and security were first-class concerns.

## Architecture (high level)
```
Next.js frontend ──► Supabase (Postgres + RLS + Auth)
       │
       └──► WebSocket server (Node) ──► Redis Pub/Sub (scale-out)
                                   └──► Spotify API (cached wrapper)
Observability: Sentry · Prometheus · health checks · automated backups
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

## Deploy (Vercel — the frontend)
1. Import this repo into **Vercel**, root = `frontend`.
2. Set env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, Spotify client keys.
3. Provision a free **Supabase** project; run the SQL in `database/` (`schema.sql` + migrations).
4. Deploy → paste the URL at the top of this README.

## Status
Feature-rich and production-architected (see the `database/` schema and the implementation-summary docs). Core social + playback + real-time features are built out. _Detailed engineering notes live in the repo's setup/architecture docs._

---
_Stack: Next.js · React · TypeScript · Tailwind · Supabase/Postgres · Redis · WebSockets · Spotify API · Docker_

---

_This is a public showcase mirror of a private repository. It contains the full source and
test suite; day-to-day operational notes and machine state are kept in the private original._
