import { createFileRoute, Link, Outlet, useMatchRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, BookOpen, CheckCircle2, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MarkdownContent } from "@/components/markdown-content";
import { LoginPrompt } from "@/components/login-prompt";
import { ModuleQuiz, getModuleQuizId } from "@/components/learning/module-quiz";
import { getTrackBySlug } from "@/lib/api/learn.server";
import { apiCompleteModule, apiQueryAll } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import { useState } from "react";

const DEV3PACK = "dev3pack-solana-rust-bootcamp";
const SECTION_LABELS: Record<string, string> = {
  setup: "Setup",
  homework: "Homework",
  "week-1": "Week 1",
  "week-2": "Week 2",
  "week-3": "Week 3",
  resources: "Resources",
};
const SLIDES = [
  "https://docs.google.com/presentation/d/17oNtv7vFOT_eu9HGiArgcBIkKgAyaIkl/edit",
  "https://docs.google.com/presentation/d/14iPk5RF87r6tdxJPq57ot43dPaRIIefa/edit",
  "https://docs.google.com/presentation/d/1X7SLmG_wwf70QAsO5pti4iznv1x3MEcItp0zkCF2jX0/edit",
];

export const Route = createFileRoute("/learn/$slug/$section")({
  head: ({ params }) => ({
    meta: [{ title: `${SECTION_LABELS[params.section] || "Learning"} | Dev3Pack` }],
  }),
  component: Dev3PackSectionPage,
});

function Dev3PackSectionPage() {
  const { slug, section } = Route.useParams();
  const matchRoute = useMatchRoute();
  const isWeekOneSession = !!matchRoute({ to: "/learn/$slug/$section/$session" });
  const { user, isAuthenticated } = useAuthStore();
  const fetchTrack = useServerFn(getTrackBySlug);
  const queryClient = useQueryClient();
  const [completing, setCompleting] = useState<string | null>(null);

  const { data: track, isLoading, error } = useQuery({
    queryKey: ["track", slug],
    queryFn: () => fetchTrack({ data: { slug } }),
    enabled: slug === DEV3PACK && isAuthenticated,
  });
  const { data: completed = [] } = useQuery({
    queryKey: ["user-module-progress", slug, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const rows = await apiQueryAll("user_module_progress", {
        filters: { user_id: user.id },
        select: "module_id",
      });
      return (rows || []).map((row: any) => row.module_id as string);
    },
    enabled: !!user?.id && isAuthenticated,
  });

  if (slug !== DEV3PACK) {
    return <NotFoundSection />;
  }
  if (!isAuthenticated) return <LoginPrompt />;
  if (isLoading) return <div className="mx-auto max-w-screen-2xl px-4 py-16 text-muted-foreground">Loading section...</div>;
  if (error || !track) return <NotFoundSection />;
  if (section === "week-1" && isWeekOneSession) return <Outlet />;

  const modules = (track.phases || []).flatMap((phase: any) => phase.modules || [])
    .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
  const sectionModules = getSectionModules(section, modules);
  const currentLabel = SECTION_LABELS[section] || "Learning";

  async function markComplete(moduleId: string) {
    if (!user?.id || completed.includes(moduleId)) return;
    setCompleting(moduleId);
    try {
      await apiCompleteModule(moduleId, 10);
      toast.success("Module completed! +10 points");
      queryClient.invalidateQueries({ queryKey: ["user-module-progress", slug, user.id] });
    } catch (completionError: any) {
      toast.error(completionError.message || "Failed to mark complete");
    } finally {
      setCompleting(null);
    }
  }

  return (
    <div className="bg-background">
      <div className="mx-auto w-full max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Button asChild variant="ghost" className="-ml-2">
            <Link to={`/learn/${slug}` as any}><ArrowLeft className="mr-2 h-4 w-4" /> Program overview</Link>
          </Button>
          <Badge variant="outline">Dev3Pack Solana Rust Bootcamp</Badge>
        </div>
        <div className="mt-8 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="h-fit rounded-xl border border-border bg-surface-low p-3 lg:sticky lg:top-24">
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Course sections</p>
            <nav className="grid grid-cols-2 gap-1 lg:grid-cols-1">
              {Object.entries(SECTION_LABELS).map(([key, label]) => (
                <Link
                  key={key}
                  to={`/learn/${slug}/${key}` as any}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${key === section ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-surface-high hover:text-foreground"}`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </aside>
          <main className="min-w-0">
            <div className="mb-8">
              <p className="text-sm font-medium text-primary">Dev3Pack learning path</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{currentLabel}</h1>
              <p className="mt-3 max-w-3xl text-muted-foreground">
                {section === "week-1"
                  ? "Watch each session beside its slide deck, then complete the module quiz."
                  : "Work through this section at your own pace and mark each module complete when you are done."}
              </p>
            </div>
            {section === "week-1" ? (
              <WeekOneSessionMenu />
            ) : sectionModules.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center sm:p-12">
                <Clock className="mx-auto h-10 w-10 text-muted-foreground/50" />
                <h2 className="mt-4 text-xl font-semibold">{currentLabel} is coming soon</h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  This part of the bootcamp will be published here as soon as the sessions are ready.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {sectionModules.map((module: any, index: number) => (
                  <ModuleCard
                    key={module.id}
                    module={module}
                    index={index}
                    slideUrl={section === "week-1" ? SLIDES[index] : undefined}
                    isCompleted={completed.includes(module.id)}
                    completing={completing === module.id}
                    onComplete={() => markComplete(module.id)}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function WeekOneSessionMenu() {
  const sessions = [
    ["1", "Basics of Rust - 1", "Monday, November 2 · 3:00 PM · Deepesh"],
    ["2", "Basics of Rust - 2", "Tuesday, November 3 · 3:00 PM · Deepesh"],
    ["3", "Basics of Blockchain", "Wednesday, November 4 · 3:00 PM · Deepesh"],
  ];
  return (
    <details className="group rounded-xl border border-border bg-card shadow-sm" open>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 font-semibold sm:p-5 [&::-webkit-details-marker]:hidden">
        <span>Choose a Week 1 session</span>
        <span className="text-sm font-normal text-muted-foreground transition-transform group-open:rotate-180">⌄</span>
      </summary>
      <div className="border-t border-border p-3 sm:p-4">
        <div className="space-y-2">
          {sessions.map(([session, title, meta]) => (
            <Link
              key={session}
              to={`/learn/dev3pack-solana-rust-bootcamp/week-1/${session}` as any}
              className="flex items-center justify-between gap-4 rounded-lg border border-border p-4 transition-colors hover:border-primary/50 hover:bg-surface-low"
            >
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{title}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{meta}</span>
              </span>
              <span className="shrink-0 text-sm text-primary">Open session →</span>
            </Link>
          ))}
        </div>
      </div>
    </details>
  );
}

function ModuleCard({
  module,
  index,
  slideUrl,
  isCompleted,
  completing,
  onComplete,
}: {
  module: any;
  index: number;
  slideUrl?: string;
  isCompleted: boolean;
  completing: boolean;
  onComplete: () => void;
}) {
  const quizId = getModuleQuizId(module);
  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Session {index + 1}</Badge>
            {quizId && <Badge variant="outline">Quiz</Badge>}
            {isCompleted && <Badge className="bg-emerald-500/10 text-emerald-500">Completed</Badge>}
          </div>
          <h2 className="mt-3 text-xl font-semibold sm:text-2xl">{module.title.replace(/^(Setup|Homework|Week 1):\s*/, "")}</h2>
          {module.description && <p className="mt-2 text-sm text-muted-foreground">{module.description}</p>}
        </div>
        <BookOpen className="hidden h-6 w-6 shrink-0 text-primary sm:block" />
      </div>
      {slideUrl ? (
        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <div className="min-w-0"><MarkdownContent content={module.content || ""} /></div>
          <div className="min-w-0">
            <h3 className="mb-3 text-sm font-semibold">Session slides</h3>
            <MarkdownContent content={`{{slides:${slideUrl}}}`} />
          </div>
        </div>
      ) : (
        <div className="mt-6"><MarkdownContent content={module.content || ""} /></div>
      )}
      {sectionIsResources(module) && (
        <a href="https://doc.rust-lang.org/book/" target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center text-sm text-primary hover:underline">
          Open the Rust Book <ExternalLink className="ml-1 h-3.5 w-3.5" />
        </a>
      )}
      {quizId && <ModuleQuiz quizId={quizId} />}
      <div className="mt-6 flex justify-end border-t border-border pt-5">
        <Button onClick={onComplete} disabled={isCompleted || completing} variant={isCompleted ? "secondary" : "default"}>
          {isCompleted ? <><CheckCircle2 className="mr-2 h-4 w-4" /> Completed</> : completing ? "Saving..." : "Mark complete"}
        </Button>
      </div>
    </article>
  );
}

function getSectionModules(section: string, modules: any[]) {
  if (section === "setup") return modules.filter((module) => module.order === 1);
  if (section === "homework") return modules.filter((module) => module.order === 2);
  if (section === "week-1") return modules.filter((module) => [3, 4, 5].includes(module.order));
  if (section === "resources") return modules.filter((module) => module.order === 6);
  return [];
}

function sectionIsResources(module: any) {
  return module.order === 6;
}

function NotFoundSection() {
  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-16 text-center">
      <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/40" />
      <h1 className="mt-4 text-xl font-semibold">Section not found</h1>
      <Button asChild variant="outline" className="mt-6"><Link to="/learn">Back to Learn</Link></Button>
    </div>
  );
}
