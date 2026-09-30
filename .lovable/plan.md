## Scope

Bring the Blockchain Club FUTMINNA site to life — all pages from your sitemap, both themes with a toggle, design system locked to `DESIGN.md` (Onchain Generation), and a real backend powering auth, member profiles, leaderboard, projects, and events.

## Phase 1 — Foundation

1. **Design system** in `src/styles.css`
   - Port every color token from `DESIGN.md` to OKLCH for both `:root` (dark, the default per DESIGN.md) and a light variant derived from the Light screenshots (white surfaces, indigo `#4f46e5`-ish primary).
   - Load **Montserrat** (400/500/700/800) via `<link>` in `__root.tsx`; register `--font-display` and `--font-body` in `@theme`.
   - Radius scale + spacing scale from DESIGN.md.
   - Typography utility classes (`display-lg`, `headline-lg`, `body-md`, `label-bold`, etc.).
2. **Theme toggle** — class-based dark mode (`.dark` on `<html>`), `localStorage` persistence, defaults to dark to match the brand. Toggle lives in the header.
3. **Shared layout** — sticky top nav (Logo, Explore/Home, Leaderboard, Learn, Projects, Events, Opportunities, theme toggle, Join the Club CTA, profile avatar when signed in) + footer (BCF logo, Community/Resources/Legal columns, socials).

## Phase 2 — Backend (Lovable Cloud)

Enable Lovable Cloud and provision:

- **Auth**: Email/password + Google (sign up → onboarding form → profile created).
- **Tables** (all with RLS + grants):
  - `profiles` (id → auth.users, full_name, nickname, dob, department, level, bio, fun_fact, avatar_url, x_url, github_url, portfolio_url, role_title, xp default 0, created_at)
  - `skills` lookup + `profile_skills` join (Solidity, Move, Rust, Frontend, Design, Marketing, Research…)
  - `projects` (title, slug, summary, description, ecosystem, status [live/testnet/ideation], cover_url, repo_url, demo_url, owner_id, featured bool)
  - `project_contributors` (project_id, profile_id)
  - `events` (title, description, type [workshop/hackathon/talk/bootcamp], starts_at, location, mode [physical/virtual], cover_url, register_url)
  - `learning_tracks` (name, ecosystem, difficulty, modules_count, description, icon)
  - `resources` (title, type [doc/video/tutorial], track_id, url)
  - `opportunities` (title, kind [hackathon/grant/bounty/job/program], source, deadline, prize_pool, ecosystem, url, description)
  - `partners` (name, blurb, logo_url, url)
  - `xp_events` (profile_id, source, points, created_at) — drives leaderboard
- **Trigger**: auto-create `profiles` row on `auth.users` insert.
- **Roles**: separate `app_role` enum + `user_roles` table + `has_role()` security-definer fn (admin gate for submitting/approving projects, posting events, etc.).
- Seed a small amount of demo content so every page renders meaningfully on first load.

## Phase 3 — Pages

1. **Home (`/`)** — Hero ("FUTMinna's Home for Web3 Builders"), Join Community + Explore Learn CTAs, stats bar (members, projects, bounties, partners), Rooted in Research panel with image + bullets, Core Pillars (Education/Hackathons/Community/Industry Exposure), Upcoming Deployments (events), Shipped Protocols (featured projects), Learning Tracks preview, Partner logo strip, Ready-to-Build CTA card.
2. **About (`/about`)** — "Architecting the Future of Web3 in Nigeria", Challenge bullets + chip image, Vision/Mission cards, Our Story timeline (2022/2023/2024), What Makes Us Different (3 cols), Lead Builders grid (6), Ready-to-join CTA.
3. **Sign Up (`/join`)** — Multi-step form: account (email/password or Google) → profile (name, DOB, department, level 100–600, skills multi-select, experience, fun fact, X/GitHub/portfolio). Post-submit redirects to profile.
4. **Auth (`/auth`)** — Sign in / sign up tabs with Google.
5. **Profile (`/profile/$slug` public, `/_authenticated/me` own)** — Avatar, name + level badge, bio, skill chips, contribution graph (grid heatmap from `xp_events`), Mastery Timeline (recent contributions/awards), rank card, projects led, club tokens. Sidebar nav (Dashboard, Profile, Learning, Projects, Bounties) on own profile.
6. **Leaderboard (`/leaderboard`)** — Top-3 podium, full ranking table with All Time/Monthly/Weekly tabs, "you" row highlight, Leaderboard Rewards + Total XP + Active Builders summary cards.
7. **Learn (`/learn`)** — Education Hub hero, Learning Tracks grid (EVM/Sui/Aptos/Solana), Resource Library tabs (All/Docs/Video/Tutorials), Weekly Quiz card, On-chain Certification panel with 4 badge tiles, Ready-to-Buidl CTA.
8. **Projects (`/projects`)** — Featured project banner, registry grid with All/EVM/Solana/Starknet filter chips, "Submit a Project" button (auth-gated), project detail route `/projects/$slug`.
9. **Events (`/events`)** — Upcoming list (cards w/ register), past events grid, event detail `/events/$slug`.
10. **Opportunities (`/opportunities`)** — Live Hackathons featured card + side card, Open Grants list, Ecosystem Jobs table.
11. **Blog (`/blog`)** — Featured post + grid with category tags. (Markdown-stored `posts` table.)
12. **Partners (`/partners`)** — Logo grid + blurbs + "Partner with us" CTA.

Plus `sitemap.xml`, `robots.txt`, per-route SEO `head()` with route-specific titles/descriptions/OG.

## Technical notes

- TanStack Start file-based routes; protected pages (own profile, submit project) under `src/routes/_authenticated/`.
- Public reads (leaderboard, projects, events) via `createServerFn` + admin client with safe column projection — keeps RLS tight while letting unauthenticated visitors browse.
- Server functions colocated as `src/lib/*.functions.ts`; never imported from public-route loaders that would 401 during prerender.
- Contribution graph: aggregate `xp_events` by day in a server fn, render with CSS grid (no chart lib needed).
- Theme toggle uses a tiny client-only script in `__root.tsx` head to avoid FOUC.

## Build order

1. Design system + theme toggle + shared shell (header/footer) + Home page — verifiable end-to-end immediately.
2. About, Learn, Opportunities, Partners, Blog (mostly static, fast).
3. Enable Lovable Cloud + schema + seed.
4. Auth + Join + Profile + Leaderboard + Projects + Events (data-driven).
5. SEO files + per-page meta polish.

I'll ship in that order and check in after Phase 1 so you can sanity-check the look before I wire the backend. Reply **approve** to start, or tell me what to cut/add.
