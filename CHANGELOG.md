# Changelog

## 2026-10-06 (Better Auth + Drizzle)

### Better Auth 1.7.7

- Regenerated expected Drizzle auth schema via `auth@1.7.7 generate` (`pnpm auth:schema`).
- Updated `src/db/schema.ts` auth tables: admin fields, `$onUpdate` on `updatedAt`, session/account/verification indexes, stricter `verification` timestamps.
- `drizzleAdapter` now receives full `schema` (required for joins in 1.7.x).
- Pushed indexes/constraints to Supabase (`session_userId_idx`, `account_userId_idx`, `verification_identifier_idx`, unique email/token).
- Kept **camelCase** DB column names to match the existing Prisma-created Supabase schema (CLI defaults to snake_case for greenfield).

## 2026-10-06

### Database

- Switched from Neon to **Supabase PostgreSQL** (project `trackit`, `ap-southeast-2`).
- Added `DIRECT_URL` for Prisma CLI; app runtime continues to use pooled `DATABASE_URL` via `src/lib/prisma.ts`.
- `prisma.config.ts` reads `DIRECT_URL` for `db push` / migrate / studio.
- Pushed Prisma schema to Supabase successfully.

### Dependencies

- Bumped all dependencies to latest compatible versions (see `package.json` / lockfile).
- Kept **Prisma CLI at 7.10.x** (matches `@prisma/client`); Prisma 8 RC breaks `prisma generate`.
- Added `esbuild` to `pnpm-workspace.yaml` `allowBuilds`.

### Docs

- Updated `README.md` and `.env.example` for Supabase connection strings.
