import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LoginPrompt } from "@/components/login-prompt";
import {
  Search,
  ArrowRight,
  BarChart3,
  Shield,
  LineChart,
  BookOpen,
  CheckCircle2,
  Layers,
  GraduationCap,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

const TRACKS = [
  {
    id: "tokenomics",
    title: "Tokenomics",
    subtitle: "Design & Analysis",
    icon: BarChart3,
    difficulty: "ADVANCED",
    modules: 8,
    description:
      "Master token supply models, emission schedules, vesting curves, and incentive mechanism design for sustainable blockchain economies.",
    tags: ["Economics", "Modeling", "Simulation"],
  },
  {
    id: "data-analysis",
    title: "On-Chain Data Analysis",
    subtitle: "Analytics & Intelligence",
    icon: LineChart,
    difficulty: "INTERMEDIATE",
    modules: 10,
    description:
      "Learn to query, interpret, and visualize on-chain data using tools like Dune, Flipside, and custom indexing solutions.",
    tags: ["SQL", "Indexing", "Visualization"],
  },
  {
    id: "protocol-auditing",
    title: "Protocol Auditing",
    subtitle: "Security & Assurance",
    icon: Shield,
    difficulty: "ADVANCED",
    modules: 12,
    description:
      "Develop the skills to identify vulnerabilities, audit smart contracts, and perform formal verification of protocol logic.",
    tags: ["Security", "Formal Verification", "Risk"],
  },
  {
    id: "market-research",
    title: "Market Research",
    subtitle: "Strategy & Positioning",
    icon: Search,
    difficulty: "BEGINNER",
    modules: 6,
    description:
      "Analyze blockchain ecosystems, evaluate projects, and understand competitive landscapes in the rapidly evolving Web3 space.",
    tags: ["Analysis", "Evaluation", "Trends"],
  },
];

const RESOURCES = [
  {
    id: "r1",
    title: "Tokenomics Design Framework",
    type: "Guide",
    url: "#",
    icon: BarChart3,
  },
  {
    id: "r2",
    title: "On-Chain Analytics Fundamentals",
    type: "Course",
    url: "#",
    icon: LineChart,
  },
  {
    id: "r3",
    title: "Smart Contract Audit Methodology",
    type: "Documentation",
    url: "#",
    icon: Shield,
  },
  {
    id: "r4",
    title: "DeFi Risk Assessment Models",
    type: "Research Paper",
    url: "#",
    icon: BookOpen,
  },
  {
    id: "r5",
    title: "Blockchain Data Indexing Patterns",
    type: "Technical Guide",
    url: "#",
    icon: Search,
  },
  {
    id: "r6",
    title: "Economic Security Analysis",
    type: "Report",
    url: "#",
    icon: Shield,
  },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  BEGINNER: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  INTERMEDIATE: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  ADVANCED: "bg-red-500/10 text-red-400 border-red-500/20",
};

export const Route = createFileRoute("/learn/research")({
  head: () => ({
    meta: [
      { title: "Research  Master Blockchain Research | BlockchainClub FUTMinna" },
      {
        name: "description",
        content:
          "Specialized research tracks for tokenomics, data analysis, protocol auditing, and market research in the Web3 ecosystem.",
      },
      {
        property: "og:title",
        content: "Master Blockchain Research  Blockchain Club FUTMinna",
      },
      {
        property: "og:description",
        content:
          "Deep-dive into tokenomics, on-chain analytics, protocol auditing, and market research.",
      },
    ],
  }),
  component: ResearchPage,
});

function ResearchPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <LoginPrompt />;

  return (
    <div className="bg-background">
      {/* HERO */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-[1400px] px-6 py-16 md:py-24 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/5 px-3 py-1 text-label-bold text-primary">
            LEARN
          </span>
          <h1 className="mt-8 text-display-lg md:text-[56px] md:leading-[60px] tracking-tight">
            Master <span className="text-primary">Research</span>
            <br />& Analysis
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-body-lg text-muted-foreground">
            Deep-dive into tokenomics design, on-chain data analysis, protocol auditing, and market
            research. Build the analytical foundation for Web3.
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
                <div className="text-xs text-muted-foreground">Research Tracks</div>
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
                <div className="text-xs text-muted-foreground">Certifications</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRACKS */}
      <section className="mx-auto max-w-[1400px] px-6 py-16">
        <div className="flex items-end justify-between mb-8">
          <h2 className="text-headline-lg">Research Tracks</h2>
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
                  <p className="mt-1 text-sm text-muted-foreground">{track.subtitle}</p>
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed line-clamp-2">
                    {track.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {track.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-md border border-border bg-surface-low px-2 py-0.5 text-[10px] text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
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
                      Explore Track <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
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
          <h2 className="text-headline-lg mb-8">Research Resources</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {RESOURCES.map((resource) => {
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
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1400px] px-6 py-16">
        <div className="relative overflow-hidden rounded-xl border border-border bg-surface-low p-10 md:p-14 text-center">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
          <h2 className="mt-6 text-headline-lg">
            READY TO DIVE INTO
            <br />
            BLOCKCHAIN RESEARCH?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Join the community and get access to all research tracks, mentorship, and collaborative
            research opportunities.
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


