# Project Overview: BlockchainClub-FUTMinna

## 📌 Purpose & Description

The official web platform for FUTMinna's premier Web3 community, providing member registration, event management, learning tracks with quizzes, project showcases, a leaderboard/badge gamification system, and Sui blockchain on-chain student registration. Designed as a full-stack platform to unite blockchain-curious students and professionals.

## 🛠️ Tech Stack & Dependencies

- **Primary Language:** TypeScript
- **Framework/Libraries:** TanStack Start (React 19 + Vite 7), TanStack Router, TanStack Query, shadcn/ui (Radix UI), react-hook-form + Zod, Recharts
- **Database/Storage:** PostgreSQL (Supabase) + Prisma ORM, Supabase Storage (file uploads)
- **Key Dependencies:** @mysten/sui (Sui blockchain integration), bcryptjs + jsonwebtoken (JWT auth), Resend (email), Zustand (client state), Nitro (SSR server for Vercel deployment)

## 🗂️ Core Architecture & File Structure

TanStack Start file-based routing with SSR (deployed via Nitro on Vercel). Routes live under `src/routes/`, UI components under `src/components/` (shadcn/ui primitives in `components/ui/`, app components in `components/` root and `components/layout/`). Backend logic is co-located in `src/lib/` (API server functions, auth, Sui blockchain client, email, file upload, SEO, rate limiting). Database schema is defined in `prisma/schema.prisma` with models for users, profiles, events, learning tracks/modules/quizzes, projects, opportunities, blog posts, partners, leaderboard, badges, and site settings. Sui Move smart contracts live under `contracts/sui/`.

## 🚀 Current Status & Next Steps

- **Status:** Active development, deployed on Vercel
- **Last Active Focus:** Sui blockchain integration (on-chain student registration, NFT badge design brief), SSR build fixes for Vercel deployment, learning module seeding (Python scripts), auto-award badge system
