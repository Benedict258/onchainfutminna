import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { MarkdownContent } from "@/components/markdown-content";
import { LoginPrompt } from "@/components/login-prompt";
import { getTrackBySlug } from "@/lib/api/learn.server";
import { apiQueryAll, apiQuerySingle, apiCompleteModule } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import {
  ArrowLeft,
  BookOpen,
  Lock,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Trophy,
  Layers,
} from "lucide-react";

const PHASE_LABELS: Record<number, string> = {
  0: "Phase 0",
  1: "Phase 1",
  2: "Phase 2",
  3: "Phase 3",
  4: "Capstone",
};

const PHASE_NAMES: Record<number, string> = {
  0: "Foundation",
  1: "Core Concepts",
  2: "Advanced",
  3: "Mastery",
  4: "Capstone",
};

const ECOSYSTEM_LABELS: Record<string, string> = {
  EVM: "EVM / Solidity",
  SUI_MOVE: "Sui / Move",
  APTOS_MOVE: "Aptos / Move",
  SOLANA_RUST: "Solana / Rust",
  GENERAL: "General",
};

const ECOSYSTEM_COLORS: Record<string, string> = {
  EVM: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  SUI_MOVE: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  APTOS_MOVE: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  SOLANA_RUST: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  GENERAL: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  BEGINNER: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  INTERMEDIATE: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  ADVANCED: "bg-red-500/10 text-red-400 border-red-500/20",
};

const CATEGORY_COLORS: Record<string, string> = {
  technical: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "content-creation": "bg-pink-500/10 text-pink-400 border-pink-500/20",
  "community-management": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  marketing: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  research: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  design: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

export const Route = createFileRoute("/learn/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} — Learn | BlockchainClub FUTMinna` },
      { name: "description", content: "Interactive learning track from Blockchain Club FUTMinna." },
    ],
  }),
  component: TrackDetailPage,
});

function TrackDetailSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16 space-y-8">
      <Skeleton className="h-8 w-32" />
      <div className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

function TrackDetailPage() {
  const params = Route.useParams();
  const slug = params.slug;
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const fetchTrack = useServerFn(getTrackBySlug);

  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);
  const [activePhase, setActivePhase] = useState(0);
  const [completingModuleId, setCompletingModuleId] = useState<string | null>(null);

  const { data: track, isLoading, error } = useQuery({
    queryKey: ["track", slug],
    queryFn: () => fetchTrack({ data: { slug } }),
  });

  const { data: completedModuleIds = [] } = useQuery({
    queryKey: ["user-module-progress", slug, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const rows = await apiQueryAll("user_module_progress", {
        filters: { user_id: user.id },
        select: "module_id",
      });
      return (rows || []).map((r: any) => r.module_id as string);
    },
    enabled: !!user?.id,
  });

  const { data: leaderboardEntry } = useQuery({
    queryKey: ["leaderboard", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      return apiQuerySingle("leaderboard_entries", {
        filters: { user_id: user.id },
        select: "learn_points,total_points",
      });
    },
    enabled: !!user?.id,
  });

  const { data: trackGateChecks } = useQuery({
    queryKey: ["track-gate-checks-all", slug, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const rows = await apiQueryAll("gate_checks", {
        filters: { user_id: user.id },
        select: "id,gate_number,status,checked_at",
        order: { column: "gate_number", ascending: true },
      });
      return (rows || []) as { id: string; gate_number: number; status: string; checked_at: string | null }[];
    },
    enabled: !!user?.id,
  });

  if (isLoading) return <TrackDetailSkeleton />;

  if (error || !track) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16 text-center">
        <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/40" />
        <p className="mt-4 text-lg text-muted-foreground">Track not found.</p>
        <p className="mt-2 text-sm text-muted-foreground/60">
          The learning track you are looking for does not exist or has not been published yet.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/learn">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Learn
          </Link>
        </Button>
      </div>
    );
  }

  const phases = track.phases || [];
  const totalModules = track.totalModules || 0;

  const completedCount = completedModuleIds.filter((id: string) =>
    phases.some((p: any) => (p.modules || []).some((m: any) => m.id === id))
  ).length;
  const progressPercent = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

  const currentPhaseModules = phases[activePhase]?.modules || [];
  const isPhaseLocked = (phaseIdx: number) => {
    if (phaseIdx === 0) return false;
    const prevPhase = phases[phaseIdx - 1];
    if (!prevPhase || (prevPhase.modules || []).length === 0) return false;
    return (prevPhase.modules || []).some(
      (m: any) => !completedModuleIds.includes(m.id)
    );
  };

  function handleModuleExpand(moduleId: string) {
    setExpandedModuleId(expandedModuleId === moduleId ? null : moduleId);
  }

  function handlePhaseClick(phaseIdx: number) {
    setActivePhase(phaseIdx);
    document.getElementById(`phase-${phaseIdx}`)?.scrollIntoView({ behavior: "smooth" });
  }

  async function handleMarkComplete(moduleId: string) {
    if (!user?.id) return;
    if (completedModuleIds.includes(moduleId)) return;

    setCompletingModuleId(moduleId);
    try {
      const result = await apiCompleteModule(moduleId);
      if (result.alreadyCompleted) {
        toast.info("Module already completed!");
      } else {
        toast.success("Module completed! +5 points");
      }
      queryClient.invalidateQueries({ queryKey: ["user-module-progress", slug, user.id] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard", user.id] });
    } catch (err: any) {
      if (err.message?.includes("duplicate") || err.message?.includes("unique")) {
        toast.info("Module already completed!");
        queryClient.invalidateQueries({ queryKey: ["user-module-progress", slug, user.id] });
      } else {
        toast.error(err.message || "Failed to mark complete");
      }
    } finally {
      setCompletingModuleId(null);
    }
  }

  return (
    <TooltipProvider>
      <div className="bg-background">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <Button asChild variant="ghost" className="mb-6 -ml-2">
            <Link to="/learn">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Learn
            </Link>
          </Button>

          <div className="mb-10">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant="outline" className={ECOSYSTEM_COLORS[track.ecosystem] || ECOSYSTEM_COLORS.GENERAL}>
                {ECOSYSTEM_LABELS[track.ecosystem] || track.ecosystem}
              </Badge>
              {(track.category || track.difficulty) && (
                <Badge
                  variant="outline"
                  className={
                    track.category && CATEGORY_COLORS[track.category]
                      ? CATEGORY_COLORS[track.category]
                      : DIFFICULTY_COLORS[track.difficulty] || ""
                  }
                >
                  {track.category || track.difficulty}
                </Badge>
              )}
            </div>

            <h1 className="text-headline-xl md:text-display-md tracking-tight mb-4">{track.title}</h1>
            {track.description && (
              <p className="text-body-lg text-muted-foreground max-w-3xl leading-relaxed">
                {track.description}
              </p>
            )}

            {isAuthenticated && totalModules > 0 && (
              <div className="mt-6 flex items-center gap-4">
                <div className="flex-1 max-w-xs">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                    <span>Progress</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                </div>
                <Badge variant="secondary" className="text-xs">
                  {completedCount}/{totalModules} modules
                </Badge>
                {leaderboardEntry && (
                  <Badge variant="outline" className="text-xs bg-primary/5 border-primary/20">
                    <Trophy className="mr-1 h-3 w-3 text-primary" />
                    {leaderboardEntry.learn_points || 0} learn pts
                  </Badge>
                )}
              </div>
            )}
          </div>

          <div className="mb-12">
            <h2 className="text-headline-sm mb-4">Phases</h2>
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {phases.map((phase: any) => {
                const locked = isPhaseLocked(phase.phase);
                const isActive = activePhase === phase.phase;
                return (
                  <Tooltip key={phase.phase}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handlePhaseClick(phase.phase)}
                        className={`
                          relative rounded-lg border p-4 text-left transition-all cursor-pointer
                          ${isActive
                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                            : locked
                              ? "border-border bg-muted/30 opacity-60 cursor-not-allowed"
                              : "border-border bg-card hover:border-primary/40 hover:bg-surface-low"
                          }
                        `}
                      >
                        {locked && (
                          <Lock className="absolute top-2 right-2 h-3.5 w-3.5 text-muted-foreground/60" />
                        )}
                        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          {PHASE_LABELS[phase.phase] || `Phase ${phase.phase}`}
                        </div>
                        <div className="mt-1 text-sm font-semibold text-foreground leading-tight line-clamp-2">
                          {phase.name}
                        </div>
                        <div className="mt-2 text-[11px] text-muted-foreground">
                          {phase.moduleCount} module{phase.moduleCount !== 1 ? "s" : ""}
                        </div>
                      </button>
                    </TooltipTrigger>
                    {locked && (
                      <TooltipContent>
                        <p>Complete Gate {phase.phase} to unlock</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_280px] gap-8">
            <div id={`phase-${activePhase}`}>
              <h2 className="text-headline-sm mb-4">
                {PHASE_NAMES[activePhase] || `Phase ${activePhase}`} — Modules
              </h2>

              {currentPhaseModules.length === 0 ? (
                <div className="text-center py-12 rounded-lg border border-border bg-card">
                  <Layers className="mx-auto h-10 w-10 text-muted-foreground/40" />
                  <p className="mt-3 text-muted-foreground">No modules in this phase yet.</p>
                  <p className="mt-1 text-sm text-muted-foreground/60">
                    Content is being prepared. Check back soon!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentPhaseModules.map((mod: any) => {
                    const isCompleted = completedModuleIds.includes(mod.id);
                    const isExpanded = expandedModuleId === mod.id;

                    return (
                      <Card
                        key={mod.id}
                        className={`border-border bg-card transition-all ${isExpanded ? "ring-1 ring-primary/20" : ""}`}
                      >
                        <button
                          onClick={() => handleModuleExpand(mod.id)}
                          className="w-full text-left p-5 flex items-start gap-4"
                        >
                          <div className="shrink-0 mt-0.5">
                            {isCompleted ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            ) : (
                              <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-semibold text-foreground">{mod.title}</h3>
                              {isCompleted && (
                                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                  Completed
                                </Badge>
                              )}
                            </div>
                            {mod.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {mod.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground/60">
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3 w-3" />~5 min read
                              </span>
                            </div>
                          </div>
                          <div className="shrink-0 text-muted-foreground/60">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="px-5 pb-5 border-t border-border">
                            <div className="pt-5">
                              <MarkdownContent content={mod.content || mod.description || ""} />

                              <div className="mt-6 pt-5 border-t border-border">
                                {!isAuthenticated ? (
                                  <LoginPrompt inline />
                                ) : isCompleted ? (
                                  <div className="flex items-center gap-2 text-sm text-emerald-500">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Already Completed
                                  </div>
                                ) : (
                                  <Button
                                    onClick={() => handleMarkComplete(mod.id)}
                                    disabled={completingModuleId === mod.id}
                                    className="font-semibold tracking-wide"
                                  >
                                    {completingModuleId === mod.id ? (
                                      "Marking..."
                                    ) : (
                                      <>
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        Mark as Complete
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <Card className="border-border bg-card">
                <CardContent className="p-5 space-y-4">
                  <h3 className="text-headline-sm">Track Progress</h3>
                  {totalModules > 0 ? (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Completion</span>
                        <span className="font-semibold text-foreground">
                          {isAuthenticated ? `${progressPercent}%` : "\u2014"}
                        </span>
                      </div>
                      <Progress value={isAuthenticated ? progressPercent : 0} className="h-2" />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Modules Done</span>
                        <span className="font-semibold text-foreground">
                          {isAuthenticated ? `${completedCount} / ${totalModules}` : `\u2014 / ${totalModules}`}
                        </span>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No modules available.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border bg-card">
                <CardContent className="p-5 space-y-3">
                  <h3 className="text-headline-sm">Gate Status</h3>
                  {isAuthenticated && trackGateChecks ? (
                    [1, 2, 3].map((gateNum) => {
                      const check = (trackGateChecks || []).find(
                        (g: any) => g.gate_number === gateNum,
                      );
                      const status = check?.status || "not_started";
                      const checkedAt = check?.checked_at || null;
                      const isPassed = status === "passed";
                      const isPending = status === "pending";
                      return (
                        <div
                          key={gateNum}
                          className={`flex items-center justify-between text-sm py-1.5 px-2 rounded-md ${
                            isPassed
                              ? "bg-green-500/5"
                              : isPending
                                ? "bg-yellow-500/5"
                                : "bg-muted/30"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {isPassed ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                            ) : isPending ? (
                              <Clock className="h-3.5 w-3.5 text-yellow-500" />
                            ) : (
                              <Lock className="h-3.5 w-3.5 text-muted-foreground/60" />
                            )}
                            <span className="text-muted-foreground">Gate {gateNum}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={
                                isPassed
                                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                                  : isPending
                                    ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                    : "bg-muted text-muted-foreground border-border"
                              }
                            >
                              {isPassed ? "Passed" : isPending ? "Pending" : "Not Started"}
                            </Badge>
                            {checkedAt && (
                              <span className="text-[11px] text-muted-foreground">
                                {new Date(checkedAt).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-3">
                      <p className="text-sm text-muted-foreground">
                        {isAuthenticated ? "Not started" : "Sign in to view"}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {isAuthenticated && leaderboardEntry && (
                <Card className="border-border bg-card">
                  <CardContent className="p-5 space-y-2">
                    <h3 className="text-headline-sm flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-primary" />
                      Learning Points
                    </h3>
                    <p className="text-display-sm font-bold text-foreground">
                      {leaderboardEntry.learn_points || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Earn points by completing modules
                    </p>
                  </CardContent>
                </Card>
              )}

              {!isAuthenticated && (
                <Card className="border-border bg-card">
                  <CardContent className="p-5 text-center space-y-3">
                    <Lock className="mx-auto h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                      Sign in to track your progress and earn points.
                    </p>
                    <Button asChild className="w-full" size="sm">
                      <Link to="/auth">Sign In</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
