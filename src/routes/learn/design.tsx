import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { LoginPrompt } from "@/components/login-prompt";
import {
  BookOpen,
  ArrowRight,
  Palette,
  PenTool,
  Figma,
  Layers,
  CheckCircle2,
  Sparkles,
  Smartphone,
  Layout,
  Type,
  MousePointerClick,
  Monitor,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

type CategoryFilter = "all" | "uiux" | "branding" | "tools";

const DESIGN_TRACKS = [
  {
    id: "uiux-fundamentals",
    title: "UI/UX Fundamentals",
    category: "uiux",
    difficulty: "BEGINNER",
    icon: Layout,
    modules: 8,
    description:
      "Master the core principles of user interface and user experience design for digital products.",
  },
  {
    id: "figma-mastery",
    title: "Figma Mastery",
    category: "tools",
    difficulty: "BEGINNER",
    icon: Figma,
    modules: 6,
    description:
      "Become proficient in Figma  from basic tools to advanced components, auto-layout, and design systems.",
  },
  {
    id: "prototyping-interactions",
    title: "Prototyping & Interactions",
    category: "uiux",
    difficulty: "INTERMEDIATE",
    icon: MousePointerClick,
    modules: 7,
    description:
      "Learn to create high-fidelity prototypes and micro-interactions that bring your designs to life.",
  },
  {
    id: "design-systems",
    title: "Building Design Systems",
    category: "uiux",
    difficulty: "ADVANCED",
    icon: Layers,
    modules: 10,
    description:
      "Create scalable design systems with tokens, components, and documentation for consistent products.",
  },
  {
    id: "mobile-design",
    title: "Mobile App Design",
    category: "uiux",
    difficulty: "INTERMEDIATE",
    icon: Smartphone,
    modules: 9,
    description:
      "Design beautiful and intuitive mobile interfaces following platform guidelines and best practices.",
  },
  {
    id: "web3-design",
    title: "Web3 & Crypto UX",
    category: "uiux",
    difficulty: "ADVANCED",
    icon: Sparkles,
    modules: 5,
    description:
      "Design for wallets, dApps, and decentralized protocols  tackle the unique UX challenges of crypto.",
  },
  {
    id: "typography-color",
    title: "Typography & Color Theory",
    category: "branding",
    difficulty: "BEGINNER",
    icon: Type,
    modules: 5,
    description:
      "Understand how to use type and color to create visual hierarchy, mood, and brand identity.",
  },
  {
    id: "brand-identity",
    title: "Brand Identity Design",
    category: "branding",
    difficulty: "INTERMEDIATE",
    icon: Palette,
    modules: 7,
    description:
      "Craft cohesive brand identities  logos, guidelines, and visual language that resonates.",
  },
];

const DESIGN_RESOURCES = [
  {
    id: "r1",
    title: "Figma for Beginners  Official Guide",
    type: "Docs",
    url: "https://help.figma.com",
    icon: BookOpen,
  },
  {
    id: "r2",
    title: "Laws of UX",
    type: "Article",
    url: "https://lawsofux.com",
    icon: BookOpen,
  },
  {
    id: "r3",
    title: "Material Design 3 Documentation",
    type: "Docs",
    url: "https://m3.material.io",
    icon: BookOpen,
  },
  {
    id: "r4",
    title: "Refactoring UI  Design Tips",
    type: "Article",
    url: "https://refactoringui.com",
    icon: BookOpen,
  },
  {
    id: "r5",
    title: "Dribbble  Design Inspiration",
    type: "Tool",
    url: "https://dribbble.com",
    icon: BookOpen,
  },
  {
    id: "r6",
    title: "Web3 Design Patterns",
    type: "Article",
    url: "https://www.web3designpatterns.com",
    icon: BookOpen,
  },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  BEGINNER: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  INTERMEDIATE: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  ADVANCED: "bg-red-500/10 text-red-400 border-red-500/20",
};

export const Route = createFileRoute("/learn/design")({
  head: () => ({
    meta: [
      { title: "Learn Design  UI/UX for Web3 | BlockchainClub FUTMinna" },
      {
        name: "description",
        content:
          "Master UI/UX and design skills tailored for crypto and Web3 products. From Figma basics to design systems.",
      },
      {
        property: "og:title",
        content: "Master Design  Blockchain Club FUTMinna",
      },
      {
        property: "og:description",
        content: "Tracks for UI/UX, Figma, prototyping, and Web3 design.",
      },
    ],
  }),
  component: DesignLearnPage,
});

function DesignLearnPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <LoginPrompt />;

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [resourceType, setResourceType] = useState<string>("all");

  const filteredTracks =
    categoryFilter === "all"
      ? DESIGN_TRACKS
      : DESIGN_TRACKS.filter((t) => t.category === categoryFilter);

  const filteredResources =
    resourceType === "all"
      ? DESIGN_RESOURCES
      : DESIGN_RESOURCES.filter((r) => r.type.toLowerCase() === resourceType);

  return (
    <div className="bg-background">
      {/* HERO */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1400px] px-6 py-16 md:py-24 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/5 px-3 py-1 text-label-bold text-primary">
            LEARN
          </span>
          <h1 className="mt-8 text-display-lg md:text-[56px] md:leading-[60px] tracking-tight">
            Master <span className="text-primary">Design</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-body-lg text-muted-foreground">
            Learn to craft beautiful, intuitive interfaces for crypto and Web3 products. From UI
            fundamentals to building scalable design systems.
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
                <div className="text-headline-sm">{DESIGN_TRACKS.length}</div>
                <div className="text-xs text-muted-foreground">Learning Tracks</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <div>
                <div className="text-headline-sm">
                  {DESIGN_TRACKS.reduce((acc, t) => acc + t.modules, 0)}
                </div>
                <div className="text-xs text-muted-foreground">Modules</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <PenTool className="h-5 w-5 text-primary" />
              <div>
                <div className="text-headline-sm">{DESIGN_RESOURCES.length}</div>
                <div className="text-xs text-muted-foreground">Resources</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRACKS */}
      <section className="mx-auto max-w-[1400px] px-6 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <h2 className="text-headline-lg">Learning Tracks</h2>
          <Tabs
            value={categoryFilter}
            onValueChange={(v) => setCategoryFilter(v as CategoryFilter)}
          >
            <TabsList className="bg-background/50">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="uiux">UI/UX</TabsTrigger>
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="tools">Tools</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {filteredTracks.map((track) => {
            const IconComp = track.icon;
            return (
              <Card
                key={track.id}
                className="group relative overflow-hidden border-border bg-card p-0 transition-all hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-sm"
              >
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-top rounded-r" />
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface-high text-lg">
                      <IconComp className="h-5 w-5 text-primary" />
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
                  <p className="mt-1 text-sm text-muted-foreground">
                    {track.category === "uiux"
                      ? "UI/UX Design"
                      : track.category === "branding"
                        ? "Brand & Identity"
                        : "Design Tools"}
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-2">
                    {track.description}
                  </p>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                      <span>Progress</span>
                      <span>0%</span>
                    </div>
                    <Progress value={0} className="h-1.5" />
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
            <Tabs value={resourceType} onValueChange={setResourceType}>
              <TabsList className="bg-background/50">
                <TabsTrigger value="all">All Types</TabsTrigger>
                <TabsTrigger value="docs">Docs</TabsTrigger>
                <TabsTrigger value="article">Articles</TabsTrigger>
                <TabsTrigger value="tool">Tools</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Tabs value={resourceType} onValueChange={setResourceType}>
            <TabsContent value={resourceType}>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredResources.map((resource) => {
                  const IconComp = resource.icon;
                  return (
                    <a
                      key={resource.id}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
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
                          <p className="mt-1 text-xs text-muted-foreground">{resource.type}</p>
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
            READY TO START YOUR
            <br />
            DESIGN JOURNEY?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Join the community and get access to all learning tracks, mentorship, and project
            opportunities.
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
