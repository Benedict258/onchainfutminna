import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { LoginPrompt } from "@/components/login-prompt";
import {
  Users,
  Heart,
  MessageCircle,
  Globe,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Layers,
  GraduationCap,
  Shield,
  Megaphone,
  UserCheck,
  BarChart3,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

type CategoryFilter = "all" | "governance" | "engagement" | "growth" | "moderation";

const CATEGORY_LABELS: Record<string, string> = {
  governance: "Governance",
  engagement: "Engagement",
  growth: "Growth",
  moderation: "Moderation",
};

const CATEGORY_ICONS: Record<string, string> = {
  governance: "⚙",
  engagement: "💬",
  growth: "📈",
  moderation: "🛡",
};

const TRACKS = [
  {
    id: 1,
    title: "Community Building Foundations",
    category: "growth",
    description: "Learn the principles of building vibrant, self-sustaining communities from the ground up.",
    modules: 12,
    difficulty: "BEGINNER",
  },
  {
    id: 2,
    title: "Moderation & Conflict Resolution",
    category: "moderation",
    description: "Master techniques for maintaining healthy discussions and resolving disputes constructively.",
    modules: 8,
    difficulty: "INTERMEDIATE",
  },
  {
    id: 3,
    title: "Engagement Strategies",
    category: "engagement",
    description: "Design programs and initiatives that keep members active and invested in the community.",
    modules: 10,
    difficulty: "BEGINNER",
  },
  {
    id: 4,
    title: "DAO Governance & Decision Making",
    category: "governance",
    description: "Understand decentralized governance models, voting mechanisms, and proposal frameworks.",
    modules: 14,
    difficulty: "ADVANCED",
  },
  {
    id: 5,
    title: "Community Analytics & Metrics",
    category: "growth",
    description: "Track, measure, and optimize community health using data-driven approaches.",
    modules: 6,
    difficulty: "INTERMEDIATE",
  },
  {
    id: 6,
    title: "Content Curation & Knowledge Management",
    category: "engagement",
    description: "Organize and surface valuable content to maximize community learning and retention.",
    modules: 7,
    difficulty: "BEGINNER",
  },
  {
    id: 7,
    title: "Trust & Safety Frameworks",
    category: "moderation",
    description: "Build robust systems for user verification, anti-abuse, and platform integrity.",
    modules: 9,
    difficulty: "ADVANCED",
  },
  {
    id: 8,
    title: "Token-Gated Community Design",
    category: "governance",
    description: "Create exclusive community tiers and access models using blockchain-based credentials.",
    modules: 11,
    difficulty: "INTERMEDIATE",
  },
];

const RESOURCES = [
  { id: 1, title: "Community Playbook for Web3 Projects", type: "Article", category: "growth" },
  { id: 2, title: "Moderating Large-Scale Discord Servers", type: "Video", category: "moderation" },
  { id: 3, title: "DAO Governance Frameworks Overview", type: "Docs", category: "governance" },
  { id: 4, title: "Engagement Metrics Dashboard Template", type: "Tool", category: "engagement" },
  { id: 5, title: "Building a Community from Zero", type: "Video", category: "growth" },
  { id: 6, title: "Conflict Resolution Guide for Admins", type: "Article", category: "moderation" },
  { id: 7, title: "Token-Gating Best Practices", type: "Docs", category: "governance" },
  { id: 8, title: "Community Health Scorecard", type: "Tool", category: "growth" },
  { id: 9, title: "Facilitating Productive Discussions", type: "Article", category: "engagement" },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  BEGINNER: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  INTERMEDIATE: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  ADVANCED: "bg-red-500/10 text-red-400 border-red-500/20",
};

const RESOURCE_ICONS: Record<string, typeof BookOpen> = {
  Article: MessageCircle,
  Video: Globe,
  Docs: BookOpen,
  Tool: BarChart3,
};

export const Route = createFileRoute("/learn/community-management")({
  head: () => ({
    meta: [
      { title: "Learn  Community Management | BlockchainClub FUTMinna" },
      {
        name: "description",
        content:
          "Master community management for blockchain ecosystems. Learn governance, engagement, moderation, and growth strategies.",
      },
      {
        property: "og:title",
        content: "Community Management Learning  Blockchain Club FUTMinna",
      },
      {
        property: "og:description",
        content: "Tracks for governance, engagement, moderation, and community growth.",
      },
    ],
  }),
  component: CommunityManagementPage,
});

function CommunityManagementPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <LoginPrompt />;

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [resourceType, setResourceType] = useState<string>("all");

  const filteredTracks =
    categoryFilter === "all"
      ? TRACKS
      : TRACKS.filter((t) => t.category === categoryFilter);

  const filteredResources =
    resourceType === "all"
      ? RESOURCES
      : RESOURCES.filter((r) => r.type === resourceType);

  return (
    <div className="bg-background">
      {/* HERO */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1400px] px-6 py-16 md:py-24 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/5 px-3 py-1 text-label-bold text-primary">
            LEARN
          </span>
          <h1 className="mt-8 text-display-lg md:text-[56px] md:leading-[60px] tracking-tight">
            Master <span className="text-primary">Community</span>
            <br />
            Management
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-body-lg text-muted-foreground">
            Comprehensive learning tracks designed to help you nurture and scale
            global blockchain communities. From governance frameworks to
            engagement strategies.
          </p>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="border-b border-border bg-surface-low">
        <div className="mx-auto max-w-[1400px] px-6 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="flex items-center justify-center gap-3">
              <Layers className="h-5 w-5 text-primary" />
              <div>
                <div className="text-headline-sm">{TRACKS.length}</div>
                <div className="text-xs text-muted-foreground">
                  Learning Tracks
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <div>
                <div className="text-headline-sm">
                  {TRACKS.reduce((acc, t) => acc + t.modules, 0)}
                </div>
                <div className="text-xs text-muted-foreground">Modules</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <GraduationCap className="h-5 w-5 text-primary" />
              <div>
                <div className="text-headline-sm"></div>
                <div className="text-xs text-muted-foreground">
                  Quizzes Completed
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRACKS */}
      <section className="mx-auto max-w-[1400px] px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <h2 className="text-headline-lg">Learning Tracks</h2>
          <Tabs
            value={categoryFilter}
            onValueChange={(v) => setCategoryFilter(v as CategoryFilter)}
          >
            <TabsList className="bg-background/50">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="governance">Governance</TabsTrigger>
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
              <TabsTrigger value="growth">Growth</TabsTrigger>
              <TabsTrigger value="moderation">Moderation</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {filteredTracks.map((track) => (
            <Card
              key={track.id}
              className="group relative overflow-hidden border-border bg-card p-0 transition-all hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-sm"
            >
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-top rounded-r" />
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface-high text-lg">
                    {CATEGORY_ICONS[track.category] || "�"}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${DIFFICULTY_COLORS[track.difficulty] || ""}`}
                    >
                      {track.difficulty}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {track.modules} modules
                    </Badge>
                  </div>
                </div>
                <h3 className="mt-4 text-headline-md">{track.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {CATEGORY_LABELS[track.category] || track.category}
                </p>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-2">
                  {track.description}
                </p>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Progress</span>
                    <span>Login to track</span>
                  </div>
                  <Progress value={0} className="h-1.5" />
                </div>
                <Button
                  asChild
                  variant="outline"
                  className="mt-5 w-full font-semibold tracking-wide text-xs group-hover:border-primary/40"
                >
                  <Link to="/learn">
                    Start Learning{" "}
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* RESOURCES */}
      <section className="border-y border-border bg-surface-low">
        <div className="mx-auto max-w-[1400px] px-6 py-16">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <h2 className="text-headline-lg">Resources Library</h2>
            <Tabs
              value={resourceType}
              onValueChange={setResourceType}
            >
              <TabsList className="bg-background/50">
                <TabsTrigger value="all">All Types</TabsTrigger>
                <TabsTrigger value="Article">Articles</TabsTrigger>
                <TabsTrigger value="Video">Videos</TabsTrigger>
                <TabsTrigger value="Docs">Docs</TabsTrigger>
                <TabsTrigger value="Tool">Tools</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredResources.map((resource) => {
              const IconComp = RESOURCE_ICONS[resource.type] || BookOpen;
              return (
                <div
                  key={resource.id}
                  className="group rounded-lg border border-border bg-card p-5 transition-all hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-surface-high text-primary">
                      <IconComp className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {resource.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {resource.type} · {CATEGORY_LABELS[resource.category]}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1400px] px-6 py-16">
        <div className="relative overflow-hidden rounded-xl border border-border bg-surface-low p-10 md:p-14 text-center">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-6 text-headline-lg">
            READY TO BUILD
            <br />
            THRIVING COMMUNITIES?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Join the community and get access to all learning tracks, mentorship,
            and hands-on community management experience.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="font-semibold tracking-wide">
              <Link to="/join">Join BlockchainClub FUTMinna</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="font-semibold tracking-wide"
            >
              <Link to="/about">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}


