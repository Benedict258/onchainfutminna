import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { LoginPrompt } from "@/components/login-prompt";
import {
  TrendingUp,
  Megaphone,
  Target,
  BarChart3,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Layers,
  GraduationCap,
  Lightbulb,
  Share2,
  Users,
  Search,
  PenTool,
  FileText,
  Video,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

export const Route = createFileRoute("/learn/marketing")({
  head: () => ({
    meta: [
      { title: "Learn Marketing  Growth & Brand Strategy | BlockchainClub FUTMinna" },
      {
        name: "description",
        content:
          "Master marketing fundamentals for Web3 projects. Growth hacking, brand strategy, community building, and social media marketing.",
      },
      {
        property: "og:title",
        content: "Master Marketing  Blockchain Club FUTMinna",
      },
      {
        property: "og:description",
        content:
          "Growth hacking, brand strategy, social media marketing, and community building tracks.",
      },
    ],
  }),
  component: MarketingPage,
});

const TRACKS = [
  {
    id: 1,
    title: "Growth Hacking",
    description:
      "Data-driven strategies to achieve rapid, scalable growth for Web3 products and communities.",
    icon: TrendingUp,
    difficulty: "INTERMEDIATE",
    modules: 8,
    progress: 0,
  },
  {
    id: 2,
    title: "Brand Strategy",
    description:
      "Build a memorable brand identity that resonates with your target audience and stands out in the market.",
    icon: Megaphone,
    difficulty: "BEGINNER",
    modules: 6,
    progress: 0,
  },
  {
    id: 3,
    title: "Social Media Marketing",
    description:
      "Master platform-specific strategies for Twitter/X, Discord, Telegram, and emerging social channels.",
    icon: Share2,
    difficulty: "BEGINNER",
    modules: 7,
    progress: 0,
  },
  {
    id: 4,
    title: "Community Building",
    description:
      "Create and nurture engaged communities that drive organic growth and long-term retention.",
    icon: Users,
    difficulty: "INTERMEDIATE",
    modules: 9,
    progress: 0,
  },
  {
    id: 5,
    title: "SEO & Content Marketing",
    description:
      "Optimize for search engines and create compelling content that attracts and converts your audience.",
    icon: Search,
    difficulty: "BEGINNER",
    modules: 5,
    progress: 0,
  },
  {
    id: 6,
    title: "Marketing Analytics",
    description:
      "Measure, analyze, and optimize marketing performance using data-driven insights and tools.",
    icon: BarChart3,
    difficulty: "ADVANCED",
    modules: 7,
    progress: 0,
  },
];

const RESOURCES = [
  {
    id: 1,
    title: "Web3 Marketing Playbook",
    type: "ARTICLE",
    category: "Growth",
  },
  {
    id: 2,
    title: "Community-First Growth Strategies",
    type: "VIDEO",
    category: "Community",
  },
  {
    id: 3,
    title: "Brand Identity Design Guide",
    type: "ARTICLE",
    category: "Branding",
  },
  {
    id: 4,
    title: "Twitter/X Marketing for Crypto",
    type: "TOOL",
    category: "Social Media",
  },
  {
    id: 5,
    title: "SEO Fundamentals for Web3",
    type: "ARTICLE",
    category: "SEO",
  },
  {
    id: 6,
    title: "Measuring Marketing ROI",
    type: "VIDEO",
    category: "Analytics",
  },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  BEGINNER: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  INTERMEDIATE: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  ADVANCED: "bg-red-500/10 text-red-400 border-red-500/20",
};

const RESOURCE_ICONS: Record<string, typeof BookOpen> = {
  ARTICLE: FileText,
  VIDEO: Video,
  TOOL: Target,
  DOCS: BookOpen,
};

type ResourceFilter = "all" | "ARTICLE" | "VIDEO" | "TOOL";

function MarketingPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <LoginPrompt />;

  const [resourceFilter, setResourceFilter] = useState<ResourceFilter>("all");

  const filteredResources =
    resourceFilter === "all" ? RESOURCES : RESOURCES.filter((r) => r.type === resourceFilter);

  return (
    <div className="bg-background">
      {/* HERO */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1400px] px-6 py-16 md:py-24 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/5 px-3 py-1 text-label-bold text-primary">
            LEARN
          </span>
          <h1 className="mt-8 text-display-lg md:text-[56px] md:leading-[60px] tracking-tight">
            Master <span className="text-primary">Marketing</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-body-lg text-muted-foreground">
            Growth hacking, brand strategy, and community building for Web3 projects. Learn how to
            attract users, build loyal communities, and scale your marketing efforts.
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
                <div className="text-xs text-muted-foreground">Learning Tracks</div>
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
                <div className="text-xs text-muted-foreground">Quizzes Completed</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRACKS */}
      <section className="mx-auto max-w-[1400px] px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <h2 className="text-headline-lg">Learning Tracks</h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {TRACKS.map((track) => {
            const IconComp = track.icon;
            return (
              <Card
                key={track.id}
                className="group relative overflow-hidden border-border bg-card p-0 transition-all hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-sm"
              >
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-top rounded-r" />
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface-high text-primary">
                      <IconComp className="h-5 w-5" />
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${DIFFICULTY_COLORS[track.difficulty]}`}
                      >
                        {track.difficulty}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {track.modules} modules
                      </Badge>
                    </div>
                  </div>
                  <h3 className="mt-4 text-headline-md">{track.title}</h3>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-2">
                    {track.description}
                  </p>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                      <span>Progress</span>
                      <span>{track.progress}%</span>
                    </div>
                    <Progress value={track.progress} className="h-1.5" />
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    className="mt-5 w-full font-semibold tracking-wide text-xs group-hover:border-primary/40"
                  >
                    <Link to="/learn">
                      Start Learning <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* RESOURCES */}
      <section className="border-y border-border bg-surface-low">
        <div className="mx-auto max-w-[1400px] px-6 py-16">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <h2 className="text-headline-lg">Resources Library</h2>
          </div>

          <Tabs
            value={resourceFilter}
            onValueChange={(v) => setResourceFilter(v as ResourceFilter)}
          >
            <TabsList className="mb-6 bg-background/50">
              <TabsTrigger value="all">All Types</TabsTrigger>
              <TabsTrigger value="ARTICLE">Articles</TabsTrigger>
              <TabsTrigger value="VIDEO">Videos</TabsTrigger>
              <TabsTrigger value="TOOL">Tools</TabsTrigger>
            </TabsList>

            <TabsContent value={resourceFilter}>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredResources.map((resource) => {
                  const IconComp = RESOURCE_ICONS[resource.type] || FileText;
                  return (
                    <a
                      key={resource.id}
                      href="#"
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
                            {resource.type} · {resource.category}
                          </p>
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1400px] px-6 py-16">
        <div className="relative overflow-hidden rounded-xl border border-border bg-surface-low p-10 md:p-14 text-center">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-6 text-headline-lg">
            READY TO MASTER
            <br />
            MARKETING?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Join the community and get access to all marketing tracks, mentorship, and hands-on
            project opportunities.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="font-semibold tracking-wide">
              <Link to="/join">Join BlockchainClub FUTMinna</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="font-semibold tracking-wide">
              <Link to="/about">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
