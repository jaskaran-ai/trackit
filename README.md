# TrackIt — Bug & Feature Request Tracker

A full-stack Next.js 15 app to track bug reports and feature requests. Built with Better Auth (Google OAuth), PostgreSQL (Neon), Prisma, Tiptap, and Tailwind CSS.

---

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) |
| Auth | Better Auth v1 + Google OAuth + Admin plugin |
| Database | PostgreSQL via Neon |
| ORM | Prisma 6 |
| Rich text | Tiptap 2 |
| File uploads | Local disk (`public/uploads`) |
| Styling | Tailwind CSS v3 + custom design system |
| Fonts | Syne (display) + DM Sans (body) |

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
# Neon PostgreSQL connection string
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/trackit?sslmode=require"

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
# Generate Prisma client
npm run db:generate

# Push schema to Neon (creates all tables)
npm run db:push
```

> Better Auth automatically manages its own tables (`user`, `session`, `account`, `verification`) via Prisma.

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
│   └── admin/
│       ├── page.tsx           # Admin dashboard + table
│       └── submission/[id]/   # Admin detail + controls
├── components/
│   └── shared/
│       ├── Navbar.tsx
│       ├── Badges.tsx         # Status, Type, Priority badges
│       ├── RichTextEditor.tsx # Tiptap editor
│       ├── FileUploadZone.tsx # Dropzone upload
│       └── SubmissionCard.tsx
├── lib/
│   ├── auth.ts                # Better Auth server config
│   ├── auth-client.ts         # Better Auth client
│   ├── prisma.ts              # Prisma singleton
│   └── utils.ts               # Helpers + constants
└── types/index.ts
```

---

## Deployment to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add DATABASE_URL
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
