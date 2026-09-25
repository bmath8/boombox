# Project Brief — Boombox

## Project
A real-time social music app: synced radio/listening sessions, collaborative playlists, broadcasting, discovery, and Spotify integration.

## Product goal
Let people listen together in sync, build playlists collaboratively, and broadcast their own station — architected to scale. (Strongest full-stack portfolio piece.)

## Tech stack
- Frontend: Next.js 16, React 19, TypeScript, Tailwind 4, Radix UI, Framer Motion, TanStack Query, Zustand, Zod; Jest tests; Sentry
- Backend: Node WebSocket server with Redis Pub/Sub (scale-out), heartbeat monitoring, rate limiting
- Database: Supabase (Postgres) with RLS, partitioning, GIN/BRIN indexes, materialized views, PgBouncer
- Infra: Docker Compose, Prometheus, health checks, automated backups, CI/CD; Spotify API (cached)

## Key architectural decisions
- Redis Pub/Sub for horizontal WebSocket scaling; ~500ms client-side sync compensation.
- RLS-first security; multi-tier caching; idempotency keys.

## Constraints
- Needs Supabase project + Spotify API keys + env vars to run.

## Definition of done
- Frontend deployed (Vercel) against a live Supabase backend; README + screenshots; live demo link.
