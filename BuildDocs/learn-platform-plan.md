# Blockchain Club FUTMinna — Learn Platform Master Plan

Version 2.0 | June 2026

---

## 0. What We're Building

A **cohort-based education pipeline** adapted from the Technical Education Pipeline PDF, applied across **6 learning tracks** on the BlockchainClub FUTMinna web platform.

The platform transforms curious students into production-ready Web3 professionals through an aggressive, hands-on Build-to-Learn curriculum spanning all major blockchain ecosystems and professional disciplines.

---

## 1. The 6 Tracks — Full Detail

### Track 1: Technical (Solidity, Move, Rust)

The original PDF track. Students learn to build, test, and deploy smart contracts.

**Phase 0 — Professional Culture**

- Git & GitHub workflow: fork, clone, branch, PR, merge
- Command line proficiency: navigation, scripts, env vars, error streams
- OpSec & wallet safety: private keys, seed phrases, .env files, testnet hygiene
- Build-in-Public DEVLOG habit: weekly markdown log (start Week 2)
- Engineering culture: meaningful commits, clear READMEs, systematic debugging

**Phase 1 — Engineering Foundation**

- SWE Basics: Git deep-dive, CLI, package management, testing & debugging
- Blockchain Architecture: cryptography layer, P2P network, mempool, state machine, consensus (PoW vs PoS)
- Ecosystem Mapping: EVM (Solidity), MoveVM (Sui/Aptos), SVM (Solana), Bitcoin Script
- Monolithic vs Modular architectures, L1 vs L2 scaling (Optimistic vs ZK-Rollups)
- Reading Unfamiliar Code: navigating repos, reading contracts, identifying red flags
- **Gate 1 exit:** PR merged + CLI quiz 70%+ + 3 DEVLOG entries

**Phase 2 — Smart Contract Core**

- Solidity & EVM (2 weeks): state variables, access control, gas optimization, Hardhat/Foundry, ERC-20 with governance
- Move — Sui & Aptos (2 weeks): object model, resource-oriented programming, Sui objects, NFT module
- Rust & Solana (2 weeks): ownership/borrowing, accounts/instructions, Anchor framework, counter program
- Full-Stack Integration (shared, runs alongside): RPC nodes, IPFS/Arweave, The Graph indexing, ethers.js/viem/Sui SDK
- **Gate 2 exit:** dApp deployed + 5 passing tests + PR merged

**Phase 3 — Specialisation (pick one)**

- **Track 3A: Security Auditor** — reentrancy, flash loans, fuzzing/invariant testing, Slither/Mythril, MEV mechanics, Immunefi bug bounties
- **Track 3B: Protocol Developer** — EVM internals (opcodes, storage slots), MoveVM/SVM internals, ZK proofs (Circom/Noir), MEV-Boost/Flashbots
- **Track 3C: Full-Stack dApp Developer** — Account Abstraction (ERC-4337), Paymasters, session keys, social recovery, custom Subgraphs, viem/wagmi/Biconomy
- **Gate 3 exit:** Capstone project + demo presentation

**Capstone** — 48hr internal hackathon. Teams of 2-3. Real localized problems (student voting portal, funding tracker, credential system). Working prototype on testnet.

---

### Track 2: Design

Web3 designers. Visual and UX skills for decentralized applications.

**Phase 0 — Professional Culture**

- Tool stack: Figma, Penpot, design file management, naming conventions
- Weekly design log ("DESIGNLOG")
- OpSec: never embed keys in screenshots, protect client assets

**Phase 1 — Foundations**

- UX principles for Web3: transaction flows, confirmation states, error recovery
- Wallet UX patterns: connect, sign, approve — what users actually see
- Blockchain mental models for designers: accounts, gas, blocks (no code)
- Color theory and accessibility for dark-mode dApps
- Design systems: components, tokens, variants
- Hands-on: redesign a bad Web3 onboarding flow

**Phase 2 — Core**

- dApp UI design: DEX interfaces, NFT marketplaces, DAO dashboards
- Wallet design: extension popups, mobile wallet screens
- Transaction visualization: making gas fees and confirmations human-readable
- NFT visual design: generative art basics, metadata standards, IPFS hosting
- Responsive design for dApps (mobile-first, wallet-aware layouts)
- Hands-on: full dApp design prototype in Figma (10+ screens)

**Phase 3 — Specialisation (pick one)**

- **Track 3A: NFT & Brand Design** — generative collections, DAO branding, metaverse assets
- **Track 3B: Protocol UX** — complex DeFi flows, cross-chain UX, bridge interfaces
- **Track 3C: Design Engineering** — HTML/CSS/React basics, component libraries, design-to-code

**Capstone** — Design sprint: full product design for a club project. Deliverables: Figma prototype + design system + presentation.

---

### Track 3: Marketing

Web3 marketers. Growth, community, and narrative in crypto.

**Phase 0 — Professional Culture**

- Tool stack: Dune, Nansen, Typefully, Hypefury, Notion
- Weekly growth log ("GROWTHLOG")
- OpSec: 2FA on all accounts, phishing awareness, admin key management

**Phase 1 — Foundations**

- Web3 marketing vs Web2: community ownership, token incentives, anonymity
- Blockchain marketing landscape: L1s, L2s, DeFi, NFTs, DAOs
- Narrative design: scarcity, novelty, controversy, identity
- Memetics 101: meme lifecycle, when to meme, how memes drive adoption
- Analytics fundamentals: on-chain (TVL, volume, users) vs off-chain (impressions, CTR, sentiment)
- Hands-on: analyze a successful Web3 launch campaign — write a teardown

**Phase 2 — Core**

- Token launch marketing: pre-launch, fair launch, airdrop strategies
- Airdrop design: eligibility, sybil resistance, claim UX, post-claim retention
- Community building via marketing: turning followers into contributors
- Content strategy: threads, spaces, AMAs, newsletters
- KOL/influencer strategy: authentic voices, deal negotiation, ROI measurement
- Hands-on: campaign sprint — pitch deck + content calendar + 5 sample posts

**Phase 3 — Specialisation (pick one)**

- **Track 3A: Growth Hacking** — viral loops, referral mechanics, quest platforms (Galxe, Layer3)
- **Track 3B: Institutional Marketing** — B2B Web3, developer relations, enterprise blockchain
- **Track 3C: DAO Marketing** — governance proposal marketing, treasury comms, voting campaigns

**Capstone** — Campaign sprint: full GTM plan for a club product. Deliverables: positioning doc, 30-day calendar, 10 sample pieces, analytics dashboard, 5-min pitch.

---

### Track 4: Community Management

The people layer. Running Web3 communities at scale.

**Phase 0 — Professional Culture**

- Tool stack: Discord (bots, roles, channels), Telegram, Guild.xyz (token-gating)
- Moderation philosophy: warn, mute, kick, ban consistency
- Weekly community log ("COMMLOG")
- OpSec: admin key management, scam detection patterns, personal boundaries

**Phase 1 — Foundations**

- Community architecture: open vs gated, broadcast vs discussion, sync vs async
- Member lifecycle: lurker → contributor → superfan → ambassador → mod
- Web3 community economics: token behavior, airdrop farmers vs genuine members
- Discord/Telegram deep dive: channel structure, role hierarchies, welcome flows
- Conflict resolution: FUD, scams, member disputes, cultural clashes
- Hands-on: design a community structure for a hypothetical DeFi protocol

**Phase 2 — Core**

- Ambassador programs: recruitment, training, incentive design, performance tracking
- DAO governance facilitation: proposal discussions, temperature checks, vote coordination
- Event production: AMAs, community calls, game nights, meme contests
- Bot operations: auto-mod, welcome bots, ticket systems, level-up systems
- Crisis management: exploit announcements, PR incidents — what to say and when
- Hands-on: run a simulated community event (plan, execute, post-mortem)

**Phase 3 — Specialisation (pick one)**

- **Track 4A: DAO Operations** — governance tooling (Snapshot, Tally), delegation, multi-sig treasury
- **Track 4B: Developer Community** — devrel basics, hackathon community building, technical support triage
- **Track 4C: Global Communities** — multi-language, multi-timezone, cultural adaptation, regional ambassadors

**Capstone** — Community sprint: complete playbook for the club. Deliverables: Discord/TG proposal, ambassador program design, 3-month event calendar, crisis comms template, moderation handbook.

---

### Track 5: Content Creation

Web3 writers, video makers, and explainers.

**Phase 0 — Professional Culture**

- Tool stack: Markdown, Git for writers, CMS (Hashnode, Mirror)
- Editorial workflow: draft → review → publish → promote
- Weekly content log ("CONTENTLOG")
- OpSec: never embed keys in screenshots, protect sources, attribution ethics

**Phase 1 — Foundations**

- Technical writing fundamentals: clarity, structure, audience awareness
- Web3 content formats: threads, long-form, documentation, whitepapers, video scripts
- Blockchain concepts for writers: explaining gas, consensus, wallets without jargon
- Research methods: reading whitepapers, auditing sources, verifying on-chain data
- SEO for crypto content: keyword intent, backlinks, Web3 niches
- Hands-on: write a 10-tweet thread explaining a complex Web3 concept to a beginner

**Phase 2 — Core**

- Long-form content: 2,000+ word deep dives, protocol explanations, case studies
- Documentation writing: API references, developer guides, SDK docs — structure and conventions
- Video scripting: storyboarding, visual metaphors for abstract concepts
- Mirror.xyz publishing: NFT-gated content, crowdfund essays, revenue splits
- Content repurposing: one piece → thread, newsletter, video, podcast, infographic
- Hands-on: publish a long-form piece on Mirror.xyz

**Phase 3 — Specialisation (pick one)**

- **Track 5A: Developer Documentation** — API docs, SDK guides, auto-generated docs (Docusaurus, GitBook)
- **Track 5B: Narrative & Journalism** — crypto investigative pieces, protocol deep dives, industry analysis
- **Track 5C: Multimedia Content** — YouTube explainers, TikTok crypto, podcast production, infographics

**Capstone** — Content sprint: 3 pieces across formats about the club. Deliverables: 1 long-form Mirror post, 1 video script + storyboard, 1 thread series (5+ tweets), content calendar.

---

### Track 6: Research

Analysts and deep thinkers. Understanding why protocols work.

**Phase 0 — Professional Culture**

- Tool stack: Dune Analytics, Nansen, Token Terminal, DefiLlama, Messari
- Research methodology: hypothesis → data → analysis → conclusion → peer review
- Weekly research log ("RESEARCHLOG")
- OpSec: protect unpublished findings, embargo awareness, confidential data handling

**Phase 1 — Foundations**

- Blockchain data literacy: reading block explorers, interpreting transaction traces
- Protocol analysis framework: what does it do, how does it work, who controls it, what can break
- Tokenomics fundamentals: supply mechanics, emission schedules, vesting, governance weight
- Research methods: quantitative (on-chain queries) vs qualitative (documentation, sentiment)
- Academic rigour for crypto: structuring arguments, citing sources, acknowledging limitations
- Hands-on: write a 1-page protocol analysis using the 4-question framework

**Phase 2 — Core**

- Deep protocol analysis: architecture review, economic model stress-testing, security assumptions
- Governance research: proposal analysis, voter behavior, delegation dynamics, governance attacks
- MEV research: sandwich attacks, arbitrage, liquidation bots, PBS, MEV supply chain
- ZK and privacy research: ZK-SNARKs vs ZK-STARKs, privacy protocols, regulatory implications
- Cross-chain and interoperability: bridge architectures, message passing, security models, bridge trilemma
- Hands-on: produce a research report on MEV in a specific ecosystem

**Phase 3 — Specialisation (pick one)**

- **Track 6A: Protocol Researcher** — deep protocol reviews, economic audits, risk assessment reports
- **Track 6B: Data Analyst** — SQL/Dune dashboards, on-chain metrics, trend analysis, predictive modeling
- **Track 6C: Governance Researcher** — DAO analysis, proposal design, voter behavior, governance optimization

**Capstone** — Research sprint: substantive report. Deliverables: 3,000+ word report, Dune dashboard (5+ queries), methodology section, findings presentation (10 slides), peer-reviewed.

---

## 2. What Exists vs. Needs Building

### Already Built

| Feature                                        | Status                                      |
| ---------------------------------------------- | ------------------------------------------- |
| Learn listing page (`/learn`)                  | Done — ecosystem tabs, track cards          |
| 5 category sub-pages (design, marketing, etc.) | Done — auth-gated                           |
| Learn admin (`/admin/learn`)                   | Done — track + module CRUD, publish toggles |
| Leaderboard + points system                    | Done                                        |
| User profiles + DEVLOG potential               | Done (profiles with bio/skills)             |
| Auth + roles                                   | Done                                        |

### Needs Building — 11 Features

**HIGH PRIORITY (4)**

| #   | Feature                                                                                         | Files          | DB          |
| --- | ----------------------------------------------------------------------------------------------- | -------------- | ----------- |
| 1   | **Track Detail Page** `/learn/$slug` — phase timeline, module accordion, progress bar           | 1 new          | -           |
| 2   | **Module Content** — inline accordion on track page, Markdown rendering, "Mark Complete" button | embedded in #1 | -           |
| 3   | **Intake Assessment** `/intake` — 10-question quiz + practical task, auto-score, lane placement | 1 new          | 1 new table |
| 4   | **DEVLOG System** `/profile/devlog` + `/members/$id/devlog` — weekly entries, CRUD, public view | 2 new          | 1 new table |

**MEDIUM PRIORITY (3)**

| #   | Feature                                                                                   | Files       | DB          |
| --- | ----------------------------------------------------------------------------------------- | ----------- | ----------- |
| 5   | **Gate Check Dashboard** `/admin/gate-checks` — master grid, review modal, approve/reject | 1 new       | 1 new table |
| 6   | **Phase Progress Tracker** — visual pipeline per student on profile + track pages         | 1 component | -           |
| 7   | **GitHub PR Integration** — OAuth, PR tracking, auto-points, streak badge                 | 2 new       | 1 new table |

**LOW PRIORITY (4)**

| #   | Feature                                                                                 | Files              | DB          |
| --- | --------------------------------------------------------------------------------------- | ------------------ | ----------- |
| 8   | **SBT Certification** — Sui contract, admin issuance, PDF generation, profile display   | 1 admin + contract | 1 new table |
| 9   | **Hackathon Calendar** — admin adds competitions, student interest RSVP, team formation | modify existing    | add columns |
| 10  | **Cohort Management** `/admin/cohorts` + `/$id` — create, assign, progress grid, export | 2 new              | 1 new table |
| 11  | **Alumni Directory** `/alumni` — graduated members, roles, contact, filterable          | 1 new              | add columns |

---

## 3. Database Schema — All New Tables

```sql
-- Track registry (replaces current tracks table)
CREATE TABLE IF NOT EXISTS curriculum_tracks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  ecosystem text NOT NULL DEFAULT 'GENERAL',
  category text NOT NULL DEFAULT 'technical',
  phase_count integer DEFAULT 5,
  order_index integer DEFAULT 0,
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Module columns added to existing modules table
ALTER TABLE modules ADD COLUMN IF NOT EXISTS phase integer DEFAULT 1;
ALTER TABLE modules ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE modules ADD COLUMN IF NOT EXISTS ecosystem text DEFAULT 'GENERAL';
ALTER TABLE modules ADD COLUMN IF NOT EXISTS category text DEFAULT 'technical';

-- Lane placement results
CREATE TABLE IF NOT EXISTS intake_assessments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text REFERENCES users(id) UNIQUE,
  sw_score integer DEFAULT 0,
  blockchain_score integer DEFAULT 0,
  practical_completed boolean DEFAULT false,
  practical_url text,
  assigned_lane text DEFAULT 'foundation',
  completed_at timestamptz DEFAULT now()
);

-- Weekly student logs
CREATE TABLE IF NOT EXISTS devlog_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text REFERENCES users(id),
  week_number integer NOT NULL,
  content text NOT NULL,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_number)
);

-- Progression gates
CREATE TABLE IF NOT EXISTS gate_checks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text REFERENCES users(id),
  track_id uuid REFERENCES curriculum_tracks(id),
  gate integer NOT NULL,
  status text DEFAULT 'pending',
  reviewed_by text REFERENCES users(id),
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, track_id, gate)
);

-- Academic cohorts
CREATE TABLE IF NOT EXISTS cohorts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS cohort_id uuid REFERENCES cohorts(id);

-- On-chain SBT records
CREATE TABLE IF NOT EXISTS certifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text REFERENCES users(id),
  tier integer NOT NULL,
  track text,
  sbt_tx_hash text,
  pdf_url text,
  issued_at timestamptz DEFAULT now(),
  issued_by text REFERENCES users(id)
);

-- Sui blockchain integration columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sui_address text;
ALTER TABLE leaderboard_entries ADD COLUMN IF NOT EXISTS sui_entry_object_id text;
```

---

## 4. New Routes — 9 Pages

| #   | Route                       | File                           | Auth                               | Priority |
| --- | --------------------------- | ------------------------------ | ---------------------------------- | -------- |
| 1   | `/learn/$slug`              | `learn/$slug.tsx`              | View: public, Complete: login      | **High** |
| 2   | `/intake`                   | `intake.tsx`                   | Login required                     | **High** |
| 3   | `/profile/devlog`           | `profile/devlog.tsx`           | Login + ownership                  | **High** |
| 4   | `/members/$memberId/devlog` | `members/$memberId/devlog.tsx` | Public                             | **High** |
| 5   | `/admin/gate-checks`        | `admin/gate-checks.tsx`        | Admin only                         | Medium   |
| 6   | `/admin/cohorts`            | `admin/cohorts.tsx`            | Admin only                         | Low      |
| 7   | `/admin/cohorts/$id`        | `admin/cohorts/$id.tsx`        | Admin only                         | Low      |
| 8   | `/admin/certifications`     | `admin/certifications.tsx`     | Admin only                         | Low      |
| 9   | `/alumni`                   | `alumni.tsx`                   | Public                             | Low      |
| 10  | `/admin/students`           | `admin/students.tsx`           | Admin only                         | Medium   |
| 11  | `/admin/students/$userId`   | `admin/students/$userId.tsx`   | Admin only                         | Medium   |
| 12  | `/profile/progress`         | `profile/progress.tsx`         | Login required                     | Medium   |
| 13  | `/arena`                    | `arena.tsx`                    | Public (view), Login (create/join) | Medium   |
| 14  | `/arena/$challengeId`       | `arena/$challengeId.tsx`       | Public                             | Medium   |
| 15  | `/arena/create`             | `arena/create.tsx`             | Login required                     | Medium   |
| 16  | `/admin/challenges`         | `admin/challenges.tsx`         | Admin only                         | Low      |

---

## 5. Decision Log — Alignment Answers

| #   | Question                    | Decision                                                                                                             |
| --- | --------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 1   | Content management          | Admin-side editor for all tracks. Technical from PDF. Non-technical: AI-drafted for admin review                     |
| 2   | Active tracks first cohort  | Build the full 6-track system now. Content populated over time                                                       |
| 3   | Intake assessment           | Built-in web form (auto-scored)                                                                                      |
| 4   | Gate checks                 | Mixed — automated where possible (quiz, DEVLOG count, GitHub PR), manual where needed (code review, design critique) |
| 5   | DEVLOG visibility           | Public by default (build-in-public culture). Per-entry publish toggle for sensitive weeks                            |
| 6   | Timeline                    | Build everything working first → then launch cohort                                                                  |
| 7   | Cohorts                     | Manual admin assignment. Cohorts created per academic period                                                         |
| 8   | On-chain SBTs               | Build now — Sui Move, non-transferable objects                                                                       |
| 9   | MVP priority order          | Tracks → Modules → Intake → DEVLOG → Gates → Cohorts → SBTs → Alumni                                                 |
| 10  | Non-technical content       | Structure now (B), technical content from PDF (A), AI-draft non-technical for admin review (D)                       |
| 11  | Badges as NFTs              | Every badge (Top Builder, Event Champion, Pioneer, etc.) minted as non-transferable SBT on Sui                       |
| 12  | Student progress management | Admin dashboard with per-student drill-down: phases, modules, gates, DEVLOG, badges, points                          |
| 13  | Scalability architecture    | Supabase for reads (edge-cached), Sui for immutable truth, modular service boundaries, rate-limited APIs             |

---

## 6. Blockchain Integration — Sui Move Contract

### Two-Layer Data Model

```
┌──────────────┐     ┌───────────────┐
│   Supabase   │     │  Sui Contract │
│  (off-chain) │     │  (on-chain)   │
│              │     │               │
│  Fast reads  │     │  Immutable    │
│  All app data│     │  Points + SBT │
└──────┬───────┘     └───────┬───────┘
       │                     │
       └─────────┬───────────┘
                 ▼
          server.ts (API)
          Writes to BOTH
```

**Supabase handles everything.** Sui handles **three specific things**: points ledger, badge NFTs, and SBT certificates.

### What Goes On-Chain vs Off-Chain

| Data                                    | Supabase          | Sui                         |
| --------------------------------------- | ----------------- | --------------------------- |
| User profiles                           | ✅                | ❌                          |
| Module progress                         | ✅                | ❌                          |
| DEVLOG entries                          | ✅                | ❌                          |
| **Leaderboard points**                  | ✅ Fast read      | ✅ **Immutable record**     |
| **Badges (Top Builder, Pioneer, etc.)** | ✅ Fast display   | ✅ **Non-transferable NFT** |
| **Certificates (Tier 1/2/3)**           | ✅ PDF + metadata | ✅ **Non-transferable SBT** |
| Gate checks, cohorts                    | ✅                | ❌                          |

### Smart Contract (Sui Move)

```move
module blockchainclub::registry {
    // One per student — created on first point award
    struct LeaderboardEntry has key {
        id: UID, student: address,
        event_points: u64, learn_points: u64,
        build_points: u64, community_points: u64,
        total_points: u64, badge_count: u8
    }

    // Non-transferable certificate
    struct Certificate has key {
        id: UID, student: address,
        tier: u8, track: String,
        cohort_year: u16, portfolio_url: String
    }

    // Badge NFT — one per badge type per student (10 badge types)
    struct Badge has key {
        id: UID, student: address,
        badge_type: u8,     // 0=Pioneer, 1=FirstCommit, 2=TeamPlayer, etc.
        name: String,        // "Top Builder", "Event Champion"
        description: String, // "Outstanding contributions to projects"
        earned_at: u64       // epoch timestamp
    }

    // Admin-only capability
    struct AdminCap has key { id: UID }

    // Audit events
    struct PointsAwarded has copy, drop {
        student: address, category: u8,
        amount: u64, timestamp: u64
    }

    struct BadgeMinted has copy, drop {
        student: address, badge_type: u8,
        name: String, timestamp: u64
    }

    // Badge type constants
    const BADGE_PIONEER: u8 = 0;
    const BADGE_FIRST_COMMIT: u8 = 1;
    const BADGE_TEAM_PLAYER: u8 = 2;
    const BADGE_EVENT_CHAMPION: u8 = 3;
    const BADGE_TOP_BUILDER: u8 = 4;
    const BADGE_TOP_LEARNER: u8 = 5;
    const BADGE_MOST_ACTIVE: u8 = 6;
    const BADGE_COMMUNITY_STAR: u8 = 7;
    const BADGE_GOAL_SETTER: u8 = 8;
    const BADGE_STREAK_MASTER: u8 = 9;

    // Functions:
    // register_entry(student) — creates LeaderboardEntry
    // award_points(entry, category, amount) — updates points + emits PointsAwarded
    // mint_badge(student, badge_type, name, description) — mints Badge NFT + emits BadgeMinted
    // issue_certificate(student, tier, track, cohort, url) — mints Certificate SBT
}
```

### Platform Integration

- **server.ts** calls Sui RPC via `@mysten/sui` SDK
- Admin wallet private key stored in `.env`
- Students add Sui address to their profile during Phase 0
- Every `awardPoints()` call writes to Supabase + Sui (if student has wallet)
- Points visible on leaderboard from Supabase (fast). Sui is audit trail (immutable).

### Deployment

1. `sui move new contracts/club-registry`
2. Write contract → `sui move build` → `sui move test`
3. `sui client publish` → Sui Testnet
4. Store PackageID in `.env`
5. Deploy to Mainnet when cohort goes live

---

## 7. Sprint Execution Plan

### Sprint 1: Curriculum Foundation

**Goal:** Students can browse 6 tracks, view phases, read modules.

| Task                                                     | Files             | DB                  |
| -------------------------------------------------------- | ----------------- | ------------------- |
| Create `curriculum_tracks` table + ALTER modules         | SQL               | 1 table + 4 columns |
| Seed 6 tracks via admin (`/admin/learn`)                 | Admin UI          | 6 track rows        |
| Update `/learn` — phase bars on cards, link to `$slug`   | `learn/index.tsx` | -                   |
| Create `/learn/$slug` — track detail with phase timeline | `learn/$slug.tsx` | -                   |
| Module accordion — inline content + Markdown             | `$slug.tsx`       | -                   |
| "Mark Complete" button → `user_module_progress`          | `$slug.tsx`       | -                   |

### Sprint 2: Intake + DEVLOG

**Goal:** Lane placement. Weekly logging.

| Task                                                  | Files                          | DB       |
| ----------------------------------------------------- | ------------------------------ | -------- |
| Create `intake_assessments` + `devlog_entries` tables | SQL                            | 2 tables |
| Build `/intake` — quiz + practical + auto-score       | `intake.tsx`                   | -        |
| Build `/profile/devlog` — CRUD, week grid, streak     | `profile/devlog.tsx`           | -        |
| Build `/members/$id/devlog` — public view             | `members/$memberId/devlog.tsx` | -        |
| Auto-award +5 points per DEVLOG entry                 | auto-awards.ts                 | -        |

### Sprint 3: Gates + Cohorts

**Goal:** Admin tracks progression. Cohort management.

| Task                                                            | Files                   | DB                  |
| --------------------------------------------------------------- | ----------------------- | ------------------- |
| Create `gate_checks` + `cohorts` tables, add cohort_id to users | SQL                     | 2 tables + 1 column |
| Build `/admin/gate-checks` — master grid, review modal          | `admin/gate-checks.tsx` | -                   |
| Build `/admin/cohorts` + `/$id` — list, create, dashboard       | 2 files                 | -                   |
| Gate status display on profile + track pages                    | modify existing         | -                   |

### Sprint 4: Blockchain + SBTs + Alumni

**Goal:** On-chain certification. Alumni directory.

| Task                                                    | Files                      | DB      |
| ------------------------------------------------------- | -------------------------- | ------- |
| Create `certifications` table                           | SQL                        | 1 table |
| Write + deploy Sui Move contract                        | `contracts/sui/`           | -       |
| Build `/admin/certifications` — issue SBT, generate PDF | `admin/certifications.tsx` | -       |
| Build `/alumni` — Tier 3 graduate directory             | `alumni.tsx`               | -       |
| Wire SBT display on student profiles                    | modify profile             | -       |
| Add Sui RPC integration to server.ts                    | `lib/sui-client.ts`        | -       |

---

## 8. Student Progress Management

### Admin View: Per-Student Drill-Down

**Route:** `/admin/students/$userId` — comprehensive student profile for admins.

**What it shows (tabbed layout):**

**Tab 1: Overview**

- Student name, email, username, Sui address
- Assigned cohort + lane (Foundation/Fast)
- Current phase, current track
- Overall progress % across all modules
- Points breakdown (event, learn, build, community)

**Tab 2: Curriculum Progress**

- Per-track view: which tracks enrolled, phase progress per track
- Module completion grid: all modules × completion status
- Color-coded: grey = locked, yellow = in progress, green = completed
- Gate check statuses per track (Gate 1/2/3) with admin notes
- Admin actions: override gate status, manually mark modules complete

**Tab 3: DEVLOG**

- All DEVLOG entries in reverse chronological order
- Published/draft status per entry
- Streak counter, total entries
- Admin can view but not edit (student-owned content)

**Tab 4: Badges & Certificates**

- All earned badges (icon, name, date earned, on-chain status)
- All certificates issued (tier, track, SBT tx hash link)
- Admin actions: manually award badge, issue certificate

**Tab 5: Activity Log**

- Point award history (date, category, amount, reason)
- Login timestamps
- Module completion timestamps
- Gate check status changes

### Student View: My Progress

**Routes:**

- `/profile` — updated with progress tab
- `/profile/progress` — dedicated progress page

**What it shows:**

- Phase pipeline visual (5 phases, current phase highlighted)
- Modules completed / total in current phase
- Next module to complete
- Gate check status (pending → passed checkmark)
- Points earned this week
- DEVLOG streak badge
- Badges earned (with on-chain verification status)

### API Design for Progress Queries

All progress data is read from Supabase via aggregated queries:

```
GET /api/supabase/query/user_module_progress?filters={user_id: x}
GET /api/supabase/query/gate_checks?filters={user_id: x}
GET /api/supabase/query/devlog_entries?filters={user_id: x}
GET /api/supabase/query/leaderboard_entries?filters={user_id: x}&single=true
GET /api/supabase/query/user_badges?select=badges(*)&filters={user_id: x}
GET /api/supabase/query/certifications?filters={user_id: x}
```

A single aggregation endpoint combines all into one response for fast loading:

```
GET /api/supabase/student-progress?userId=x
→ { modules, gates, devlog, points, badges, certificates, cohort }
```

### Admin Student List

**Route:** `/admin/students` — searchable, filterable table of all students

- Columns: name, email, cohort, track, phase, progress %, gate status, points
- Filters: by cohort, by track, by phase, by gate status
- Search: by name, email, username
- Sort: by any column
- Click row → drill-down to `/admin/students/$userId`
- Export: CSV download of filtered view

---

## 9. Scalability Architecture

### Design Principles

| Principle                         | Implementation                                                                             |
| --------------------------------- | ------------------------------------------------------------------------------------------ |
| **Read-heavy, write-light**       | Supabase handles 99% of reads via PostgREST with automatic indexing                        |
| **On-chain writes are async**     | Sui RPC calls are fire-and-forget from the API. User doesn't wait for block confirmation   |
| **Edge caching for public pages** | Vercel's CDN caches SSR output. Static data (track listings, modules) served from edge     |
| **Rate limiting**                 | Already implemented via in-memory rate limiter on auth endpoints. Extend to all API routes |
| **Connection pooling**            | Supabase pooler handles DB connections. No per-request connection overhead                 |
| **Off-chain storage for media**   | Supabase Storage buckets with CDN delivery for images, PDFs                                |
| **Idempotent blockchain writes**  | Check on-chain state before writing to Sui. Skip if already awarded (prevent double-mint)  |

### Traffic Estimations & Capacity Planning

| Metric                 | Estimate (100 students) | Estimate (1,000 students) | Capacity                                        |
| ---------------------- | ----------------------- | ------------------------- | ----------------------------------------------- |
| Page views / day       | ~2,000                  | ~20,000                   | Vercel auto-scales                              |
| API calls / day        | ~10,000                 | ~100,000                  | Supabase free tier: unlimited API calls         |
| DB read queries / day  | ~50,000                 | ~500,000                  | PostgREST with row-level security, auto-indexed |
| DB write queries / day | ~500                    | ~5,000                    | Well within Supabase limits                     |
| Sui transactions / day | ~200                    | ~2,000                    | Sui testnet: free. Mainnet: ~$0.01/tx           |
| Storage (media + PDFs) | ~1 GB                   | ~10 GB                    | Supabase Storage: 1GB free, scales linearly     |

### Bottleneck Mitigation

**Bottleneck 1: Leaderboard queries**

- 50+ students × frequent polling = many reads
- **Fix:** Cache leaderboard in Supabase with a materialized view. Refresh every 5 minutes. Students see slightly stale data but page loads instantly.

**Bottleneck 2: On-chain writes during hackathons**

- 100 students submitting projects → 100 Sui transactions in 48 hours
- **Fix:** Batch Sui transactions where possible. Queue writes, process sequentially. Fire-and-forget — don't block the API response.

**Bottleneck 3: DEVLOG reads (public profiles)**

- External visitors viewing student DEVLOGs
- **Fix:** Vercel ISR (Incremental Static Regeneration) for public DEVLOG pages. Revalidate every hour.

**Bottleneck 4: Admin dashboard analytics**

- 14+ parallel count queries for dashboard stats
- **Already fixed:** parallel Promise.all() queries. Can further optimize with a nightly cron job that pre-computes stats into a `dashboard_cache` table.

### Component Architecture for Scale

```
┌──────────────────────────────────────────────────────┐
│                    CLIENT (React)                     │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐  │
│  │ Learn   │ │ Profile  │ │ Admin    │ │ Leader-  │  │
│  │ Pages   │ │ Pages    │ │ Pages    │ │ board    │  │
│  └────┬────┘ └────┬─────┘ └────┬─────┘ └────┬────┘  │
│       │           │            │             │       │
│       └───────────┴────────────┴─────────────┘       │
│                        │                             │
│                  API Layer (server.ts)                │
│     ┌──────────┬──────────┬──────────┬──────────┐    │
│     │ Auth     │ Supabase │  Sui RPC │ Rate     │    │
│     │ Routes   │ Proxy    │  Client  │ Limiter  │    │
│     └────┬─────┴────┬─────┴────┬─────┴────┬─────┘    │
│          │          │          │          │          │
│    ┌─────┴───┐ ┌───┴───┐ ┌───┴────┐     │          │
│    │ Supabase│ │ JWT   │ │ Sui    │     │          │
│    │ Auth    │ │ Utils │ │ Testnet│     │          │
│    └─────────┘ └───────┘ └────────┘     │          │
└──────────────────────────────────────────────────────┘
```

### Database Indexing Strategy

```sql
-- Speed up progress queries
CREATE INDEX IF NOT EXISTS idx_user_module_progress_user
  ON user_module_progress(user_id, module_id);

CREATE INDEX IF NOT EXISTS idx_gate_checks_user
  ON gate_checks(user_id, track_id);

CREATE INDEX IF NOT EXISTS idx_devlog_user_week
  ON devlog_entries(user_id, week_number);

CREATE INDEX IF NOT EXISTS idx_leaderboard_points
  ON leaderboard_entries(total_points DESC);

CREATE INDEX IF NOT EXISTS idx_modules_track_phase
  ON modules(track_id, phase);

-- Speed up admin student search
CREATE INDEX IF NOT EXISTS idx_profiles_fullname
  ON profiles(full_name);
CREATE INDEX IF NOT EXISTS idx_profiles_username
  ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_users_email
  ON users(email);
```

### Caching Strategy

| Layer          | What                                                     | TTL           |
| -------------- | -------------------------------------------------------- | ------------- |
| **Vercel CDN** | SSR output for public pages (learn, events, leaderboard) | 1 hour (ISR)  |
| **Supabase**   | Leaderboard materialized view                            | 5 min refresh |
| **Browser**    | React Query staleTime for track/module data              | 5 min         |
| **API**        | In-memory rate limiter counters                          | 15 min window |
| **No cache**   | User-specific data (progress, profile, DEVLOG)           | Real-time     |

---

## 10. Gamification System — THE CORE LOOP

The platform is a **game engine**. Every click, every module, every PR maps to a reward. Rewards unlock the next stage. This is not a side feature — it is the primary mechanism that drives student behavior.

### 10.0 The Core Game Loop

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  ACTION  │ ──► │  REWARD  │ ──► │  UNLOCK  │ ──► │ PROGRESS │
│          │     │          │     │          │     │          │
│ Complete │     │ +5 pts   │     │ Next     │     │ Phase %  │
│ module   │     │ learn    │     │ module   │     │ goes up  │
│          │     │ category │     │ opens    │     │          │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                                                     │
     └─────────────────────────────────────────────────────┘
                    Loop repeats for every action
```

**Rule:** No action is unrewarded. No progress is free. Every student's journey is a traceable chain of Action → Points → Unlock → Action.

### 10.1 The Action-Reward Map (Every Action = Points)

Every single action a student can take on the platform has a defined point value and category. This is the **complete map**.

| Action                                    | Category  | Points     | Unlocks                          |
| ----------------------------------------- | --------- | ---------- | -------------------------------- |
| Complete a module                         | learn     | +5         | Next module in phase             |
| Pass module quiz (80%+)                   | learn     | +3         | -                                |
| Complete final module in a phase          | learn     | +10 bonus  | Next phase (with gate check)     |
| Attend an event (RSVP + marked attended)  | event     | +5         | Event champion badge eligibility |
| Submit a project                          | build     | +5         | -                                |
| Project approved by admin                 | build     | +10        | Project appears on leaderboard   |
| Publish blog post                         | community | +5         | Blog goes live                   |
| Complete profile (all fields)             | community | +3         | Profile badge                    |
| Publish DEVLOG entry (weekly)             | community | +5         | Streak counter + streak badge    |
| Submit a PR (GitHub)                      | build     | +10        | PR streak + gate eligibility     |
| Review a peer's PR                        | community | +5         | -                                |
| Review a peer's design/code               | community | +3         | -                                |
| Pass Gate 1                               | learn     | +20        | Phase 2 unlocked                 |
| Pass Gate 2                               | build     | +30        | Phase 3 unlocked                 |
| Pass Gate 3 / Capstone                    | build     | +50        | Certificate eligible             |
| Place in a hackathon                      | build     | +50        | Hackathon badge                  |
| Help in WhatsApp community (bot-detected) | community | 1-5        | -                                |
| Mentor a peer (admin-logged)              | community | +15        | Mentor badge                     |
| Create a challenge                        | community | +5         | Challenge goes live              |
| Win a duel                                | build     | Pool (90%) | Duelist badge                    |
| Win an open challenge                     | build     | +30        | Challenge badge                  |
| Vote on a challenge                       | community | +1         | -                                |
| Join a squad                              | community | +2         | Squad access                     |
| Complete squad goal                       | community | +10        | Squad achievement                |
| Attend a pair programming session         | community | +5         | -                                |
| Maintain a 4-week streak                  | community | +5 bonus   | -                                |
| Maintain an 8-week streak                 | community | +10 bonus  | Streak Master badge              |
| Maintain a 12-week streak                 | community | +20 bonus  | -                                |
| Complete intake assessment                | learn     | +2         | Lane assignment                  |
| Add Sui wallet to profile                 | community | +3         | On-chain rewards enabled         |
| Get a PR merged (first time)              | build     | +15        | First Commit badge               |

**Total: 30+ actions mapped.** Every click counts.

### 10.2 The Unlock System — Gated Progression

Points don't just rank you on a leaderboard — they **unlock content**.

| What                 | Requirement                                         | Type         |
| -------------------- | --------------------------------------------------- | ------------ |
| Next module in phase | Previous module completed                           | Sequential   |
| Phase 1 content      | Gate 0 passed (intake + Phase 0 modules done)       | Gate         |
| Phase 2 content      | Gate 1 passed (PR + quiz 70% + 3 DEVLOG entries)    | Gate         |
| Phase 3 tracks       | Gate 2 passed (dApp deployed + 5 tests + PR merged) | Gate         |
| Capstone             | Gate 3 passed (all Phase 3 modules done)            | Gate         |
| Project submission   | Level 2 (50+ points)                                | Level        |
| Challenge creation   | Level 2 (50+ points)                                | Level        |
| Squad creation       | Level 1 (10+ points)                                | Level        |
| Mentor role          | Level 4 (300+ points) + Tier 3 certificate          | Level + Cert |
| Certificate Tier 1   | Gate 1 passed                                       | Gate         |
| Certificate Tier 2   | Gate 2 passed                                       | Gate         |
| Certificate Tier 3   | Capstone complete                                   | Gate         |

**Visual:** Each module, phase, and gate shows a lock/unlock state. Locked content shows a tooltip: "Complete X to unlock."

### 10.3 Real-Time Progress Display

Every student sees their live game state:

**Top Bar (persistent, site-wide):**

```
[@username]  Lvl 3 Builder  |  ⭐ 245 pts  |  🔥 4-wk streak  |  📝 6/12 modules  |  🏆 Phase 1
```

**Profile Page:**

```
┌─────────────────────────────────────┐
│  🏆 Level 3: Builder                │
│  ████████████░░░░░░  245/300 pts    │
│                                     │
│  📚 Current Phase: 2 — EVM Core     │
│  ████████░░░░  4/6 modules done     │
│  ✅ Gate 1 passed  |  ⏳ Gate 2     │
│                                     │
│  🎖 Badges (8/10 earned):           │
│  [Pioneer] [FirstCommit] [TopLearner]│
│  [StreakMaster] [EventChamp] ...    │
│                                     │
│  🔥 Streaks:                        │
│  PR: 4 wks  |  DEVLOG: 8 wks       │
│  Session: 3 wks                     │
│                                     │
│  🪙 Recent Activity:                │
│  +5  Module complete: ERC-20 Token  │
│  +10 PR merged: week-5-challenge    │
│  +5  DEVLOG published: Week 8       │
└─────────────────────────────────────┘
```

### 10.4 Point Economy (Enhanced)

| Action                                         | Category  | Points | Trigger                                                           |
| ---------------------------------------------- | --------- | ------ | ----------------------------------------------------------------- |
| Complete a module                              | learn     | +5     | `user_module_progress` insert → `awardPoints(userId, "learn", 5)` |
| Attend an event (RSVP + admin marks attended)  | event     | +5     | `/api/events/attend` → `awardEventPoints()`                       |
| Project approved by admin                      | build     | +10    | Admin clicks Approve → `awardProjectPoints()`                     |
| Blog post published                            | community | +5     | Admin clicks Publish → `awardPoints(userId, "community", 5)`      |
| Complete profile (all required fields)         | community | +3     | Profile save → check completeness → award                         |
| Publish DEVLOG entry                           | community | +5     | `devlog_entries` insert → `awardPoints(userId, "community", 5)`   |
| Submit a PR (GitHub integration)               | build     | +10    | GitHub webhook → verify → award                                   |
| Review a peer's PR                             | community | +5     | GitHub webhook → verify → award                                   |
| Pass Gate 1                                    | learn     | +20    | Admin approves gate → award                                       |
| Pass Gate 2                                    | build     | +30    | Admin approves gate → award                                       |
| Pass Gate 3 / Capstone                         | build     | +50    | Admin approves capstone → award                                   |
| Place in a hackathon                           | build     | +50    | Admin enters result → award                                       |
| Help in WhatsApp community (classified by bot) | community | 1-5    | Webhook → classify → award                                        |
| Mentor a peer (admin-assigned)                 | community | +15    | Admin logs mentoring session → award                              |

### 10.2 Point Flow (Supabase + Sui)

```
┌──────────────┐     ┌─────────────────┐     ┌──────────────┐
│   Trigger    │ ──► │  awardPoints()  │ ──► │  Supabase    │
│  (action)    │     │                 │     │  Instant UI  │
└──────────────┘     └────────┬────────┘     └──────────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │ checkAndAward-  │
                     │ Badges()        │
                     └────────┬────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
            ┌──────────────┐    ┌──────────────┐
            │  Supabase    │    │  Sui Contract │
            │  user_badges │    │  mint_badge() │
            │  (fast read) │    │  (immutable)  │
            └──────────────┘    └──────────────┘
```

Every point award:

1. Updates Supabase `leaderboard_entries` — instant leaderboard refresh
2. Calls `checkAndAwardBadges()` — checks thresholds
3. If eligible for a badge → inserts into Supabase `user_badges` + calls Sui `mint_badge()`

### 10.3 Badge System (10 Types)

| #   | Badge              | Criteria                          | Points Threshold              | Icon     |
| --- | ------------------ | --------------------------------- | ----------------------------- | -------- |
| 0   | **Pioneer**        | Registered when club ≤ 10 members | One-time, first 10 members    | Award    |
| 1   | **First Commit**   | Contributed to 1+ project         | 1 project_members row         | Star     |
| 2   | **Team Player**    | Contributed to 3+ projects        | 3 project_members rows        | Users    |
| 3   | **Event Champion** | Attended 5+ events                | 5 event_rsvps (attended=true) | Calendar |
| 4   | **Top Builder**    | 50+ build points                  | build_points ≥ 50             | Code     |
| 5   | **Top Learner**    | 50+ learn points                  | learn_points ≥ 50             | BookOpen |
| 6   | **Most Active**    | 100+ total points                 | total_points ≥ 100            | Zap      |
| 7   | **Community Star** | 30+ community points              | community_points ≥ 30         | Trophy   |
| 8   | **Goal Setter**    | Complete Phase 1                  | Pass Gate 1                   | Target   |
| 9   | **Streak Master**  | 4+ consecutive DEVLOG weeks       | 4 devlog_entries in a row     | Flame    |

**Badge Lifecycle:**

1. `checkAndAwardBadges()` runs after every `awardPoints()` call
2. Checks each badge's threshold against the student's current stats
3. If threshold met AND badge not already owned → `mint_badge()` on Sui
4. Sui contract emits `BadgeMinted` event (auditable, public)
5. Badge appears on profile, leaderboard, and as NFT in student's Sui wallet

**Duplicate protection:** `checkAndAwardBadges()` checks `user_badges` table before minting. Sui contract also rejects duplicate badge types per student.

### 10.4 Leaderboard

**Current state:** Public page with podium (top 3) + scrollable table (all entries). Time filters: All Time, This Month, This Week. Points display per category. Badge icons shown.

**No ecosystem filters** (removed — all students compete in one global leaderboard).

**Optional opt-in:** Students can toggle leaderboard visibility from their profile. Default: visible.

**On-chain verification:** Leaderboard shows a "Verified on Sui" badge on entries that have an on-chain record. Clicking opens SuiVision explorer to show the immutable points log.

### 10.5 Level System (Engagement Tiers)

| Level | Name       | Points Required | Perk                                                          |
| ----- | ---------- | --------------- | ------------------------------------------------------------- |
| 1     | Explorer   | 0               | Access to Phase 0-1 content                                   |
| 2     | Builder    | 50              | Access to Phase 2 content, project submission                 |
| 3     | Specialist | 150             | Access to Phase 3 tracks, mentor matching                     |
| 4     | Master     | 300             | Alumni status, "Track Lead" eligibility, certificate priority |
| 5     | Legend     | 500             | Featured on landing page, priority hackathon sponsorship      |

Levels unlock organically. No manual admin action needed — points determine level.

### 10.6 Streak System

**PR Streak:** Consecutive weeks with at least 1 PR submitted. Shown as "🔥 4-week PR streak" on profile.

**DEVLOG Streak:** Consecutive weeks with a published DEVLOG entry. Shown as "📝 8-week writing streak".

**Session Streak:** Consecutive weeks attending a session (RSVP + attendance marked). Shown as "🎓 6-week session streak".

**Streak bonuses:**

- 4-week streak → +5 bonus points
- 8-week streak → +10 bonus points
- 12-week streak → +20 bonus points + "Streak Master" badge eligibility

**Streak breaking:** Missing a week resets the streak to 0. Grace period: 1 missed week allowed per 8-week block.

### 10.7 Visual Progress Indicators

**On profile:**

- Level badge (Explorer → Legend)
- Points bar with next-level threshold
- Badge gallery (earned badges as icons, locked badges greyed out)
- Streak indicators

**On leaderboard:**

- Rank number
- Points with category breakdown (hover tooltip)
- Level badge next to name
- Badge icons (max 2 shown, "..." for more)

**On track detail page:**

- Phase progress pipeline (Phase 0-3 + Capstone)
- Completed modules / total per phase
- Points earned in this track
- Gate check status indicators

### 10.8 Gamification Database Extensions

```sql
-- Streak tracking
CREATE TABLE IF NOT EXISTS streaks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text REFERENCES users(id),
  streak_type text NOT NULL, -- 'pr', 'devlog', 'session'
  current_weeks integer DEFAULT 0,
  longest_weeks integer DEFAULT 0,
  last_week_number integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, streak_type)
);

-- Point audit log (for dispute resolution)
CREATE TABLE IF NOT EXISTS point_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text REFERENCES users(id),
  category text NOT NULL,     -- event, learn, build, community
  amount integer NOT NULL,
  reason text NOT NULL,       -- 'module_complete', 'event_attend', etc.
  reference_id text,          -- module_id, event_id, project_id
  sui_tx_hash text,           -- if written on-chain
  created_at timestamptz DEFAULT now()
);

-- Badge mint tracking (Sui integration)
CREATE TABLE IF NOT EXISTS badge_mints (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text REFERENCES users(id),
  badge_id text NOT NULL,
  sui_tx_hash text,
  minted_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Student level cache (computed from points, avoids recalc)
ALTER TABLE leaderboard_entries ADD COLUMN IF NOT EXISTS level integer DEFAULT 1;
ALTER TABLE leaderboard_entries ADD COLUMN IF NOT EXISTS current_streak integer DEFAULT 0;
ALTER TABLE leaderboard_entries ADD COLUMN IF NOT EXISTS longest_streak integer DEFAULT 0;
```

### 10.9 Gamification Engine Architecture

```
┌─────────────────────────────────────────────────┐
│              GAMIFICATION ENGINE                  │
│                                                   │
│  ┌─────────────┐   ┌──────────────┐              │
│  │ Point Rules │   │ Badge Rules  │              │
│  │  Engine     │   │  Engine      │              │
│  │             │   │              │              │
│  │ Category→   │   │ Threshold→   │              │
│  │ Points map  │   │ Badge map    │              │
│  └──────┬──────┘   └──────┬───────┘              │
│         │                 │                       │
│         └────────┬────────┘                       │
│                  ▼                                │
│         ┌────────────────┐                       │
│         │ awardPoints()  │  ──► Supabase         │
│         │                │  ──► Sui (if wallet)  │
│         └────────┬───────┘                       │
│                  │                                │
│                  ▼                                │
│         ┌───────────────────┐                    │
│         │ checkAndAward     │                    │
│         │ Badges()          │                    │
│         │                   │                    │
│         │ For each badge:   │                    │
│         │  already owned? → │ skip               │
│         │  threshold met? → │ mint on Sui + DB   │
│         │  not met? →       │ skip               │
│         └───────────────────┘                    │
│                                                   │
│  Triggers fire from:                              │
│  • Module complete (learn endpoint)               │
│  • Event attend (events attend endpoint)           │
│  • Project approve (admin project page)           │
│  • Blog publish (admin blog page)                 │
│  • DEVLOG create (devlog endpoint)                │
│  • WhatsApp webhook (community bot)               │
│  • Admin manual points (admin leaderboard)        │
└───────────────────────────────────────────────────┘
```

### 10.10 Anti-Abuse Mechanisms

| Mechanism                      | Implementation                                                                                                   |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| **Duplicate prevention**       | UNIQUE constraints on every points-granting action (user_id + module_id, user_id + event_id, user_id + badge_id) |
| **Rate limiting**              | Points awarded at most once per action. Cannot "complete" same module twice                                      |
| **Admin-only triggers**        | Project approval, blog publish, event attendance — all require SUPER_ADMIN/ADMIN role                            |
| **Sui double-mint protection** | Contract checks `Badge` exists before minting. Server checks `badge_mints` table                                 |
| **Streak validation**          | Streak calculated from actual data (DEVLOG entries, PRs) — not self-reported                                     |
| **Leaderboard opt-out**        | Privacy toggle for students who don't want public ranking                                                        |

---

## 11. Multiplayer & Collaboration

Beyond solo learning, the platform supports team-based features that mirror real Web3 development — where every project is built by squads, not individuals.

### 11.1 Study Squads

Small groups (3-5 students) that progress through a track together.

**Features:**

- Squad creation: any student can create a squad, invite members by username
- Squad dashboard: shared progress view — all members' module completion, gate status
- Squad chat: lightweight messaging within the squad page (no Discord dependency)
- Squad leaderboard: internal ranking by points within the squad
- Squad goals: set a target (e.g., "Complete Phase 1 together by Week 4")
- Squad achievements: unlock when all members pass a gate simultaneously

**Gamification:** Squad completion bonus: when all members pass a gate in the same week, each earns +10 bonus points.

### 11.2 Peer Code Review

Every student submission gets reviewed by another student before a track lead sees it.

**Flow:**

1. Student A submits a PR / design / content piece
2. Another student in the same track (Student B) is auto-assigned as reviewer
3. Student B reviews, leaves feedback (must include: 1 suggestion, 1 thing done well)
4. Track lead gives final approval
5. Student B earns +5 community points for reviewing

**Assignment:** Round-robin within the track. Priority to students who haven't reviewed recently.

**Dashboard:** "Pending Reviews" section on profile — shows what you need to review. "Awaiting Review" shows what you submitted.

### 11.3 Pair Programming Sessions

Live collaborative coding sessions within the platform.

**Features:**

- "Find a Partner" button: matches students at similar phase/progress
- Session timer: 30, 45, or 60-minute blocks
- Shared problem: both students work on the same challenge repo
- Post-session: each rates the session, logs what they built/learned
- Points: +5 community points per completed pair session

**Implementation:** Iframe embed of a shared Replit/CodeSandbox, or use the club's own web-based editor.

### 11.4 Hackathon Teams

Dedicated team management for internal and external hackathons.

**Features:**

- Team creation: captain creates team, sets team name, invites members (2-4 total)
- Team profile: name, members, project repo, demo link, status
- Role assignment: captain, dev, designer, presenter
- Hackathon registration: team applies to a hackathon (internal or external)
- Post-hackathon: submit project, earn +50 points per member
- Team history: all past hackathons, projects, awards

**Admin:** Approve teams. Assign mentors. Track external hackathon results.

### 11.5 Multi-Track Collaboration

Cross-track project teams — technical, design, marketing, and content students collaborate.

**Example:** A DeFi project team has:

- 2 Technical students (smart contracts, frontend)
- 1 Design student (UI/UX, branding)
- 1 Marketing student (GTM strategy, pitch deck)
- 1 Content student (documentation, demo video script)

This mirrors real Web3 teams and makes the club's cross-disciplinary nature an asset.

**Features:**

- "Looking for team" board: students post roles they need
- Cross-track matching: filter by track, phase, skills
- Team dashboard: progress per discipline
- Multi-track scoring: each member earns points in their category

---

## 12. Challenges & Battles

Competitive, time-bound events where students compete, vote, and earn recognition.

### 12.1 Challenge Types

| Type               | Description                                                                        | Duration | Participants | Winner Determination        |
| ------------------ | ---------------------------------------------------------------------------------- | -------- | ------------ | --------------------------- |
| **Code Duel**      | 1v1 fix-a-bug race: both get the same broken contract, first to pass tests wins    | 30 min   | 2            | Automated (test pass)       |
| **Team Clash**     | 3v3 build sprint: teams build a mini-dApp from a prompt                            | 3 hours  | 6 (2 teams)  | Peer vote + mentor judge    |
| **Open Challenge** | Weekly prompt: "Build an ERC-20 token with a twist". Anyone submits.               | 1 week   | Unlimited    | Community vote (upvotes)    |
| **Security CTF**   | Capture the Flag: find and exploit vulnerabilities in deliberately buggy contracts | 2 hours  | Individual   | Points per flag captured    |
| **Design Duel**    | 1v1 redesign: both redesign a bad dApp UI, community votes                         | 24 hours | 2            | Community vote              |
| **Content Clash**  | Best explainer thread on a given topic. Most engagement wins.                      | 48 hours | Individual   | Likes + RTs + judge score   |
| **Research Rush**  | Analyze a protocol, submit findings. Judges score on depth.                        | 72 hours | Individual   | Mentor panel                |
| **Speed Sprint**   | "Who can complete 3 modules fastest?" Automated tracking.                          | 1 day    | Individual   | Automated (completion time) |

### 12.2 Battle Creation

**Any student can create a challenge.** Admin approval required for points-awarding challenges.

**Creation Form:**

- Challenge type (dropdown)
- Title + description
- Start time + duration
- Max participants
- Points at stake (from creator's own points — wager-style)
- Public or invite-only
- Judging criteria (for non-automated challenges)

**Wager System:**

- Creator stakes their own points
- Participants also stake points to enter
- Winner takes pool (minus 10% club tax)
- Minimum stake: 5 points
- Maximum stake: 50 points
- All wager transactions recorded on Supabase + Sui (immutable)

### 12.3 Challenge Arena (`/arena`)

Dedicated page for all active and upcoming challenges.

**Layout:**

- **Live Now** — currently active duels and sprints (with real-time countdown)
- **Upcoming** — scheduled challenges (with registration count)
- **Leaderboard** — challenge winners, most duels won, highest wager earnings
- **My Challenges** — challenges I created, joined, or need to vote on

**Challenge Card:**

- Type badge (Code Duel, Open Challenge, etc.)
- Title, description snippet
- Creator name + avatar
- Points pool (total at stake)
- Participant count / max
- Countdown timer or "Ends in..."
- Join / Spectate / Vote button

### 12.4 Voting & Judging

For non-automated challenges, the community determines winners.

**Voting System:**

- Upvote-only (no downvotes — prevents negativity)
- Weighted votes: higher-level students' votes count more (Level 1 = 1x, Level 5 = 2x)
- Blind voting: submissions shown without creator names until voting ends
- Judge override: mentor/track lead can override community vote (for quality control)
- Vote audit: all votes recorded, visible after challenge ends

**Auto-judged challenges:**

- Code Duels: test suite passes → instant winner
- Speed Sprints: completion timestamps → fastest wins
- Security CTFs: flag submission → auto-scored by contract

### 12.5 Challenge Rewards

| Outcome            | Creator              | Winner                                    | Participants          |
| ------------------ | -------------------- | ----------------------------------------- | --------------------- |
| Win a duel         | -                    | Wager pool (90%)                          | -                     |
| Lose a duel        | -                    | -                                         | Lose stake            |
| Win open challenge | Club reward: +30 pts | Community recognition + badge eligibility | -                     |
| Win team clash     | -                    | +20 pts per member                        | -                     |
| Win CTF            | -                    | +15 pts per flag                          | +5 pts per flag found |
| Win speed sprint   | -                    | +10 pts                                   | +2 pts for completing |

### 12.6 Challenge Badges

New badge types for competitive achievements:

| Badge              | Criteria                                  |
| ------------------ | ----------------------------------------- |
| **Duelist**        | Won 5 Code Duels                          |
| **Gladiator**      | Won 10 Code Duels                         |
| **Challenger**     | Created 5 public challenges               |
| **Speed Demon**    | Won 3 Speed Sprints                       |
| **CTF Hunter**     | Captured 10 flags in CTFs                 |
| **Crowd Favorite** | Won 3 community-voted challenges          |
| **High Roller**    | Earned 100+ points from wagers            |
| **Versatile**      | Won a challenge in 3 different categories |

### 12.7 Challenge Database Tables

```sql
CREATE TABLE IF NOT EXISTS challenges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id text REFERENCES users(id),
  type text NOT NULL,          -- code_duel, open_challenge, team_clash, ctf, design_duel, speed_sprint
  title text NOT NULL,
  description text,
  rules text,                  -- Markdown rules/instructions
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  max_participants integer,
  stake_points integer DEFAULT 0,
  total_pool integer DEFAULT 0,
  status text DEFAULT 'pending', -- pending, active, voting, completed, cancelled
  winner_id text REFERENCES users(id),
  is_public boolean DEFAULT true,
  requires_approval boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS challenge_participants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id uuid REFERENCES challenges(id),
  user_id text REFERENCES users(id),
  submission_url text,        -- PR, design file, content link
  staked_points integer DEFAULT 0,
  status text DEFAULT 'registered', -- registered, submitted, disqualified
  joined_at timestamptz DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

CREATE TABLE IF NOT EXISTS challenge_votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id uuid REFERENCES challenges(id),
  voter_id text REFERENCES users(id),
  participant_id uuid REFERENCES challenge_participants(id),
  weight integer DEFAULT 1,   -- based on voter's level
  created_at timestamptz DEFAULT now(),
  UNIQUE(challenge_id, voter_id)
);

-- Challenge badges
INSERT INTO badges (id, name, label, description, icon, color, bg_color) VALUES
  ('duelist', 'Duelist', 'Duelist', 'Won 5 Code Duels', 'Swords', 'text-red-400', 'bg-red-500/10'),
  ('gladiator', 'Gladiator', 'Gladiator', 'Won 10 Code Duels', 'Swords', 'text-red-400', 'bg-red-500/10'),
  ('challenger', 'Challenger', 'Challenger', 'Created 5 public challenges', 'Flag', 'text-amber-400', 'bg-amber-500/10'),
  ('speed-demon', 'Speed Demon', 'Speed Demon', 'Won 3 Speed Sprints', 'Zap', 'text-yellow-400', 'bg-yellow-500/10')
ON CONFLICT (id) DO NOTHING;
```

### 12.8 Challenge Routes

| Route                 | File                     | Auth                               | Priority |
| --------------------- | ------------------------ | ---------------------------------- | -------- |
| `/arena`              | `arena.tsx`              | Public (view), Login (participate) | Medium   |
| `/arena/$challengeId` | `arena/$challengeId.tsx` | Public                             | Medium   |
| `/arena/create`       | `arena/create.tsx`       | Login required                     | Medium   |
| `/admin/challenges`   | `admin/challenges.tsx`   | Admin only                         | Low      |

---

## 13. Files Inventory

### New Files (24)

```
src/routes/learn/$slug.tsx                          — Track detail page
src/routes/intake.tsx                               — Intake assessment
src/routes/profile/devlog.tsx                       — My DEVLOG
src/routes/profile/progress.tsx                     — My progress dashboard
src/routes/members/$memberId/devlog.tsx             — Public DEVLOG
src/routes/alumni.tsx                               — Alumni directory
src/routes/arena.tsx                                — Challenge arena (live/upcoming/past)
src/routes/arena/$challengeId.tsx                   — Challenge detail + submissions + voting
src/routes/arena/create.tsx                         — Create challenge (wager-style)
src/routes/admin/cohorts.tsx                        — Cohort list
src/routes/admin/cohorts/$id.tsx                    — Cohort dashboard
src/routes/admin/gate-checks.tsx                    — Gate review
src/routes/admin/certifications.tsx                 — Certificate issuance
src/routes/admin/students.tsx                       — Student list (searchable)
src/routes/admin/students/$userId.tsx               — Student drill-down (5 tabs)
src/routes/admin/challenges.tsx                     — Approve/reject challenges
src/components/phase-bar.tsx                        — Phase indicator
src/components/markdown-content.tsx                 — Markdown renderer
src/components/progress-pipeline.tsx                — Visual phase pipeline
src/components/challenge-card.tsx                   — Challenge card (countdown, pool, type)
src/components/wager-pool.tsx                       — Points wager display + stake button
src/lib/sui-client.ts                               — Sui blockchain client
contracts/sui/Move.toml                             — Sui package config
contracts/sui/sources/club_registry.move            — Sui Move contract
```

### Modified Files (9)

```
src/routes/learn/index.tsx                          — Phase bars + new links
src/routes/profile.tsx                              — DEVLOG tab + progress tab + gate status
src/routes/admin/index.tsx                          — Quick actions updated
src/lib/api/learn.server.ts                         — New server functions
src/lib/auto-awards.ts                              — DEVLOG + badge + wager triggers
src/server.ts                                       — Sui RPC + challenge endpoints
src/stores/auth-store.ts                            — Add sui_address to profile
.env                                                — SUI_ADMIN_PRIVATE_KEY, SUI_PACKAGE_ID
src/lib/supabase.ts                                 — Materialized view queries
```

### New Database Objects (11 tables + 8 indexes + 8 badges + 1 view)

```
Tables:    curriculum_tracks, intake_assessments, devlog_entries,
           gate_checks, cohorts, certifications, badge_mints,
           streaks, point_events, challenges, challenge_participants,
           challenge_votes
Badges:    8 new challenge badges (Duelist, Gladiator, Challenger, etc.)
Indexes:   8 indexes for query performance
View:      leaderboard_cache (materialized, 5-min refresh)
```

---

## 14. Content Template — All Tracks

Every module across all 6 tracks follows this structure:

```markdown
## [Module Title]

### Overview

One paragraph — what you'll learn and why it matters.

### Core Concepts

3-5 key ideas in this module.

### Deep Dive

Main content. Sections with headings, examples, and cross-references.

### Practical Exercise

A hands-on task. Must produce a deliverable.

- Technical: PR, deployed contract, test suite
- Design: Figma link, design system component
- Marketing: Campaign brief, content piece, analytics report
- Community: Channel structure, bot config, event plan
- Content: Published piece, video script, documentation page
- Research: Analysis note, Dune query, methodology section

### Check Your Understanding

2-3 questions or reflection prompts.

### Resources

Links to further reading, tools, templates.
```

---

## 15. Weekly Session Format — All Tracks

| Time      | Segment         | Description                                                                                               |
| --------- | --------------- | --------------------------------------------------------------------------------------------------------- |
| 0:00–0:15 | Concept         | Visual, interactive delivery. One concept per session. No long slide decks.                               |
| 0:15–1:00 | Build           | Hands-on broken code/problem. Students receive a repo or brief with a deliberate issue to fix.            |
| 1:00–1:15 | Submit & Review | Students submit their work. One student randomly selected to walk through their solution. Group feedback. |

---

_Plan finalized June 2026. Ready for Sprint 1 execution._
