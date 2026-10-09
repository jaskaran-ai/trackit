# TrackIt — Bug & Feature Request Tracker

A full-stack Next.js 16 app to track bug reports and feature requests. Built with Better Auth (Google OAuth), PostgreSQL (Supabase), Drizzle ORM, Tiptap, and Tailwind CSS.

---

## Design system

The interface is built on [Arc](https://uiarc.dev), installed into
`src/components/arc/` by the shadcn CLI and driven by `components.json`.
`components/arc/foundation.css` is the single source of colour, type, radius, and
motion tokens, and is imported once in the root layout.

**Accent colour.** Arc ships eight accents, keyed off `data-accent` on `<html>`:
`neutral`, `violet`, `blue`, `green`, `amber`, `orange`, `coral`, `rose`. The
picker in Settings writes that attribute, and the choice is saved per user.

**Theme.** Arc reads `data-theme` on `<html>` for `light` and `dark`. TrackIt
also keeps the `light` / `dark` class on the same element, because the Tailwind
`light:` variant and the legacy zinc ramp in `globals.css` read the class. The
two attributes are written together in `ThemeProvider` and in the inline script
in `app/layout.tsx`, so they cannot drift apart.

**The indigo bridge.** `globals.css` derives `--color-indigo-300` through
`--color-indigo-700` from Arc's `--accent` and `--accent-strong`, with an
`@theme inline` block that exposes the rest of Arc's tokens as Tailwind
utilities. That is what keeps a `bg-indigo-500` element the exact same colour as
an Arc button beside it. As components move onto Arc, their indigo utilities go
with them and the bridge shrinks.

**Adding a component.**

```bash
npx shadcn@latest add @uiarc/<id>
```

List the ids at [uiarc.dev/llms.txt](https://uiarc.dev/llms.txt). Pro items
install from `@uiarc-pro/<id>` and need `ARC_PRO_TOKEN` in the environment. Do
not edit files under `src/components/arc/`: re-run the installer instead.

---

## Features

**Submissions.** Report bugs or request features with a title, rich-text description, priority, project, due date, and drag-and-drop attachments. Titles are checked against existing submissions for likely duplicates before you submit.

**Discussion.** Every submission has a comment thread and an audit timeline showing who changed the status or priority and when. Feature requests can be upvoted.

**Notifications.** In-app notification bell with an unread count and a full inbox page at `/notifications`. Owners are pinged when an admin changes a submission or replies to the discussion.

**User surfaces.** Personal dashboard with search, status/type/priority/project filters, and sorting. Attachment viewer with keyboard navigation. Settings page at `/settings` with a light/dark/system theme toggle and notification preferences.

**Admin surfaces.** Admin dashboard with stat cards and charts (30-day created vs resolved, per-project breakdown, average resolution time), a paginated table with bulk actions, a drag-and-drop Kanban board, aging badges and due dates, saved filter views, user role management, CSV export, and an archive page for soft-deleted submissions.

**Roles.** `admin` and `user`, assigned on first sign-in from `ADMIN_EMAILS`, or changed later from the admin panel.

---

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) |
| Auth | Better Auth v1 + Google OAuth + Admin plugin |
| Database | PostgreSQL via Supabase |
| ORM | Drizzle ORM |
| Rich text | Tiptap 3 |
| File uploads | Local disk (`public/uploads`) or UploadThing |
| UI | [Arc](https://uiarc.dev) component library + Tailwind CSS v4 |
| Data | oRPC procedures + TanStack Query |
| Fonts | Geist (display) + Inter (body) |

---

## Setup

### 1. Clone and install

```bash
git clone <repo>
cd trackit
npm install
```

### 2. Create environment file

```bash
cp .env.example .env
```

Fill in all values:

```env
# Supabase — transaction pooler (app runtime)
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"
# Supabase — direct (migrations / prisma db push)
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?sslmode=require"

# Generate with: openssl rand -base64 32
BETTER_AUTH_SECRET="your-secret-here"
BETTER_AUTH_URL="http://localhost:3000"

# From Google Cloud Console → APIs & Services → Credentials
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxx"

# Comma-separated — these get admin role on first login
ADMIN_EMAILS="you@yourcompany.com"
```

### 3. Set up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project → **APIs & Services → Credentials**
3. Create **OAuth 2.0 Client ID** (Web application)
4. Add Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (dev)
   - `https://yourdomain.com/api/auth/callback/google` (prod)
5. Copy Client ID and Secret into `.env`

### 4. Push database schema

```bash
# Push Drizzle schema to Supabase (creates/updates tables)
pnpm run db:push
```

> Better Auth manages auth tables (`user`, `session`, `account`, `verification`) via the Drizzle adapter.

### 5. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## First login

1. Sign in with Google using the email listed in `ADMIN_EMAILS`
2. You'll be auto-promoted to admin on first login
3. Regular users who sign in get the `user` role

---

## File structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...all]/     # Better Auth handler
│   │   ├── submissions/       # GET list, POST create
│   │   ├── submissions/[id]/  # GET, PATCH, DELETE
│   │   ├── upload/            # File upload to local disk
│   │   └── admin/stats/       # Admin stats endpoint
│   ├── auth/signin/           # Google sign-in page
│   ├── dashboard/             # User's own submissions
│   ├── submit/                # New submission form
│   ├── submission/[id]/       # User submission detail
│   ├── notifications/         # Inbox
│   ├── settings/              # Profile + preferences
│   └── admin/
│       ├── page.tsx           # Admin dashboard, charts, user roles
│       ├── archived/          # Soft-deleted submissions
│       └── submission/[id]/   # Admin detail + controls
├── components/
│   ├── admin/                 # AgingBadge, BulkActions, SavedViews,
│   │                           # StatsCharts, UserManagement, ArchivedList
│   ├── layout/                # NotificationBell, NotificationList
│   ├── dashboard/             # DashboardFilters
│   ├── submission/            # CommentsSection, StatusHistory, AttachmentList
│   ├── theme/                 # ThemeProvider, ThemeToggle
│   └── shared/
│       ├── Navbar.tsx
│       ├── Badges.tsx         # Status, Type, Priority, Project badges
│       ├── VoteButton.tsx
│       ├── AttachmentLightbox.tsx
│       ├── RichTextEditor.tsx # Tiptap editor
│       ├── FileUploadZone.tsx # Dropzone upload
│       └── SubmissionCard.tsx
├── db/                         # Drizzle schema + per-domain query modules
└── types/
```

> **Commands:** `pnpm dev`, `pnpm build`, `pnpm typecheck`, `pnpm db:push`.
> `pnpm lint` currently fails because `typescript-eslint` does not support the TypeScript 7 this project pins. Use `pnpm typecheck` until that dependency is bumped.

> **Toasts.** `react-hot-toast` is still wired up for background-work feedback.
> Several call sites treat it as the only confirmation of a foreground action,
> which is the one thing Arc's rules disallow: the rows that changed should
> confirm in place instead. Converting those is a behavioural pass over about
> fourteen files and is not done.

---

## Deployment to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add DATABASE_URL
vercel env add DIRECT_URL
vercel env add BETTER_AUTH_SECRET
vercel env add BETTER_AUTH_URL        # set to https://yourdomain.com
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add ADMIN_EMAILS
```

> **Note on file uploads:** Local disk storage doesn't persist on Vercel (ephemeral filesystem). For production, swap `src/app/api/upload/route.ts` to use AWS S3 presigned uploads. The attachment data model is already S3-ready (stores `fileUrl` strings).

---

## Swapping local uploads → AWS S3

1. Add `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner`
2. Replace `writeFile` in `api/upload/route.ts` with:
```typescript
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({ region: process.env.AWS_REGION });
await s3.send(new PutObjectCommand({
  Bucket: process.env.S3_BUCKET,
  Key: `uploads/${uniqueName}`,
  Body: buffer,
  ContentType: file.type,
}));
const fileUrl = `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/uploads/${uniqueName}`;
```
3. Add `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET` to `.env`
