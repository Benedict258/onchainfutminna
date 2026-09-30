import {
  PrismaClient,
  Role,
  Ecosystem,
  EventType,
  Difficulty,
  PartnerCategory,
} from "../src/generated/prisma";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const hashedPassword = await bcrypt.hash("admin123", 10);

  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@futminna.com" },
    update: {},
    create: {
      email: "admin@futminna.com",
      passwordHash: hashedPassword,
      role: Role.SUPER_ADMIN,
      isActive: true,
      isApproved: true,
      profile: {
        create: {
          fullName: "FUTMINNA Admin",
          nickname: "Admin",
          experienceLevel: "ADVANCED",
          bio: "Super Admin of Blockchain Club FUTMINNA",
        },
      },
      leaderboardEntry: {
        create: {
          totalPoints: 100,
          eventPoints: 25,
          learnPoints: 25,
          buildPoints: 25,
          communityPoints: 25,
          badges: ["founding_member", "super_admin"],
        },
      },
    },
  });
  console.log("Created super admin:", superAdmin.email);

  const tracks = [
    {
      title: "EVM & Solidity",
      description: "Master Ethereum Virtual Machine development and Solidity smart contracts",
      ecosystem: Ecosystem.EVM,
      difficulty: Difficulty.BEGINNER,
      order: 1,
    },
    {
      title: "Sui & Move",
      description: "Learn Sui blockchain development with the Move programming language",
      ecosystem: Ecosystem.SUI_MOVE,
      difficulty: Difficulty.BEGINNER,
      order: 2,
    },
    {
      title: "Aptos & Move",
      description: "Explore Aptos blockchain development with Move language",
      ecosystem: Ecosystem.APTOS_MOVE,
      difficulty: Difficulty.BEGINNER,
      order: 3,
    },
    {
      title: "Solana & Rust",
      description: "Build on Solana blockchain using Rust programming language",
      ecosystem: Ecosystem.SOLANA_RUST,
      difficulty: Difficulty.INTERMEDIATE,
      order: 4,
    },
  ];

  for (const track of tracks) {
    const created = await prisma.track.upsert({
      where: { id: track.title.toLowerCase().replace(/[^a-z0-9]/g, "-") },
      update: {},
      create: track,
    });
    console.log("Created track:", created.title);
  }

  const events = [
    {
      title: "Blockchain Fundamentals Workshop",
      description: "Introduction to blockchain technology, cryptography, and distributed systems",
      type: EventType.WORKSHOP,
      location: "FUTMINNA Tech Hub",
      isVirtual: true,
      virtualLink: "https://meet.google.com/abc-defg-hij",
      startDate: new Date("2026-07-15T10:00:00Z"),
      endDate: new Date("2026-07-15T14:00:00Z"),
      isPublished: true,
      isFeatured: true,
    },
    {
      title: "Web3 Hackathon 2026",
      description: "48-hour hackathon building decentralized applications",
      type: EventType.HACKATHON,
      location: "FUTMINNA Campus",
      isVirtual: false,
      startDate: new Date("2026-08-01T09:00:00Z"),
      endDate: new Date("2026-08-03T18:00:00Z"),
      isPublished: true,
      isFeatured: true,
    },
    {
      title: "Guest Speaker: DeFi Deep Dive",
      description: "Learn about decentralized finance protocols and yield strategies",
      type: EventType.TALK,
      location: "Online via Zoom",
      isVirtual: true,
      virtualLink: "https://zoom.us/j/1234567890",
      startDate: new Date("2026-07-25T16:00:00Z"),
      endDate: new Date("2026-07-25T18:00:00Z"),
      isPublished: true,
      isFeatured: false,
    },
  ];

  for (const event of events) {
    const created = await prisma.event.create({ data: event });
    console.log("Created event:", created.title);
  }

  const partners = [
    {
      name: "Sui Foundation",
      website: "https://sui.io",
      description: "Supporting the growth of the Sui ecosystem",
      category: PartnerCategory.ECOSYSTEM,
      order: 1,
    },
    {
      name: "Aptos Foundation",
      website: "https://aptos.foundation",
      description: "Building the future of Layer 1 blockchain",
      category: PartnerCategory.ECOSYSTEM,
      order: 2,
    },
    {
      name: "DevDAO FUTMINNA",
      website: "https://devdao.dev",
      description: "Community of developers at FUTMINNA",
      category: PartnerCategory.COMMUNITY,
      order: 3,
    },
  ];

  for (const partner of partners) {
    const created = await prisma.partner.create({ data: partner });
    console.log("Created partner:", created.name);
  }

  const settings = [
    { key: "site_name", value: "Blockchain Club FUTMINNA" },
    {
      key: "site_description",
      value:
        "Learning and building the decentralized future at Federal University of Technology Minna",
    },
    { key: "contact_email", value: "blockchain@futminna.edu.ng" },
    { key: "social_twitter", value: "https://twitter.com/blockchainfut" },
    { key: "social_github", value: "https://github.com/blockchain-futminna" },
    { key: "membership_open", value: "true" },
  ];

  for (const setting of settings) {
    await prisma.siteSettings.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }
  console.log("Created site settings:", settings.length, "entries");

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
