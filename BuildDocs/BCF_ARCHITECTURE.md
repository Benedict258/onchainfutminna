# Architecture Document

## Blockchain Club FUTMINNA — Community Platform

**Version:** 1.0
**Prepared by:** Benedict Isaac (Technical Lead, Blockchain Club FUTMINNA)
**Date:** June 2026
**Status:** Draft

---

## 1. Architecture Overview

The Blockchain Club FUTMINNA platform is built as a **monorepo full-stack web application** using a modern JAMstack-adjacent architecture. It separates concerns cleanly across a React frontend, a Node.js/Express API backend, and a managed PostgreSQL database — all deployable on free-tier or low-cost infrastructure to match the club's current budget constraints.

The system is designed to:

- Serve fast, SEO-optimised public pages to unauthenticated visitors
- Deliver authenticated, personalised experiences to registered members
- Give admins a full CMS-like dashboard without touching code
- Scale to 1,000+ members without architectural rework

---

## 2. High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│                                                                 │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │              Next.js Frontend (Vercel)                   │  │
│   │                                                          │  │
│   │  Public Pages │ Auth Pages │ Member Dashboard │ Admin    │  │
│   └──────────────────────────┬───────────────────────────────┘  │
└─────────────────────────────┼───────────────────────────────────┘
                              │ HTTPS / REST API + JWT
┌─────────────────────────────┼───────────────────────────────────┐
│                      API LAYER                                  │
│                                                                 │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │           Node.js + Express API (Railway/Render)         │  │
│   │                                                          │  │
│   │  Auth │ Members │ Events │ Learn │ Projects │ Opps │ ... │  │
│   └──────────────────────────┬───────────────────────────────┘  │
└─────────────────────────────┼───────────────────────────────────┘
                              │
┌─────────────────────────────┼───────────────────────────────────┐
│                     DATA LAYER                                  │
│                                                                 │
│   ┌───────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│   │  PostgreSQL   │  │   Supabase   │  │   Cloudinary /   │   │
│   │  (Supabase)   │  │   Storage    │  │   Supabase CDN   │   │
│   │               │  │  (avatars,   │  │  (images, files) │   │
│   │  Primary DB   │  │   media)     │  │                  │   │
│   └───────────────┘  └──────────────┘  └──────────────────┘   │
│                                                                 │
│   ┌───────────────────────────────────────────────────────┐    │
│   │              Resend / Brevo (Email Service)           │    │
│   └───────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

### 3.1 Frontend

| Technology       | Choice                           | Reason                                                             |
| ---------------- | -------------------------------- | ------------------------------------------------------------------ |
| Framework        | **Next.js 14 (App Router)**      | SSR/SSG for SEO, fast public pages, file-based routing, API routes |
| Language         | **TypeScript**                   | Type safety across the codebase                                    |
| Styling          | **Tailwind CSS**                 | Utility-first, fast to build, easy to maintain brand tokens        |
| UI Components    | **shadcn/ui**                    | Accessible, unstyled-base components — customisable to brand       |
| State Management | **Zustand**                      | Lightweight global state (auth session, user profile)              |
| Data Fetching    | **TanStack Query (React Query)** | Server state, caching, background refetching                       |
| Forms            | **React Hook Form + Zod**        | Form handling + schema validation                                  |
| Animations       | **Framer Motion**                | Hero animations, page transitions, counter effects                 |
| Rich Text        | **TipTap**                       | Blog post editor in admin dashboard                                |
| Charts           | **Recharts**                     | Admin analytics dashboard                                          |
| Icons            | **Lucide React**                 | Consistent iconography                                             |

### 3.2 Backend

| Technology       | Choice                            | Reason                                          |
| ---------------- | --------------------------------- | ----------------------------------------------- |
| Runtime          | **Node.js**                       | JavaScript full-stack consistency               |
| Framework        | **Express.js**                    | Lightweight, flexible, well-understood          |
| Language         | **TypeScript**                    | Shared types with frontend via a shared package |
| ORM              | **Prisma**                        | Type-safe DB queries, clean schema migrations   |
| Auth             | **JWT (access + refresh tokens)** | Stateless, scalable, no vendor lock-in          |
| Password Hashing | **bcryptjs**                      | Industry standard                               |
| File Uploads     | **Multer + Cloudinary SDK**       | Handle multipart form uploads and CDN storage   |
| Email            | **Resend SDK**                    | Simple transactional email, generous free tier  |
| Validation       | **Zod**                           | Shared validation schemas between FE and BE     |
| API Docs         | **Swagger / OpenAPI**             | Auto-document all endpoints                     |

### 3.3 Database

| Technology | Choice                        | Reason                                           |
| ---------- | ----------------------------- | ------------------------------------------------ |
| Database   | **PostgreSQL (via Supabase)** | Relational, robust, free tier available          |
| ORM        | **Prisma**                    | Schema-first, type-safe, great migration tooling |
| Storage    | **Supabase Storage**          | Profile photos, event media, project assets      |

### 3.4 Infrastructure & DevOps

| Concern                | Tool                    | Notes                                                        |
| ---------------------- | ----------------------- | ------------------------------------------------------------ |
| Frontend Hosting       | **Vercel**              | Free tier, auto-deploy from GitHub, edge network             |
| Backend Hosting        | **Railway**             | Free tier available, easy Node.js deploy                     |
| Database               | **Supabase**            | Free tier PostgreSQL + Storage                               |
| Email                  | **Resend**              | 3,000 emails/month free                                      |
| File CDN               | **Cloudinary**          | 25GB free, image transformations                             |
| Version Control        | **GitHub**              | Monorepo with PR-based workflow                              |
| CI/CD                  | **GitHub Actions**      | Lint, type-check, test on PR; auto-deploy on merge to main   |
| Environment Management | **dotenv**              | `.env.local` for dev, Vercel/Railway env vars for production |
| Domain                 | **Custom domain** (TBD) | e.g., `blockchainfutminna.xyz` or `onchainfutminna.dev`      |

---

## 4. Repository Structure

```
blockchain-club-futminna/
├── apps/
│   ├── web/                        # Next.js frontend
│   │   ├── app/                    # App Router pages
│   │   │   ├── (public)/           # Public route group
│   │   │   │   ├── page.tsx        # Home
│   │   │   │   ├── about/
│   │   │   │   ├── events/
│   │   │   │   ├── learn/
│   │   │   │   ├── projects/
│   │   │   │   ├── opportunities/
│   │   │   │   ├── blog/
│   │   │   │   └── partners/
│   │   │   ├── (auth)/             # Auth route group
│   │   │   │   ├── signup/
│   │   │   │   ├── login/
│   │   │   │   └── forgot-password/
│   │   │   ├── (member)/           # Authenticated member area
│   │   │   │   ├── profile/[id]/
│   │   │   │   ├── leaderboard/
│   │   │   │   └── dashboard/
│   │   │   └── (admin)/            # Admin area
│   │   │       └── admin/
│   │   │           ├── page.tsx    # Admin overview
│   │   │           ├── members/
│   │   │           ├── events/
│   │   │           ├── learn/
│   │   │           ├── projects/
│   │   │           ├── opportunities/
│   │   │           ├── blog/
│   │   │           ├── partners/
│   │   │           ├── leaderboard/
│   │   │           ├── analytics/
│   │   │           └── settings/
│   │   ├── components/
│   │   │   ├── ui/                 # Base shadcn components
│   │   │   ├── layout/             # Navbar, Footer, Sidebar
│   │   │   ├── sections/           # Page section components
│   │   │   └── shared/             # Reusable across pages
│   │   ├── lib/
│   │   │   ├── api.ts              # Axios instance + interceptors
│   │   │   ├── auth.ts             # Auth helpers
│   │   │   └── utils.ts
│   │   └── stores/                 # Zustand stores
│   │
│   └── api/                        # Express backend
│       ├── src/
│       │   ├── routes/
│       │   │   ├── auth.routes.ts
│       │   │   ├── members.routes.ts
│       │   │   ├── events.routes.ts
│       │   │   ├── learn.routes.ts
│       │   │   ├── projects.routes.ts
│       │   │   ├── opportunities.routes.ts
│       │   │   ├── blog.routes.ts
│       │   │   ├── partners.routes.ts
│       │   │   ├── leaderboard.routes.ts
│       │   │   └── admin.routes.ts
│       │   ├── controllers/        # Route handler logic
│       │   ├── middleware/
│       │   │   ├── auth.middleware.ts     # JWT verification
│       │   │   ├── admin.middleware.ts    # Role check
│       │   │   └── upload.middleware.ts   # Multer config
│       │   ├── services/           # Business logic layer
│       │   ├── utils/
│       │   └── index.ts            # Express app entry
│       └── prisma/
│           ├── schema.prisma       # Database schema
│           └── migrations/
│
└── packages/
    ├── types/                      # Shared TypeScript types
    └── validators/                 # Shared Zod schemas (FE + BE)
```

---

## 5. Database Schema

### 5.1 Entity Relationship Overview

```
User ──────────── Profile (1:1)
User ──────────── EventRSVP (1:many)
User ──────────── CourseProgress (1:many)
User ──────────── QuizAttempt (1:many)
User ──────────── ProjectMember (many:many via ProjectMember)
User ──────────── LeaderboardEntry (1:1)
User ──────────── BlogPost (1:many, as author)

Event ─────────── EventRSVP (1:many)
Event ─────────── EventResource (1:many)

Track ─────────── Module (1:many)
Module ────────── Quiz (1:1)
Quiz ──────────── QuizQuestion (1:many)
QuizQuestion ──── QuizOption (1:many)

Project ───────── ProjectMember (1:many)
Project ───────── ProjectTag (many:many via ProjectTag)

Opportunity ───── OpportunityTag (many:many)
BlogPost ──────── BlogTag (many:many)
Partner ───────── PartnerCategory
```

### 5.2 Core Table Definitions

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────
// AUTH & USERS
// ─────────────────────────────────────────

enum Role {
  GUEST
  MEMBER
  ADMIN
  SUPER_ADMIN
}

enum ExperienceLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
}

enum Level {
  L100
  L200
  L300
  L400
  L500
  L600
}

model User {
  id                String    @id @default(cuid())
  email             String    @unique
  passwordHash      String
  role              Role      @default(MEMBER)
  isActive          Boolean   @default(false) // activated via email
  isApproved        Boolean   @default(true)  // admin can toggle
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  profile           Profile?
  rsvps             EventRSVP[]
  courseProgress    CourseProgress[]
  quizAttempts      QuizAttempt[]
  projectMembers    ProjectMember[]
  leaderboard       LeaderboardEntry?
  blogPosts         BlogPost[]
  refreshTokens     RefreshToken[]
}

model Profile {
  id              String          @id @default(cuid())
  userId          String          @unique
  user            User            @relation(fields: [userId], references: [id], onDelete: Cascade)

  fullName        String
  nickname        String?
  avatarUrl       String?
  dateOfBirth     DateTime?
  department      String
  level           Level
  experienceLevel ExperienceLevel @default(BEGINNER)
  funFact         String?
  bio             String?

  // Social links
  xLink           String?
  githubLink      String?
  portfolioLink   String?

  skills          ProfileSkill[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model Skill {
  id       String         @id @default(cuid())
  name     String         @unique
  profiles ProfileSkill[]
}

model ProfileSkill {
  profileId String
  skillId   String
  profile   Profile @relation(fields: [profileId], references: [id], onDelete: Cascade)
  skill     Skill   @relation(fields: [skillId], references: [id])

  @@id([profileId, skillId])
}

model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())
}

// ─────────────────────────────────────────
// EVENTS
// ─────────────────────────────────────────

enum EventType {
  WORKSHOP
  HACKATHON
  TALK
  BOOTCAMP
  SOCIAL
  OTHER
}

model Event {
  id          String      @id @default(cuid())
  title       String
  description String
  type        EventType
  location    String
  isVirtual   Boolean     @default(false)
  virtualLink String?
  startDate   DateTime
  endDate     DateTime
  coverImage  String?
  isPublished Boolean     @default(false)
  isFeatured  Boolean     @default(false)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  rsvps       EventRSVP[]
  resources   EventResource[]
}

model EventRSVP {
  id         String   @id @default(cuid())
  userId     String
  eventId    String
  attended   Boolean  @default(false)
  createdAt  DateTime @default(now())

  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  event      Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)

  @@unique([userId, eventId])
}

model EventResource {
  id        String   @id @default(cuid())
  eventId   String
  title     String
  url       String
  type      String   // slide, recording, link
  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
}

// ─────────────────────────────────────────
// LEARN
// ─────────────────────────────────────────

enum Ecosystem {
  EVM
  SUI_MOVE
  APTOS_MOVE
  SOLANA_RUST
  GENERAL
}

enum Difficulty {
  BEGINNER
  INTERMEDIATE
  ADVANCED
}

model Track {
  id          String     @id @default(cuid())
  title       String
  description String
  ecosystem   Ecosystem
  difficulty  Difficulty
  iconUrl     String?
  isPublished Boolean    @default(false)
  order       Int        @default(0)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  modules     Module[]
}

model Module {
  id          String   @id @default(cuid())
  trackId     String
  title       String
  description String
  content     String   // Markdown content
  order       Int
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  track       Track    @relation(fields: [trackId], references: [id], onDelete: Cascade)
  quiz        Quiz?
  progress    CourseProgress[]
}

model Quiz {
  id        String         @id @default(cuid())
  moduleId  String         @unique
  module    Module         @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  passMark  Int            @default(70) // percentage
  questions QuizQuestion[]
  attempts  QuizAttempt[]
}

model QuizQuestion {
  id            String       @id @default(cuid())
  quizId        String
  questionText  String
  order         Int
  quiz          Quiz         @relation(fields: [quizId], references: [id], onDelete: Cascade)
  options       QuizOption[]
}

model QuizOption {
  id         String       @id @default(cuid())
  questionId String
  optionText String
  isCorrect  Boolean      @default(false)
  question   QuizQuestion @relation(fields: [questionId], references: [id], onDelete: Cascade)
}

model CourseProgress {
  id          String   @id @default(cuid())
  userId      String
  moduleId    String
  completed   Boolean  @default(false)
  completedAt DateTime?
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  module      Module   @relation(fields: [moduleId], references: [id], onDelete: Cascade)

  @@unique([userId, moduleId])
}

model QuizAttempt {
  id        String   @id @default(cuid())
  userId    String
  quizId    String
  score     Int      // percentage
  passed    Boolean
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  quiz      Quiz     @relation(fields: [quizId], references: [id], onDelete: Cascade)
}

model Resource {
  id          String    @id @default(cuid())
  title       String
  url         String
  type        String    // Article, Video, Docs, Tool
  ecosystem   Ecosystem
  isPublished Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

// ─────────────────────────────────────────
// PROJECTS
// ─────────────────────────────────────────

enum ProjectStatus {
  PENDING
  APPROVED
  REJECTED
}

model Project {
  id          String        @id @default(cuid())
  name        String
  description String
  coverImage  String?
  githubUrl   String?
  demoUrl     String?
  ecosystem   Ecosystem
  status      ProjectStatus @default(PENDING)
  isFeatured  Boolean       @default(false)
  hackathonId String?       // optional link to event
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  members     ProjectMember[]
  tags        ProjectTag[]
}

model ProjectMember {
  projectId String
  userId    String
  role      String?  // e.g. "Lead", "Contributor"

  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([projectId, userId])
}

model Tag {
  id       String       @id @default(cuid())
  name     String       @unique
  projects ProjectTag[]
}

model ProjectTag {
  projectId String
  tagId     String
  project   Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  tag       Tag     @relation(fields: [tagId], references: [id])

  @@id([projectId, tagId])
}

// ─────────────────────────────────────────
// OPPORTUNITIES
// ─────────────────────────────────────────

enum OpportunityType {
  HACKATHON
  GRANT
  BOUNTY
  JOB
  INTERNSHIP
  PROGRAM
  AMBASSADOR
}

enum OpportunityStatus {
  OPEN
  CLOSING_SOON
  CLOSED
}

model Opportunity {
  id          String            @id @default(cuid())
  title       String
  organizer   String
  type        OpportunityType
  ecosystem   Ecosystem?
  description String
  prize       String?
  applyUrl    String
  deadline    DateTime?
  status      OpportunityStatus @default(OPEN)
  isPublished Boolean           @default(true)
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
}

// ─────────────────────────────────────────
// BLOG
// ─────────────────────────────────────────

enum PostStatus {
  DRAFT
  PUBLISHED
}

model BlogPost {
  id          String     @id @default(cuid())
  title       String
  slug        String     @unique
  excerpt     String
  content     String     // Markdown / rich text
  coverImage  String?
  authorId    String
  status      PostStatus @default(DRAFT)
  category    String     // Announcement, Recap, Tutorial, etc.
  isFeatured  Boolean    @default(false)
  publishedAt DateTime?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  author      User       @relation(fields: [authorId], references: [id])
  tags        BlogPostTag[]
}

model BlogTag {
  id    String        @id @default(cuid())
  name  String        @unique
  posts BlogPostTag[]
}

model BlogPostTag {
  postId String
  tagId  String
  post   BlogPost @relation(fields: [postId], references: [id], onDelete: Cascade)
  tag    BlogTag  @relation(fields: [tagId], references: [id])

  @@id([postId, tagId])
}

// ─────────────────────────────────────────
// PARTNERS
// ─────────────────────────────────────────

enum PartnerCategory {
  ECOSYSTEM
  COMMUNITY
  SPONSOR
}

model Partner {
  id          String          @id @default(cuid())
  name        String
  logoUrl     String
  website     String?
  description String?
  category    PartnerCategory
  order       Int             @default(0)
  isActive    Boolean         @default(true)
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
}

// ─────────────────────────────────────────
// LEADERBOARD
// ─────────────────────────────────────────

model LeaderboardEntry {
  id            String   @id @default(cuid())
  userId        String   @unique
  totalPoints   Int      @default(0)
  eventPoints   Int      @default(0)
  learnPoints   Int      @default(0)
  buildPoints   Int      @default(0)
  communityPoints Int    @default(0)
  badges        String[] // array of badge identifiers
  updatedAt     DateTime @updatedAt

  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// ─────────────────────────────────────────
// SITE SETTINGS
// ─────────────────────────────────────────

model SiteSettings {
  id              String   @id @default(cuid())
  key             String   @unique
  value           String
  updatedAt       DateTime @updatedAt
}
```

---

## 6. API Design

### 6.1 Base URL

```
Production:  https://api.blockchainfutminna.xyz/v1
Development: http://localhost:4000/v1
```

### 6.2 Authentication Headers

```
Authorization: Bearer <access_token>
```

### 6.3 Endpoint Summary

#### Auth

```
POST   /auth/register          Create account
POST   /auth/login             Login, returns access + refresh tokens
POST   /auth/refresh           Refresh access token
POST   /auth/logout            Invalidate refresh token
POST   /auth/forgot-password   Send reset email
POST   /auth/reset-password    Reset with token
GET    /auth/verify-email/:token  Activate account
```

#### Members

```
GET    /members                List all members (public, paginated)
GET    /members/:id            Get member profile (public)
PATCH  /members/:id            Update own profile (auth)
POST   /members/:id/avatar     Upload avatar (auth)
DELETE /members/:id            Delete account (super admin)
```

#### Events

```
GET    /events                 List events (filter: upcoming/past)
GET    /events/:id             Get event detail
POST   /events/:id/rsvp        RSVP to event (auth)
DELETE /events/:id/rsvp        Cancel RSVP (auth)
--- Admin ---
POST   /events                 Create event
PATCH  /events/:id             Update event
DELETE /events/:id             Delete event
PATCH  /events/:id/attendance  Mark attendance
POST   /events/:id/resources   Add resource to event
```

#### Learn

```
GET    /tracks                 List all tracks
GET    /tracks/:id             Get track + modules
GET    /tracks/:id/progress    Get own progress (auth)
GET    /modules/:id            Get module content
POST   /modules/:id/complete   Mark module complete (auth)
GET    /quizzes/:id            Get quiz questions
POST   /quizzes/:id/attempt    Submit quiz attempt (auth)
GET    /resources              List resources (filter: ecosystem, type)
--- Admin ---
POST   /tracks                 Create track
PATCH  /tracks/:id             Update track
POST   /tracks/:id/modules     Add module
PATCH  /modules/:id            Update module
POST   /modules/:id/quiz       Create/update quiz
POST   /resources              Add resource
DELETE /resources/:id          Remove resource
```

#### Projects

```
GET    /projects               List approved projects
GET    /projects/:id           Get project detail
POST   /projects               Submit project (auth)
--- Admin ---
PATCH  /projects/:id/status    Approve / reject
PATCH  /projects/:id/feature   Feature / unfeature
DELETE /projects/:id           Remove project
```

#### Opportunities

```
GET    /opportunities          List (filter: type, status, ecosystem)
GET    /opportunities/:id      Get detail
--- Admin ---
POST   /opportunities          Create
PATCH  /opportunities/:id      Update
DELETE /opportunities/:id      Delete
```

#### Blog

```
GET    /blog                   List published posts
GET    /blog/:slug             Get post by slug
--- Admin ---
POST   /blog                   Create post
PATCH  /blog/:id               Update post
PATCH  /blog/:id/publish       Publish / unpublish
DELETE /blog/:id               Delete post
```

#### Partners

```
GET    /partners               List active partners
--- Admin ---
POST   /partners               Add partner
PATCH  /partners/:id           Update partner
DELETE /partners/:id           Remove partner
```

#### Leaderboard

```
GET    /leaderboard            Full ranked list (filter: period, ecosystem)
GET    /leaderboard/:userId    Get single member entry
--- Admin ---
PATCH  /leaderboard/:userId    Manually adjust points
```

#### Admin

```
GET    /admin/analytics        Site-wide stats
GET    /admin/members          Full member list with filters
PATCH  /admin/members/:id/role  Assign role
PATCH  /admin/members/:id/approve  Approve / deactivate
GET    /admin/settings         Get site settings
PATCH  /admin/settings         Update site settings
```

---

## 7. Authentication Flow

```
┌──────────┐         ┌──────────────┐        ┌────────────────┐
│  Client  │         │   API /auth  │        │    Database    │
└────┬─────┘         └──────┬───────┘        └───────┬────────┘
     │                      │                        │
     │  POST /auth/register │                        │
     │─────────────────────►│                        │
     │                      │  hash password         │
     │                      │  create User + Profile │
     │                      │───────────────────────►│
     │                      │  send verification     │
     │                      │  email (Resend)        │
     │◄─────────────────────│                        │
     │  201 { message }     │                        │
     │                      │                        │
     │  GET /auth/verify/:token                      │
     │─────────────────────►│                        │
     │                      │  set isActive = true   │
     │                      │───────────────────────►│
     │◄─────────────────────│                        │
     │  200 { redirect }    │                        │
     │                      │                        │
     │  POST /auth/login    │                        │
     │─────────────────────►│                        │
     │                      │  verify password       │
     │                      │  generate accessToken (15min)
     │                      │  generate refreshToken (7d)
     │                      │  store refreshToken    │
     │                      │───────────────────────►│
     │◄─────────────────────│                        │
     │  { accessToken,      │                        │
     │    refreshToken }    │                        │
     │                      │                        │
     │  POST /auth/refresh  │                        │
     │  (refreshToken)      │                        │
     │─────────────────────►│                        │
     │                      │  verify + rotate token │
     │◄─────────────────────│                        │
     │  { new accessToken } │                        │
```

---

## 8. Points & Leaderboard System

Points are awarded automatically by the API when triggering events occur.

| Action                        | Points   |
| ----------------------------- | -------- |
| Complete profile (all fields) | 50       |
| Attend an event               | 30       |
| RSVP to an event              | 5        |
| Complete a module             | 20       |
| Pass a quiz (first attempt)   | 30       |
| Pass a quiz (retry)           | 15       |
| Complete a full track         | 100      |
| Submit a project (approved)   | 80       |
| Project featured by admin     | 50 bonus |
| Build-in-public post linked   | 20       |
| Manual admin award            | variable |

Points are split into categories (eventPoints, learnPoints, buildPoints, communityPoints) for filtered leaderboard views.

Badges are string identifiers stored in the `badges` array on LeaderboardEntry:

- `top_builder` — most buildPoints this month
- `top_learner` — most learnPoints this month
- `event_champion` — attended 5+ events
- `track_completer_{ecosystem}` — completed a full track
- `most_active` — highest total activity this month

---

## 9. Frontend Rendering Strategy

| Page Type                             | Strategy                                       | Reason                                      |
| ------------------------------------- | ---------------------------------------------- | ------------------------------------------- |
| Home, About, Partners                 | **SSG** (Static Site Generation)               | Content rarely changes, maximum performance |
| Events, Blog, Projects, Opportunities | **ISR** (Incremental Static Regeneration, 60s) | Frequently updated, still fast              |
| Learn tracks (public view)            | **SSR**                                        | SEO important, content changes              |
| Member Profile                        | **SSR**                                        | Dynamic, user-specific                      |
| Leaderboard                           | **SSR + client polling**                       | Real-time feel, updates frequently          |
| Admin Dashboard                       | **CSR** (Client-Side Rendering)                | No SEO needed, highly dynamic               |

---

## 10. Security Considerations

| Concern             | Mitigation                                                                  |
| ------------------- | --------------------------------------------------------------------------- |
| Authentication      | JWT with short-lived access tokens (15min) + rotating refresh tokens        |
| Password storage    | bcrypt with salt rounds = 12                                                |
| SQL injection       | Prisma ORM parameterised queries                                            |
| XSS                 | React's default escaping; DOMPurify for rendered Markdown                   |
| CSRF                | SameSite cookie policy on refresh token; CSRF token on state-changing forms |
| Rate limiting       | express-rate-limit on auth routes (5 req/15min)                             |
| File uploads        | Type validation + size limit (5MB) before Cloudinary upload                 |
| Admin routes        | Role middleware on all /admin/** routes                                     |
| Environment secrets | Never committed to git; managed via Vercel/Railway env vars                 |
| HTTPS               | Enforced on all production routes via Vercel/Railway                        |

---

## 11. Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        PRODUCTION                           │
│                                                             │
│  ┌──────────────────┐        ┌──────────────────────────┐  │
│  │     Vercel       │        │         Railway          │  │
│  │                  │        │                          │  │
│  │  Next.js App     │◄──────►│  Express API             │  │
│  │  Edge Network    │  REST  │  Node.js Runtime         │  │
│  │  Auto-scaling    │        │                          │  │
│  └──────────────────┘        └───────────┬──────────────┘  │
│                                          │                  │
│                              ┌───────────▼──────────────┐  │
│                              │        Supabase          │  │
│                              │                          │  │
│                              │  PostgreSQL Database     │  │
│                              │  File Storage            │  │
│                              │  Row Level Security      │  │
│                              └──────────────────────────┘  │
│                                                             │
│  ┌──────────────────┐        ┌──────────────────────────┐  │
│  │    Cloudinary    │        │          Resend          │  │
│  │  Image/File CDN  │        │    Transactional Email   │  │
│  └──────────────────┘        └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     CI/CD PIPELINE                          │
│                                                             │
│  GitHub PR ──► GitHub Actions (lint + typecheck + test)     │
│                       │                                     │
│              merge to main                                  │
│                       │                                     │
│              ┌────────┴────────┐                            │
│              ▼                 ▼                            │
│         Vercel auto-      Railway auto-                     │
│         deploy (FE)       deploy (API)                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 12. Phase Roadmap

### Phase 1 — MVP (Launch)

- All 13 pages built and functional
- Auth (register, login, email verify)
- Member profiles
- Events (create, RSVP, past/upcoming)
- Learn tracks + modules + quizzes
- Projects showcase + submission
- Opportunities board
- Blog
- Leaderboard (points system)
- Partners section
- Admin dashboard (all modules)
- Mobile responsive
- Deployed on Vercel + Railway + Supabase

### Phase 2 — Enhancement

- On-chain certifications (NFT/SBT on Sui or Solana)
- Wallet connect login
- Live event streaming integration
- Member-submitted opportunities (with admin approval)
- Email digest (weekly opportunities newsletter)
- Advanced analytics for admins

### Phase 3 — Ecosystem Expansion

- Mobile app (React Native)
- DAO governance for club decisions
- Multi-club federation (other Nigerian university blockchain clubs)
- Internal messaging / DMs
- Sponsor portal (self-serve sponsor dashboard)

---

_End of Architecture Document v1.0_
