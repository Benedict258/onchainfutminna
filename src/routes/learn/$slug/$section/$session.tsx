import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
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
const SESSIONS = [
  {
    title: "Basics of Rust - 1",
    meta: "Monday, November 2 · 3:00 PM · Deepesh",
    slides: "https://docs.google.com/presentation/d/17oNtv7vFOT_eu9HGiArgcBIkKgAyaIkl/edit",
  },
  {
    title: "Basics of Rust - 2",
    meta: "Tuesday, November 3 · 3:00 PM · Deepesh",
    slides: "https://docs.google.com/presentation/d/14iPk5RF87r6tdxJPq57ot43dPaRIIefa/edit",
  },
  {
    title: "Basics of Blockchain",
    meta: "Wednesday, November 4 · 3:00 PM · Deepesh",
    slides: "https://docs.google.com/presentation/d/1X7SLmG_wwf70QAsO5pti4iznv1x3MEcItp0zkCF2jX0/edit",
  },
];

export const Route = createFileRoute("/learn/$slug/$section/$session")({
  head: ({ params }) => ({
    meta: [{ title: `Week 1 Session ${params.session} | Dev3Pack` }],
  }),
  component: WeekOneSessionPage,
});

function WeekOneSessionPage() {
  const { slug, section, session } = Route.useParams();
  const sessionIndex = Number(session) - 1;
  const sessionInfo = SESSIONS[sessionIndex];
  const { user, isAuthenticated } = useAuthStore();
  const fetchTrack = useServerFn(getTrackBySlug);
  const queryClient = useQueryClient();
  const [completing, setCompleting] = useState(false);

  const { data: track, isLoading } = useQuery({
    queryKey: ["track", slug],
    queryFn: () => fetchTrack({ data: { slug } }),
    enabled: slug === DEV3PACK && section === "week-1" && isAuthenticated,
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

  if (!isAuthenticated) return <LoginPrompt />;
  if (slug !== DEV3PACK || section !== "week-1" || !sessionInfo) {
    return <div className="mx-auto max-w-screen-2xl px-4 py-16 text-center">Session not found.</div>;
  }
  if (isLoading || !track) {
    return <div className="mx-auto max-w-screen-2xl px-4 py-16 text-muted-foreground">Loading session...</div>;
  }

  const modules = (track.phases || []).flatMap((phase: any) => phase.modules || []);
  const module = modules.find((item: any) => item.order === sessionIndex + 3);
  if (!module) return <div className="mx-auto max-w-screen-2xl px-4 py-16 text-center">Session not found.</div>;
  const quizId = getModuleQuizId(module);
  const isCompleted = completed.includes(module.id);

  async function markComplete() {
    if (!user?.id || isCompleted || completing) return;
    setCompleting(true);
    try {
      await apiCompleteModule(module.id, 10);
      toast.success("Session completed! +10 points");
      queryClient.invalidateQueries({ queryKey: ["user-module-progress", slug, user.id] });
    } catch (error: any) {
      toast.error(error.message || "Failed to mark complete");
    } finally {
      setCompleting(false);
    }
  }

  return (
    <div className="bg-background">
      <div className="mx-auto w-full max-w-screen-2xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <Link to={`/learn/${slug}/week-1` as any} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Week 1 sessions
        </Link>
        <div className="mt-8 max-w-4xl">
          <Badge variant="secondary">Week 1 · Session {session}</Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">{sessionInfo.title}</h1>
          <p className="mt-3 text-muted-foreground">{sessionInfo.meta}</p>
        </div>
        <div className="mt-8 grid gap-8 xl:grid-cols-2">
          <section className="min-w-0 rounded-xl border border-border bg-card p-4 sm:p-6">
            <MarkdownContent content={module.content || ""} />
          </section>
          <section className="min-w-0 rounded-xl border border-border bg-card p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold">Session slides</h2>
            <MarkdownContent content={`{{slides:${sessionInfo.slides}}}`} />
          </section>
        </div>
        {quizId && <ModuleQuiz quizId={quizId} />}
        <div className="mt-6 flex justify-end border-t border-border pt-5">
          <Button onClick={markComplete} disabled={isCompleted || completing} variant={isCompleted ? "secondary" : "default"}>
            {isCompleted ? <><CheckCircle2 className="mr-2 h-4 w-4" /> Completed</> : completing ? "Saving..." : "Mark complete"}
          </Button>
        </div>
      </div>
    </div>
  );
}
