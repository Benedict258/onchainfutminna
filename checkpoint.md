# BlockchainClub FUTMinna — Project Checkpoint

**Date:** August 16, 2026  
**Previous Commit:** `c384ff5`

## Current State

### Server
- Running on port 5180 (dev server via node)
- Public URL: `http://152.67.149.134:5180`
- Vercel production: `https://onchainfutminna.xyz`

### Platform Features Completed

| Feature | Status |
|---------|--------|
| Auth (register, login, verify, forgot/reset) | Done |
| User profiles (avatar, phone, username, bio, skills) | Done |
| Events (listing, detail, RSVP, admin CRUD, request form) | Done |
| Projects (listing, detail, submit, admin approve, featured) | Done |
| Blog (listing, detail, admin CRUD) | Done |
| Learn (curriculum browser, track detail, modules, Markdown) | Done |
| Leaderboard (points, badges, rankings) | Done |
| Admin dashboard (analytics, CRUD pages) | Done |
| Gamification (30+ point actions, 18 badges, levels, streaks) | Done |
| Multiplayer (squads, peer reviews, pair programming, hackathon teams) | Done |
| Challenges / Arena (8 challenge types, wager system, voting, badges) | Done |
| Opportunities + Partners | Done |
| Intake assessment | Done |
| DEVLOG system | Done |
| Gate checks + Cohorts | Done |
| Certifications + Alumni directory | Done |

### Blockchain
- Sui Move contract deployed on testnet
- PackageID: `0xd4632758a5cf176469ef34d71808aeccbf3b30aea3bab18509e2a89930426d4a`
- Admin wallet: `0x01d65891204c9a6d5f1f6f0f93ceca8952fee2769ce2fdec887183c2624647d3`

### Landing Page
- Hero with image carousel (slide1.jpg, slide2.jpg)
- Stats bar centered
- CORE PILLARS section
- Upcoming deployments (dynamic from DB)
- Past events (static with cover images)
- Featured projects (Ayorithm, VoiceGuard, Stripe3)
- Community links (X/Twitter, Telegram, WhatsApp, Discord) with SVG logos
- Image carousel with 5s auto-slide

### Database
- All 7 phases of tables created
- Performance indexes added
- Leaderboard materialized view
- 3 events seeded (Liquidity Campus Tour, Vibe-Coding, Onboarding)
- 5 projects seeded (Ayorithm, VoiceGuard, Stripe3, FuFi Vault, Aura)

### Responsive Design
- All pages responsive (mobile-first with `px-4 sm:px-6`)
- Site-wide max-width: 1400px
- Tailwind dark theme (purple #C084FC accent)

### Key URLs
- Landing: `/`
- Events: `/events`
- Projects: `/projects`
- Learn: `/learn`
- Admin: `/admin`
- Arena: `/arena`
- Squads: `/squads`
- Intake: `/intake`
- Profile: `/profile`
- Alumni: `/alumni`

### Route Count
~50+ routes across the platform

### File Count
~150+ source files

---

## Changes Made — August 16, 2026

### 1. Database Schema (`supabase-schema.sql`)
Added 5 new tables (already exist in Supabase):

| Table | Purpose |
|-------|---------|
| `user_module_progress` | Tracks module completion with points_earned |
| `intake_assessments` | Stores intake assessment results + lane placement |
| `devlog_entries` | Weekly development log entries (CRUD, publish toggle) |
| `gate_checks` | Gate check status per user (not_started/pending/passed) |
| `certifications` | Issued certifications with Sui tx hash |

Added 8 indexes + 6 foreign keys.

### 2. Prisma Schema (`prisma/schema.prisma`)
Added 5 new models with relations to User and Module:
- `UserModuleProgress`, `IntakeAssessment`, `DevlogEntry`, `GateCheck`, `Certification`

### 3. Server API (`src/server.ts`)
- **New endpoint:** `POST /api/intake/submit`
  - JWT auth verification
  - Duplicate check (409 if already submitted)
  - Rate limiting (10 req/min)
  - Auto-awards 3 community points
- **Streak badge integration:** Devlog creation now checks for 4-week streaks and auto-awards "Streak Master" badge

### 4. Intake Assessment (`src/routes/intake.tsx`)
- **Fixed:** Now uses `/api/intake/submit` endpoint (userId extracted server-side from JWT)
- **Added:** Re-submission guard — checks for existing assessment on page load, shows previous result
- **Added:** 409 response handling — shows existing result if duplicate submission attempted

### 5. Track Detail (`src/lib/api/learn.server.ts`)
- **Fixed:** `getTrackBySlug` now includes `quizzes(id, pass_mark, quiz_questions(id, question_text))` in the query

### 6. DEVLOG System
- Profile devlog (`/profile/devlog`) — fully functional with CRUD, streaks, week grid
- Member devlog (`/members/$id/devlog`) — shows published entries with Markdown rendering
- Server endpoint (`/api/devlog` POST) — creates entries, awards 5 community points, checks streak badges

---

## Pending Actions

1. **Run `npx prisma generate`** when network/npm is available (currently timing out)
2. **Verify all endpoints** work end-to-end with live Supabase
3. **Test intake flow:** Register → Complete assessment → See result → Verify can't resubmit
4. **Test devlog flow:** Create entry → See streak → Verify badge auto-award
5. **Test track detail:** Navigate to `/learn/$slug` → Verify quizzes appear → Mark modules complete

## Known Issues
- npm install extremely slow/timing out on current network
- `node_modules` partially installed — missing `.bin` symlinks
- Prisma generate cannot run until full install completes
