# BlockchainClub FUTMinna — Architecture

## Stack

- Frontend: TanStack Start (React 19 + Vite 7)
- Database: Supabase (PostgreSQL + REST API)
- Auth: JWT (7d access, 7d refresh)
- Storage: Supabase Storage (avatars, project-logos, project-banners, event-covers, opportunity-images)
- Email: Resend
- Blockchain: Sui Move (points, badges, certificates)

## Route Structure

- / — Landing
- /auth — Login
- /join — Register
- /intake — Lane placement assessment
- /learn — Curriculum browser
- /learn/$slug — Track detail
- /events, /events/$id — Events
- /projects, /projects/$id, /projects/submit — Projects
- /blog, /blog/$slug — Blog
- /leaderboard — Rankings
- /arena — Challenges
- /squads — Study squads
- /pair — Pair programming
- /hackathons — Hackathon teams
- /alumni — Graduate directory
- /profile, /profile/devlog — User profile + DEVLOG
- /admin/* — Admin dashboard
- /opportunities — Grants & jobs
- /partners — Ecosystem partners
