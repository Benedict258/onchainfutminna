# Blockchain Club FUTMinna

The official platform for FUTMinna's premier Web3 community — managing members, projects, events, and opportunities.

## Tech Stack

- **Framework:** TanStack Start (React + Vite)
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Database:** PostgreSQL (Supabase) + Prisma ORM
- **Auth:** JWT (access + refresh tokens) + bcryptjs
- **Email:** Resend
- **File Upload:** Supabase Storage
- **State:** Zustand + TanStack Query

## Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env   # fill in your values

# Push schema to database
npm run db:push

# Seed database
npm run db:seed

# Start dev server
npm run dev
```

## Environment Variables

| Variable                    | Description                  |
| --------------------------- | ---------------------------- |
| `DATABASE_URL`              | PostgreSQL connection string |
| `JWT_SECRET`                | Access token secret          |
| `JWT_REFRESH_SECRET`        | Refresh token secret         |
| `SUPABASE_URL`              | Supabase project URL         |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key    |
| `RESEND_API_KEY`            | Resend API key               |
| `RESEND_FROM_EMAIL`         | Sender email address         |
| `SITE_URL`                  | Canonical site URL           |

## Available Scripts

| Command               | Description              |
| --------------------- | ------------------------ |
| `npm run dev`         | Start development server |
| `npm run build`       | Production build         |
| `npm run preview`     | Preview production build |
| `npm run lint`        | Run ESLint               |
| `npm run format`      | Format with Prettier     |
| `npm run db:push`     | Push Prisma schema to DB |
| `npm run db:seed`     | Seed database            |
| `npm run db:studio`   | Open Prisma Studio       |
| `npm run db:generate` | Generate Prisma client   |

## Folder Structure

```
src/
├── components/       # UI components (shadcn/ui + custom)
│   └── layout/       # Header, footer, navigation
├── lib/              # Utilities and services
│   ├── api/          # TanStack server functions
│   ├── validators/   # Zod validation schemas
│   ├── email.ts      # Email service (Resend)
│   ├── upload.ts     # File upload (Supabase Storage)
│   └── seo.ts        # SEO utilities
├── hooks/            # Custom React hooks
├── routes/           # TanStack Router file-based routes
│   ├── __root.tsx    # Root layout
│   ├── admin/        # Admin dashboard
│   └── *.tsx         # Public pages
├── stores/           # Zustand stores
└── styles.css        # Global styles
prisma/
└── schema.prisma     # Database schema
```
