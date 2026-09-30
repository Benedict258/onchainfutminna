# DEV_PLAN.md — Development Phases & Plan

## Blockchain Club FUTMINNA — Community Platform

---

## Phase 0: Foundation & Setup

**Status: COMPLETE**

- [x] Project scaffold (TanStack Start + Vite + Tailwind v4)
- [x] Design system (deep purple-black theme `#1A031B`, typography, dark/light toggle)
- [x] Layout shell (sticky header, mobile nav, 4-column footer)
- [x] 46 shadcn/ui components installed
- [x] Dependencies installed (React Hook Form, Zod, TanStack Query, Recharts, etc.)
- [x] Prisma schema (24 models, 12 enums)
- [x] Supabase PostgreSQL database created and schema pushed
- [x] Seed data (admin user, 4 tracks, 3 events, 3 partners, 6 settings)

---

## Phase 1: Core Infrastructure

**Status: COMPLETE**

### Auth System

- [x] JWT utilities (access + refresh tokens)
- [x] Login page (email + password, form validation)
- [x] Sign Up / Join page (16-field registration form)
- [x] Zustand auth store with localStorage persistence
- [x] AuthGuard and AdminGuard route protection
- [x] Header updated with auth state (avatar dropdown when logged in)

### API Layer

- [x] 53 server functions across 9 files:
  - `auth.server.ts` — register, login, logout, refreshToken, getMe
  - `members.server.ts` — getMembers, getMemberById, updateMember
  - `events.server.ts` — CRUD + RSVP + attendance + resources
  - `learn.server.ts` — CRUD tracks/modules/quizzes/resources + progress
  - `projects.server.ts` — CRUD + approve/reject/feature
  - `opportunities.server.ts` — CRUD
  - `blog.server.ts` — CRUD + publish/unpublish
  - `partners.server.ts` — CRUD
  - `leaderboard.server.ts` — rankings + point adjustments
  - `admin.server.ts` — analytics, member management, settings

---

## Phase 2: Feature Pages

**Status: COMPLETE**

- [x] Home page (hero, stats, pillars, events, projects, tracks, partners, CTA)
- [x] About page (challenge, vision/mission, story, team, CTA)
- [x] Events page (filter tabs, event cards, RSVP counts)
- [x] Learn page (track cards, progress bars, resources library)
- [x] Projects page (featured spotlight, ecosystem filters, project cards)
- [x] Opportunities page (type filters, urgency-colored deadlines)
- [x] Blog page (category filters, featured post, post grid)
- [x] Leaderboard page (podium, ranked table, time/ecosystem filters)
- [x] Partners page (category sections, logo grid, CTA)

---

## Phase 3: Admin Dashboard

**Status: COMPLETE**

- [x] Admin layout (sidebar navigation + content area)
- [x] Overview dashboard (stats cards, recent activity)
- [x] Members management (table, role assignment, approve/deactivate)
- [x] Events management (CRUD, RSVP viewer, attendance)
- [x] Learn management (tracks, modules, quizzes, resources tabs)
- [x] Projects review (approve/reject/feature pipeline)
- [x] Opportunities management (CRUD, status management)
- [x] Blog management (create/edit, publish/unpublish)
- [x] Partners management (CRUD, category filtering)
- [x] Leaderboard (ranked table, point adjustments)
- [x] Analytics (stats cards, Recharts charts)
- [x] Settings (club info, social links, maintenance mode)

---

## Phase 4: Supporting Systems

**Status: COMPLETE**

- [x] File upload utility (Cloudinary integration)
- [x] Email service (Resend — verification, welcome, password reset)
- [x] SEO (meta tags, OpenGraph, JSON-LD structured data)
- [x] CI/CD (GitHub Actions — lint, typecheck, build)
- [x] Deployment config (vercel.json)
- [x] README.md

---

## Phase 5: Integration & Testing

**Status: NOT STARTED**

- [ ] Wire all pages to live API server functions
- [ ] Test auth flow end-to-end (register → verify → login → profile)
- [ ] Test all CRUD operations through admin dashboard
- [ ] Test RSVP, quiz attempts, project submissions
- [ ] Mobile responsiveness testing across all pages
- [ ] Cross-browser testing
- [ ] Fix TypeScript errors and warnings
- [ ] Fix any broken imports or missing dependencies

---

## Phase 6: Content & Launch

**Status: NOT STARTED**

- [ ] Add real events via admin dashboard
- [ ] Create learning track content (module text, quiz questions)
- [ ] Add real blog posts
- [ ] Add real opportunities
- [ ] Add real partner logos and descriptions
- [ ] Upload hero images and event photos
- [ ] Configure Resend API key for emails
- [ ] Configure Cloudinary for file uploads
- [ ] Custom domain setup (blockchainfutminna.xyz or onchainfutminna.dev)
- [ ] Deploy to production (Vercel + Railway + Supabase)

---

## Phase 7: Enhancement (Post-Launch)

**Status: NOT STARTED**

- [ ] On-chain certifications (NFT/SBT on Sui or Solana)
- [ ] Wallet connect login
- [ ] Live event streaming integration
- [ ] Member-submitted opportunities
- [ ] Email digest (weekly newsletter)
- [ ] Advanced analytics for admins
- [ ] Mobile app (React Native)
- [ ] DAO governance
- [ ] Multi-club federation

---

## Current Phase: Phase 5 — Integration & Testing

**What's done:** All code is built. Pages, API, auth, admin, supporting systems complete.
**What's next:** Wire everything together, test end-to-end, fix bugs, prepare for deployment.
