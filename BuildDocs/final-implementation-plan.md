# Blockchain Club FUTMinna — Final Implementation Plan

## Decisions Summary

| #   | Question              | Decision                                                                                                  |
| --- | --------------------- | --------------------------------------------------------------------------------------------------------- |
| 1   | Content management    | Admin-side editor for all tracks. Manual code for technical. Non-technical: admin-editable + AI-drafted   |
| 2   | Active tracks         | Build the full 6-track system now. Content populated later                                                |
| 3   | Intake assessment     | Built-in web form (auto-scored)                                                                           |
| 4   | Gate checks           | Mixed — automated where possible (quiz, DEVLOG count), manual where needed (code review, design critique) |
| 5   | DEVLOG                | Public by default — builds culture. Per-entry publish toggle for sensitive weeks                          |
| 6   | Timeline              | Build everything working → then launch cohort                                                             |
| 7   | Cohorts               | Manual assignment by admin. Cohort created per academic period                                            |
| 8   | SBT certification     | Build now — on Sui, non-transferable objects                                                              |
| 9   | MVP priority          | Track pages → Modules → Intake → DEVLOG → Gates → Cohorts → SBTs                                          |
| 10  | Non-technical content | Structure now, technical from PDF, AI-draft non-technical for review                                      |

### Additional: Blockchain Integration

Add a Sui Move smart contract to the backend for:

- Leaderboard state on-chain (public, verifiable)
- SBT certification issuance
- Points registry (immutable record)

---

## Implementation Order

### Sprint 1: Curriculum Foundation (Now)

**Goal:** Students can browse 6 tracks, view phases, read modules.

| #   | Task                                                                           | Files             | DB                      |
| --- | ------------------------------------------------------------------------------ | ----------------- | ----------------------- |
| 1.1 | Create `curriculum_tracks` table + ALTER modules                               | SQL               | 1 new table + 4 columns |
| 1.2 | Seed 6 tracks + ~30 modules (admin writes via `/admin/learn`)                  | Admin UI          | 6 track rows + modules  |
| 1.3 | Update `/learn` — phase bars on track cards, link to `/learn/$slug`            | `learn/index.tsx` | -                       |
| 1.4 | Create `/learn/$slug` — track detail page with phase timeline + inline modules | `learn/$slug.tsx` | -                       |
| 1.5 | Module accordion — inline content rendering + Markdown display                 | `$slug.tsx`       | -                       |
| 1.6 | "Mark Complete" button — inserts into `user_module_progress`                   | `$slug.tsx`       | -                       |

### Sprint 2: Intake + DEVLOG (Next)

**Goal:** New members get lane-placed. Students log weekly.

| #   | Task                                                                            | Files                          | DB          |
| --- | ------------------------------------------------------------------------------- | ------------------------------ | ----------- |
| 2.1 | Create `intake_assessments` table                                               | SQL                            | 1 new table |
| 2.2 | Build `/intake` — 10-question quiz + practical task + auto-score + lane result  | `intake.tsx`                   | -           |
| 2.3 | Create `devlog_entries` table                                                   | SQL                            | 1 new table |
| 2.4 | Build `/profile/devlog` — create/edit/delete entries, week grid, streak counter | `profile/devlog.tsx`           | -           |
| 2.5 | Build `/members/$memberId/devlog` — public DEVLOG view                          | `members/$memberId/devlog.tsx` | -           |
| 2.6 | Auto-award +5 points per DEVLOG entry                                           | modify auto-awards             | -           |

### Sprint 3: Gates + Cohorts (After)

**Goal:** Admin tracks progression. Students see their status.

| #   | Task                                                                   | Files                   | DB           |
| --- | ---------------------------------------------------------------------- | ----------------------- | ------------ |
| 3.1 | Create `gate_checks` table + `cohorts` table                           | SQL                     | 2 new tables |
| 3.2 | Add cohort_id to users table                                           | SQL                     | 1 column     |
| 3.3 | Build `/admin/gate-checks` — master grid, review modal, approve/reject | `admin/gate-checks.tsx` | -            |
| 3.4 | Build `/admin/cohorts` — list + create                                 | `admin/cohorts.tsx`     | -            |
| 3.5 | Build `/admin/cohorts/$id` — cohort dashboard + progress grid          | `admin/cohorts/$id.tsx` | -            |
| 3.6 | Gate status display on profile + track detail pages                    | modify profile + $slug  | -            |

### Sprint 4: Blockchain + SBTs + Alumni (Final)

**Goal:** On-chain certification. Alumni directory.

| #   | Task                                                                  | Files                      | DB          |
| --- | --------------------------------------------------------------------- | -------------------------- | ----------- |
| 4.1 | Create `certifications` table                                         | SQL                        | 1 new table |
| 4.2 | Write Sui Move smart contract — leaderboard registry + SBT minting    | `contracts/sui/`           | -           |
| 4.3 | Deploy contract to Sui Testnet                                        | -                          | -           |
| 4.4 | Build `/admin/certifications` — issue SBT, generate PDF, track status | `admin/certifications.tsx` | -           |
| 4.5 | Build `/alumni` — directory of Tier 3 graduates                       | `alumni.tsx`               | -           |
| 4.6 | Wire SBT display on student profiles                                  | modify profile             | -           |

---

## Blockchain Integration — Sui Move Smart Contract

### What Goes On-Chain

| Data               | Why On-Chain                  | Implementation                                          |
| ------------------ | ----------------------------- | ------------------------------------------------------- |
| Leaderboard scores | Public, verifiable, immutable | Move object: `LeaderboardEntry` per student with points |
| SBT certifications | Non-transferable credential   | Move object: `Certificate` as non-transferable NFT      |
| Points log         | Audit trail of point awards   | Events emitted on each award                            |

### Smart Contract Architecture

```
Module: club::registry

Structs:
  LeaderboardEntry {
    student: address,
    event_points: u64,
    learn_points: u64,
    build_points: u64,
    community_points: u64,
    total_points: u64,
    badge_count: u64
  }

  Certificate {
    id: UID,
    student: address,
    tier: u8,           // 1, 2, or 3
    track: String,      // "Security Auditor", etc.
    cohort_year: u16,
    portfolio_url: String,
    issued_at: u64
  }

Functions:
  register_student(student: address)
  award_points(student: address, category: u8, points: u64)
  issue_certificate(student: address, tier: u8, track: vector<u8>, cohort: u16, url: vector<u8>)
  get_leaderboard(): vector<LeaderboardEntry>
  get_certificates(student: address): vector<Certificate>
```

### How It Integrates with the Platform

```
User Action → Platform API → Supabase (off-chain) + Sui Contract (on-chain)
                                                          │
                                    ┌─────────────────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            ▼                       ▼                       ▼
      Points awarded          Gate passed              Capstone done
      → club::award_points()  → club::issue_certificate() → SBT minted
      → on-chain log          → Tier 1/2/3 SBT            → portfolio linked
```

### Wallet Requirement

- Every student needs a Sui wallet address (added to profile)
- Set up during Phase 0 (wallet safety module)
- Admin wallet used for contract deployment and certificate issuance
- Gas costs: testnet (free) during development, mainnet later

### Deployment Plan

1. Write + test Move contract locally (`sui move test`)
2. Deploy to Sui Testnet
3. Integrate with platform API (server.ts calls Sui RPC)
4. Test full flow: register → award points → issue certificate
5. Mainnet deployment when cohort goes live

---

## Files Inventory — All Changes

### New Files (12)

```
src/routes/learn/$slug.tsx              — Track detail page
src/routes/intake.tsx                   — Intake assessment
src/routes/profile/devlog.tsx           — My DEVLOG
src/routes/members/$memberId/devlog.tsx — Public DEVLOG
src/routes/alumni.tsx                   — Alumni directory
src/routes/admin/cohorts.tsx            — Cohort list
src/routes/admin/cohorts/$id.tsx        — Cohort dashboard
src/routes/admin/gate-checks.tsx        — Gate review
src/routes/admin/certifications.tsx     — Certificate issuance
src/components/phase-bar.tsx            — Phase indicator component
src/components/markdown-content.tsx     — Markdown renderer
contracts/sui/club_registry.move        — Sui Move contract
```

### Modified Files (6)

```
src/routes/learn/index.tsx              — Phase bars + new links
src/routes/profile.tsx                  — DEVLOG tab + gate status
src/routes/learn/design.tsx             — Redirect to new structure (or keep)
src/lib/api/learn.server.ts            — New server functions
src/lib/auto-awards.ts                 — DEVLOG points trigger
src/server.ts                           — Sui RPC endpoints
```

### New Tables (6)

```
curriculum_tracks    — Track registry with slugs
intake_assessments   — Lane placement results
devlog_entries       — Weekly student logs
gate_checks          — Progression gates
cohorts              — Academic cohort groups
certifications       — On-chain SBT records
```

### Modified Tables (2)

```
modules              — Add phase, slug, ecosystem, category columns
users                — Add cohort_id column
```

---

## Database SQL — Run First

```sql
-- Curriculum structure
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

-- Module columns
ALTER TABLE modules ADD COLUMN IF NOT EXISTS phase integer DEFAULT 1;
ALTER TABLE modules ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE modules ADD COLUMN IF NOT EXISTS ecosystem text DEFAULT 'GENERAL';
ALTER TABLE modules ADD COLUMN IF NOT EXISTS category text DEFAULT 'technical';

-- Intake
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

-- DEVLOG
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

-- Gates
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

-- Cohorts
CREATE TABLE IF NOT EXISTS cohorts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS cohort_id uuid REFERENCES cohorts(id);

-- Certifications
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
```

---

## Priority Execution

| Sprint   | Duration | Deliverable                                                 |
| -------- | -------- | ----------------------------------------------------------- |
| Sprint 1 | Now      | Curriculum structure + track/module pages + "Mark Complete" |
| Sprint 2 | After    | Intake assessment + DEVLOG system                           |
| Sprint 3 | After    | Gate checks + cohort management                             |
| Sprint 4 | After    | Sui contract + SBT issuance + alumni directory              |

**Start with Sprint 1.** Ready to build when you say so.
