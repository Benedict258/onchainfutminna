# Onchain FUTMinna — Complete Project Study

## 1. Identity

**Name:** Blockchain Club FUTMinna — OnchainFutminna
**Purpose:** Official web platform for FUTMinna Web3 community. Member management, events, learning, project showcase, leaderboard/badge gamification, Sui on-chain registration, squads/arena, intake, DEVLOG, gate checks, certifications & alumni.

Deployed: https://onchainfutminna.xyz
Local dev: http://localhost:5179

## 2. Tech Stack

- **Frontend:** TanStack Start 1.167.50 (React 19.2 + Vite 7.3.1) with TanStack Router 1.168.25, TanStack Query 5.83
- **UI:** Tailwind CSS 4.2.1, shadcn/ui Radix primitives, lucide-react, Recharts
- **State:** Zustand 5.0.14
- **Forms:** react-hook-form 7.71 + Zod 3.24
- **API Server:** Nitro 3.0.260603-beta on Vercel
- **DB:** PostgreSQL Supabase + Prisma 7.8.0 @prisma/adapter-pg 7.8.0
- **Auth:** JWT access+refresh, bcryptjs 3.0.3/jsonwebtoken 9.0.3
- **Email:** Resend 6.12.4
- **Storage:** Supabase Storage
- **Blockchain:** @mysten/sui
- **Other:** date-fns, embla-carousel-react, sonner

## 3. Architecture

File-based routing `src/routes/`. Server entry in `src/server.ts` handles:

- Direct API handlers: auth register/login, supabase CRUD, analytics, learn-complete, adjust-points, event-attend, awards, challenge vote, profile update/fetch/upload, project submit/upload, email verification/reset, WhatsApp webhook/stats.

Lib layer:
`src/lib/`

- `api/` server functions
- `auth.ts` JWT verify, hash, codes
- `supabase.ts` query helper
- `db.ts` Prisma client
- `sui-client.ts` Sui interactions
- `email.ts` Resend
- `upload.ts` Supabase storage
- `auto-awards.ts` points/badges logic
- `badges.ts`, `challenges.ts`
- `rate-limit.ts`, `seo.ts`, `validators/`

## 4. Database Schema

Core models:
User → Profile → ProfileSkill/Skill
User → RefreshToken
User → EventRSVP, CourseProgress, QuizAttempt, ProjectMember, LeaderboardEntry, BlogPost, UserBadge, UserModuleProgress, IntakeAssessment, DevlogEntry, GateCheck, Certification

Events: Event, EventRSVP, EventResource
Learning: Track, Module, Quiz, QuizQuestion, QuizOption, CourseProgress, UserModuleProgress
Projects: Project, ProjectMember, Tag, ProjectTag
Opportunities, BlogPost/BlogTag, Partner
Gamification: LeaderboardEntry, Badge, UserBadge
SiteSettings

Additional: IntakeAssessment, DevlogEntry, GateCheck, Certification

Enums: Role, ExperienceLevel, Level, EventType, Ecosystem, Difficulty, ProjectStatus, OpportunityType, OpportunityStatus, PostStatus, PartnerCategory

## 5. Blockchain

Sui Move contract `contracts/sui/sources/club_registry.move`
PackageID: 0xd4632758a5cf176469ef34d71808aeccbf3b30aea3bab18509e2a89930426d4a
Admin: 0x01d65891204c9a6d5f1f6f0f93ceca8952fee2769ce2fdec887183c2624647d3

Structs: LeaderboardEntry, Certificate, Badge, AdminCap
Functions: register_entry, award_points, mint_badge, issue_certificate
Events: PointsAwarded, BadgeMinted, CertificateIssued

## 6. Routes Overview

Public:
/ — Landing with carousel, stats, core pillars, upcoming deployments, past events, shipped protocols, community links
/auth — Login
/join — Register
/intake — Lane placement assessment
/learn — Curriculum browser
/learn/$slug — Track detail with quizzes
/events — List
/events/$eventId — Detail + RSVP
/events/request — Event request form
/projects — List
/projects/$projectId — Detail
/projects/submit — Submit
/blog — List
/blog/$slug — Detail
/leaderboard — Rankings
/arena — Challenges
/arena/create — Create challenge
/arena/$challengeId — Detail
/squads
/squads/$squadId
/pair — Pair programming
/hackathons
/hackathons/$teamId
/alumni
/profile — User profile
/profile/devlog
/members/$memberId
/members/$memberId/devlog
/opportunities
/partners
/about

Admin:
/admin
/admin/analytics, /admin/settings, /admin/members, /admin/students, /admin/events, /admin/projects, /admin/blog, /admin/learn, /admin/leaderboard, /admin/partners, /admin/opportunities, /admin/reviews, /admin/cohorts, /admin/cohorts/$id, /admin/gate-checks, /admin/certifications, /admin/challenges

API endpoints handled in server.ts:
/api/auth/register, /api/auth/login, /api/auth/logout, /api/auth/verify, /api/auth/resend-verification, /api/auth/forgot-password, /api/auth/reset-password
/api/supabase/* query/insert/update/delete/rpc/analytics/settings/learn-complete/adjust-points
/api/event/attend
/api/community/log
/api/awards
/api/challenge/vote
/api/profile/update, /api/profile/fetch
/api/upload/avatar, /api/upload/project
/api/project/submit
/api/whatsapp/webhook, /api/whatsapp/stats

## 7. Features Status Aug 16 2026

Completed:
Auth, profiles, events RSVP, projects CRUD, blog CRUD, learn curriculum+quizzes, leaderboard+badges, admin dashboard, gamification 30+ actions 18 badges, squads/peer reviews/pair/hackathon teams, arena 8 challenge types, opportunities+partners, intake assessment, DEVLOG, gate checks, certifications+alumni

Landing:
Hero carousel slide1.jpg slide2.jpg, stats bar, CORE PILLARS, upcoming deployments dynamic, past events static, featured projects Ayorithm/VoiceGuard/Stripe3, community links X/Telegram/WhatsApp/Discord

Database:
All 7 phases tables, performance indexes, leaderboard materialized view, 3 events seeded, 5 projects seeded

Responsive: mobile-first px-4 sm:px-6, max-width 1400px, Tailwind dark theme purple #C084FC accent

## 8. Recent Changes

2026-08-16:

- Added tables: user_module_progress, intake_assessments, devlog_entries, gate_checks, certifications
- Prisma models updated
- Server: POST /api/intake/submit with JWT, duplicate 409, rate limit, auto 3 community points
- Intake route uses server-side userId, re-submission guard
- Track detail includes quizzes
- DEVLOG CRUD + streaks + badge auto-award

## 9. Known Issues / Blockers

- npm install extremely slow/timing out, node_modules partially installed, .bin symlinks missing
- Prisma generate cannot run until full install
- Requires Supabase creds, JWT secrets, Resend keys for local run

## 10. Development Workflow

npm run dev
npm run build
npm run preview
npm run db:push
npm run db:seed
npm run db:studio
npm run db:generate

Env vars:
DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, RESEND_FROM_EMAIL, SITE_URL

## 11. Where to Start Working

- Landing page components in src/routes/index.tsx
- Auth flow src/lib/api/auth-direct + server.ts handlers
- Learning flow src/lib/api/learn.server.ts + src/routes/learn/*
- Gamification src/lib/auto-awards.ts
- Sui integration src/lib/sui-client.ts + contracts/sui/
- Admin UI src/routes/admin/*
- DEVLOG src/routes/profile/devlog.tsx + src/server.ts handleDevlog

This platform is production-ready on Vercel with full-stack TanStack Start + Supabase + Sui blockchain credentialing.
