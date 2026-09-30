# Product Requirements Document (PRD)

## Blockchain Club FUTMINNA — Community Platform

**Version:** 1.0
**Prepared by:** Benedict Isaac (Technical Lead, Blockchain Club FUTMINNA)
**Date:** June 2026
**Status:** Draft

---

## 1. Overview

### 1.1 Product Summary

The Blockchain Club FUTMINNA Community Platform is a web-based platform serving as the official digital home of Blockchain Club FUTMINNA (also known as OnchainFutminna). It is a multi-page, feature-rich community platform — not a simple brochure site — combining public-facing marketing pages with authenticated member features including profiles, learning tracks, a project showcase, a leaderboard, and an admin management system.

### 1.2 Problem Being Solved

Many students at the Federal University of Technology, Minna (FUTMinna) are interested in blockchain and Web3 but have no structured entry point. Opportunities, mentorship, and practical experience are limited. Students across different blockchain ecosystems have no shared platform to collaborate and grow. The platform solves this by providing a single digital infrastructure layer for the entire club's operations — education, community, events, opportunities, and recognition.

### 1.3 Target Users

| User Type           | Description                                                            |
| ------------------- | ---------------------------------------------------------------------- |
| Prospective Members | FUTMinna students discovering the club for the first time              |
| Club Members        | Registered and active community members                                |
| Club Admins         | Core team managing content, members, events, and approvals             |
| Visitors / Partners | External persons, sponsors, ecosystem partners, other university clubs |

### 1.4 Brand Reference

- **Primary Background:** Deep dark purple-black (`#0D0A14`)
- **Primary Accent:** Blue-violet gradient (`#1A0533` → `#2D1B8E`)
- **Text:** White (`#FFFFFF`) and light grey (`#C8C8D4`)
- **Logo:** Geometric shield/crown mark — white on dark
- **Typography:** Bold, uppercase for headings; clean sans-serif for body
- **Tone:** Technical, ambitious, inclusive, African-rooted

---

## 2. Goals & Success Metrics

### 2.1 Product Goals

1. Establish a credible, professional digital presence for Blockchain Club FUTMINNA
2. Streamline member onboarding and community management
3. Provide a structured learning environment for Web3 education
4. Showcase community projects and reward active participation
5. Serve as a discovery platform for opportunities (hackathons, grants, jobs)
6. Enable admin team to manage all site content without touching code

### 2.2 Success Metrics (6 months post-launch)

- 200+ registered members
- 80%+ profile completion rate among registered members
- At least 3 learning tracks published with quiz content
- 10+ community projects showcased
- Monthly active users (MAU) ≥ 60% of registered members
- Admin team able to manage all content independently

---

## 3. Pages & Features

### 3.1 Page Inventory

| #   | Page                  | Auth Required          | Description                         |
| --- | --------------------- | ---------------------- | ----------------------------------- |
| 1   | Home (Landing)        | No                     | Public-facing entry point           |
| 2   | About                 | No                     | Club story, vision, mission, team   |
| 3   | Sign Up / Join        | No (creates account)   | Member registration form            |
| 4   | Login                 | No                     | Authentication page                 |
| 5   | Member Profile        | View: No / Edit: Yes   | Individual member identity page     |
| 6   | Community Leaderboard | No                     | Ranked member list                  |
| 7   | Events                | No / RSVP: Yes         | Upcoming and past events            |
| 8   | Learn                 | Tracks/Progress: Yes   | Courses, tracks, resources, quizzes |
| 9   | Projects Showcase     | View: No / Submit: Yes | Community-built project gallery     |
| 10  | Opportunities         | No                     | Hackathons, grants, jobs, programs  |
| 11  | Blog / Updates        | No                     | Recaps, tutorials, announcements    |
| 12  | Partners              | No                     | Partner and sponsor showcase        |
| 13  | Admin Dashboard       | Yes (Admin only)       | Full site management interface      |

---

### 3.2 Page-by-Page Requirements

---

#### PAGE 1: Home (Landing Page)

**Purpose:** First impression, community conversion, brand statement.

**Sections:**

**1. Navbar**

- Logo (left), Navigation links (center/right): About, Events, Learn, Projects, Opportunities, Blog
- CTA button: _Join the Club_
- Sticky on scroll

**2. Hero Section**

- Full-width, dark gradient background matching brand
- Club logo + headline (e.g., _"FUTMinna's Home for Web3 Builders"_)
- Subheadline: short mission statement
- Two CTAs: _Join the Community_ (→ Sign Up page) and _Explore Courses_ (→ Learn page)
- Subtle animated background (grid lines, floating nodes, or particle effect)

**3. Stats Bar**

- Animated counters: Total Members, Events Held, Projects Built, Ecosystems Covered
- Updates dynamically from database

**4. About Strip**

- 2–3 sentence club summary
- Three icon-cards: Education | Build | Opportunity
- Link: _Learn More About Us_ (→ About page)

**5. Featured Learning Tracks**

- 3–4 horizontal cards: EVM/Solidity, Sui/Move, Solana/Rust, Aptos/Move
- Each shows: track name, ecosystem icon, number of modules, difficulty badge
- CTA: _Start Learning_ (→ Learn page)

**6. Upcoming Events**

- 2–3 event preview cards: event name, date, type tag, RSVP button
- Link: _View All Events_

**7. Community Projects**

- 3 featured project cards: project name, builder(s), stack/ecosystem, short description
- Link: _View All Projects_

**8. Partnered Communities Slider**

- Auto-scrolling logo carousel of partner communities and ecosystems
- Logos link to partner pages

**9. Join CTA Banner**

- Full-width bold section: headline, supporting text, _Join Now_ button → Sign Up page

**10. Footer**

- Logo, nav links, social links (X/Twitter, Telegram, WhatsApp, GitHub), contact email, copyright

---

#### PAGE 2: About Page

**Purpose:** Deeper club context for prospects, sponsors, partners.

**Sections:**

- Problem Statement (3 key pain points)
- Vision & Mission (side by side)
- Our Story (founding narrative, short paragraph)
- What Makes Us Different (multi-ecosystem, build-in-public, Nigerian context)
- Meet the Team — 6 cards: photo, full name, nickname, role
- Join CTA

---

#### PAGE 3: Sign Up / Join Page

**Purpose:** Member registration and account creation.

**Form Fields:**

- Full Name _(required)_
- Email Address _(required)_
- Password + Confirm Password _(required)_
- Date of Birth _(required)_
- Department _(required, text or dropdown)_
- Level _(required — 100 / 200 / 300 / 400 / 500 / 600)_
- Skills _(multi-select: Solidity, Move, Rust, JavaScript, Python, Frontend Dev, UI/UX Design, Content Writing, Marketing, Community Management, Research, Other)_
- Experience Level _(required — Beginner / Intermediate / Advanced)_
- Fun Fact _(optional, text)_
- X (Twitter) Profile Link _(optional)_
- GitHub Profile Link _(optional)_
- Portfolio/Website Link _(optional)_

**Behaviour:**

- Form validation on all required fields
- On submit: account created → confirmation email sent → user redirected to their profile page
- Admin receives notification of new member registration

---

#### PAGE 4: Login Page

**Purpose:** Returning member authentication.

**Fields:** Email + Password
**Features:** Forgot Password link, redirect to Sign Up if no account

---

#### PAGE 5: Member Profile Page

**Purpose:** Each member's Web3 identity within the club.

**Public View (visible to all):**

- Profile photo / avatar
- Full name, nickname, department, level
- Skills tags
- Bio / Fun Fact
- Links: X, GitHub, Portfolio
- Leaderboard rank + badge
- Projects contributed to
- Events attended
- Courses/tracks completed (with completion badges)

**Private View (member editing own profile):**

- Edit all fields
- Upload profile photo
- View own activity history

---

#### PAGE 6: Community Leaderboard Page

**Purpose:** Gamify participation and publicly reward active members.

**Content:**

- Ranked table: Rank, Avatar, Name, Department, Points, Badges
- Top 3 highlighted with podium treatment
- Filter by: All Time | This Month | This Week
- Filter by Track: All | EVM | Sui | Solana | Aptos
- Category Badges displayed on cards: Top Builder, Top Learner, Most Active, Event Champion
- Each member row links to their profile
- Points methodology note: _"Rating methodology — coming soon"_

---

#### PAGE 7: Events Page

**Purpose:** Central hub for all club events.

**Sections:**

**Upcoming Events:**

- Cards: Event name, date & time, type tag (Workshop / Hackathon / Talk / Bootcamp / Social), short description, location (physical address or virtual link), RSVP / Register button
- RSVP requires login; logs attendance against member profile

**Past Events:**

- Grid: Event name, date, type, recap summary, photo gallery link or attached resources
- Filter by type and year

**Event Detail View (per event):**

- Full description
- Speakers / facilitators
- Date, time, location
- Resources shared post-event (slides, recordings, links)
- Attendee count

---

#### PAGE 8: Learn Page

**Purpose:** The club's structured educational platform.

**Sections:**

**Learning Tracks:**

- Track cards: EVM/Solidity, Sui/Move, Aptos/Move, Solana/Rust
- Each track card shows: ecosystem icon, total modules, estimated hours, difficulty, enrolled members count
- Clicking opens the track detail page:
  - Module list with locked/unlocked states
  - Each module: title, description, content (text/video/external links), quiz at end
  - Progress bar (for logged-in users)
  - Completion badge awarded on finishing all modules

**Resources Library:**

- Curated link cards: title, type (Article / Video / Docs / Tool), ecosystem tag, external link
- Filterable by ecosystem and resource type
- Admins can add/remove resources from dashboard

**Quizzes:**

- Per-module quizzes (multiple choice)
- Score displayed on completion
- Passing score awards points toward leaderboard
- Results saved to member profile

**Certifications:**

- On completing a full track, member receives a certificate
- Certificate displayed on member profile
- Future: on-chain certificate (NFT/SBT) — flagged as Phase 2 feature

---

#### PAGE 9: Projects Showcase Page

**Purpose:** Display projects built by community members.

**Content:**

- Project cards: name, builder(s) with profile links, ecosystem/stack tags, short description, GitHub link, live demo link (if available)
- Featured Project spotlight at top (admin-selected)
- Filter by: Ecosystem | Hackathon | Solo/Team
- Submit a Project button (logged-in members only)

**Submit Project Form:**

- Project Name
- Description
- Team members (tag from member list)
- Ecosystem / Stack (multi-select)
- GitHub URL
- Live Demo URL (optional)
- Hackathon (optional — link to event)
- Cover image upload

---

#### PAGE 10: Opportunities Page

**Purpose:** Single discovery page for Web3 opportunities relevant to students.

**Sections:**

**Hackathons:**

- Cards: name, organizer, prize pool, ecosystems, deadline, registration link, status tag (Open / Closing Soon / Closed)

**Grants & Bounties:**

- Cards: program name, ecosystem/organization, amount/range, deadline, apply link

**Jobs & Internships:**

- Cards: role title, company, type (Full-time / Part-time / Internship / Remote), ecosystem, apply link, deadline

**Programs:**

- Cards: program name, org, type (Ambassador / Fellowship / Developer Program), deadline, apply link

**All cards have:** ecosystem tag, deadline badge (with urgency color — green/yellow/red), external link

---

#### PAGE 11: Blog / Updates Page

**Purpose:** Club content hub — announcements, recaps, tutorials, thought pieces.

**Sections:**

- Featured post (large card at top)
- Post grid with category filter: Announcement | Event Recap | Tutorial | Ecosystem Deep-dive | Build in Public
- Each post: title, author (with profile link), date, category tag, cover image, excerpt, read more link
- Individual post view: full content (Markdown rendered), author card, related posts

---

#### PAGE 12: Partners Page

**Purpose:** Showcase credibility, attract new partnerships.

**Content:**

- Partner logo grid with names and short descriptions
- Categories: Ecosystem Partners | Community Partners | Sponsors
- "Partner With Us" section — brief pitch + contact CTA

---

#### PAGE 13: Admin Dashboard

**Purpose:** Full site management interface for the core team. No code required.

**Access:** Admin-role accounts only (assigned by super-admin)

**Modules:**

| Module        | Capabilities                                                                                    |
| ------------- | ----------------------------------------------------------------------------------------------- |
| Members       | View all members, approve/reject registrations, edit profiles, assign roles, ban/remove members |
| Events        | Create, edit, delete events; view RSVPs per event; mark attendance; upload post-event resources |
| Learn         | Create/edit/delete tracks, modules, and quizzes; manage resource library; issue certifications  |
| Projects      | Approve/reject submitted projects; feature/unfeature projects; edit or remove listings          |
| Opportunities | Add, edit, archive hackathon/grant/job/program listings                                         |
| Blog          | Create, edit, publish, unpublish posts; manage categories                                       |
| Partners      | Add, edit, remove partner/sponsor entries and logos                                             |
| Leaderboard   | View points breakdown per member; manually adjust points if needed; manage badge assignments    |
| Analytics     | Site traffic overview, member growth, event RSVPs, course completions, active users             |
| Settings      | Site-wide settings: club name, contact email, social links, featured stats, maintenance mode    |

---

## 4. Authentication & Roles

| Role        | Description                | Access                                                      |
| ----------- | -------------------------- | ----------------------------------------------------------- |
| Guest       | Unauthenticated visitor    | Public pages only                                           |
| Member      | Registered club member     | Public pages + profile, RSVP, submit projects, take courses |
| Admin       | Core team member           | All of the above + Admin Dashboard                          |
| Super Admin | Club Lead / Technical Lead | All of the above + role management, super settings          |

**Auth Method:** Email + Password (JWT-based sessions). Future: wallet-connect login (Phase 2).

---

## 5. Non-Functional Requirements

| Requirement       | Specification                                                                |
| ----------------- | ---------------------------------------------------------------------------- |
| Performance       | Page load < 3s on average Nigerian mobile connection (3G/4G)                 |
| Responsiveness    | Fully mobile-responsive across all pages                                     |
| Accessibility     | WCAG 2.1 AA compliance where feasible                                        |
| SEO               | Meta tags, OG images, and structured data on all public pages                |
| Security          | Password hashing (bcrypt), HTTPS, protected admin routes, input sanitization |
| Scalability       | Architecture should support 1,000+ members without re-engineering            |
| Offline Tolerance | Key public pages should degrade gracefully with poor connectivity            |

---

## 6. Out of Scope (Phase 1)

- On-chain / NFT certificates (Phase 2)
- Wallet connect login (Phase 2)
- Internal messaging / DMs between members (Phase 2)
- Mobile app (Phase 3)
- DAO governance features (Phase 3)
- Live video / streaming for events (Phase 2)

---

## 7. Assumptions & Constraints

- Platform is web-only for Phase 1
- Content (events, courses, projects, opportunities) will be manually managed by admins at launch
- The club has no paid hosting budget initially — deployment should target free/low-cost infrastructure (Vercel, Railway, Supabase, etc.)
- Internet access on campus is inconsistent — performance optimization is critical
- All members are FUTMinna students (no external membership in Phase 1)

---

## 8. Dependencies

- Authentication service (e.g., Supabase Auth or custom JWT)
- Database (e.g., Supabase PostgreSQL or PlanetScale)
- File storage for profile photos, project images, event media (e.g., Supabase Storage or Cloudinary)
- Email service for registration confirmation and notifications (e.g., Resend or Brevo)
- Deployment: Frontend on Vercel, Backend on Railway or Render

---

_End of PRD v1.0_
