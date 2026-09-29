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
  Pen,
  Video,
  FileText,
  Layers,
  CheckCircle2,
  Camera,
  Mic,
  Presentation,
  Lightbulb,
  MessageSquare,
  PenTool,
  BookMarked,
  PenLine,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

const TRACK_CARDS = [
  {
    id: "technical-writing",
    icon: Pen,
    title: "Technical Writing",
    category: "Written Content",
    description:
      "Craft clear, concise documentation for smart contracts, protocols, and developer tools that bridges the gap between complex code and user understanding.",
    modules: 8,
    difficulty: "BEGINNER",
    progress: 0,
  },
  {
    id: "video-production",
    icon: Video,
    title: "Video Production",
    category: "Multimedia",
    description:
      "Produce high-quality tutorials, demos, and educational content covering blockchain concepts, walkthroughs, and project showcases.",
    modules: 6,
    difficulty: "INTERMEDIATE",
    progress: 0,
  },
  {
    id: "documentation",
    icon: FileText,
    title: "Documentation Design",
    category: "Structured Content",
    description:
      "Design and maintain comprehensive documentation systems including API references, SDK guides, and integration tutorials.",
    modules: 7,
    difficulty: "INTERMEDIATE",
    progress: 0,
  },
  {
    id: "content-strategy",
    icon: Lightbulb,
    title: "Content Strategy",
    category: "Planning",
    description:
      "Develop content calendars, audience analysis frameworks, and distribution strategies to maximize reach and engagement in the Web3 space.",
    modules: 5,
    difficulty: "BEGINNER",
    progress: 0,
  },
  {
    id: "visual-design",
    icon: Camera,
    title: "Visual Content Design",
    category: "Visual Media",
    description:
      "Create infographics, diagrams, and visual assets that simplify complex blockchain architectures and tokenomics models.",
    modules: 6,
    difficulty: "ADVANCED",
    progress: 0,
  },
  {
    id: "community-narratives",
    icon: MessageSquare,
    title: "Community Narratives",
    category: "Storytelling",
    description:
      "Build compelling narratives around projects, DAOs, and decentralized communities to drive engagement and foster understanding.",
    modules: 4,
    difficulty: "BEGINNER",
    progress: 0,
  },
];

const RESOURCES = [
  {
    id: "r1",
    title: "Web3 Technical Writing Guide",
    type: "ARTICLE",
    url: "#",
  },
  {
    id: "r2",
    title: "Crypto Content Creation Masterclass",
    type: "VIDEO",
    url: "#",
  },
  {
    id: "r3",
    title: "Solidity Documentation Best Practices",
    type: "DOCS",
    url: "#",
  },
  {
    id: "r4",
    title: "Canva for Blockchain Projects",
    type: "TOOL",
    url: "#",
  },
  {
    id: "r5",
    title: "DAO Governance Proposal Writing",
    type: "ARTICLE",
    url: "#",
  },
  {
    id: "r6",
    title: "Building Blockchain YouTube Channels",
    type: "VIDEO",
    url: "#",
  },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  BEGINNER: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  INTERMEDIATE: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  ADVANCED: "bg-red-500/10 text-red-400 border-red-500/20",
};

const RESOURCE_TYPE_ICONS: Record<string, typeof BookOpen> = {
  ARTICLE: FileText,
  VIDEO: Video,
  DOCS: BookOpen,
  TOOL: PenTool,
  TUTORIAL: Presentation,
};

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  ARTICLE: "Article",
  VIDEO: "Video",
  DOCS: "Docs",
  TOOL: "Tool",
  TUTORIAL: "Tutorial",
};

export const Route = createFileRoute("/learn/content-creation")({
  head: () => ({
    meta: [
      { title: "Content Creation  Learn | BlockchainClub FUTMinna" },
      {
        name: "description",
        content:
          "Master content creation for Web3. Learn technical writing, video production, documentation design, and community narratives.",
      },
      {
        property: "og:title",
        content: "Master Content Creation  Blockchain Club FUTMinna",
      },
      {
        property: "og:description",
        content:
          "Transform complex blockchain concepts into accessible, engaging educational content.",
      },
    ],
  }),
  component: ContentCreationPage,
});

function ContentCreationPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <LoginPrompt />;

  const [resourceType, setResourceType] = useState<string>("all");

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
            Master <span className="text-primary">Content</span>
            <br />
            Creation
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-body-lg text-muted-foreground">
            Simplifying complex technical concepts into accessible educational
            assets. From documentation to video production, build the content
            skills that power Web3 adoption.
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
                <div className="text-headline-sm">{TRACK_CARDS.length}</div>
                <div className="text-xs text-muted-foreground">
                  Learning Tracks
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <div>
                <div className="text-headline-sm">
                  {TRACK_CARDS.reduce((acc, t) => acc + t.modules, 0)}
                </div>
                <div className="text-xs text-muted-foreground">Modules</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <div className="text-headline-sm">{RESOURCES.length}</div>
                <div className="text-xs text-muted-foreground">Resources</div>
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
          {TRACK_CARDS.map((track) => {
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
                    {track.category}
                  </p>
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
                      Start Learning{" "}
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
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

          <Tabs value={resourceType} onValueChange={setResourceType}>
            <TabsList className="mb-6 bg-background/50">
              <TabsTrigger value="all">All Types</TabsTrigger>
              <TabsTrigger value="ARTICLE">Articles</TabsTrigger>
              <TabsTrigger value="VIDEO">Videos</TabsTrigger>
              <TabsTrigger value="DOCS">Docs</TabsTrigger>
              <TabsTrigger value="TOOL">Tools</TabsTrigger>
            </TabsList>

            <TabsContent value={resourceType}>
              {filteredResources.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-10 w-10 text-muted-foreground/40" />
                  <p className="mt-3 text-muted-foreground">
                    No resources found.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredResources.map((resource) => {
                    const IconComp =
                      RESOURCE_TYPE_ICONS[resource.type || ""] || FileText;
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
                            <p className="mt-1 text-xs text-muted-foreground">
                              {RESOURCE_TYPE_LABELS[resource.type] ||
                                resource.type}
                            </p>
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}
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
            CONTENT JOURNEY?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Join the community and get access to all content creation tracks,
            mentorship, and project opportunities.
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
              <Link to="/learn">Back to Learn</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}


