import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoginPrompt } from "@/components/login-prompt";
import { toast } from "sonner";
import {
  Users,
  Clock,
  Timer,
  CheckCircle2,
  Link2,
  Plus,
  ExternalLink,
  Star,
  History,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { apiQueryAll, apiInsert, apiUpdate, apiLogCommunityActivity } from "@/lib/api-client";

export const Route = createFileRoute("/pair")({
  head: () => ({
    meta: [
      { title: "Pair Programming | BlockchainClub FUTMinna" },
      { name: "description", content: "Find a coding partner and pair program together." },
    ],
  }),
  component: PairPage,
});

const DURATIONS = [
  { value: "30", label: "30 min" },
  { value: "45", label: "45 min" },
  { value: "60", label: "60 min" },
] as const;

function formatTimeLeft(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function PairSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10 space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    </div>
  );
}

function PairPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  if (!isAuthenticated) return <LoginPrompt />;

  return <PairPageContent userId={user!.id} />;
}

function PairPageContent({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [problemLink, setProblemLink] = useState("");
  const [duration, setDuration] = useState("30");
  const [creating, setCreating] = useState(false);
  const [completing, setCompleting] = useState<string | null>(null);

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["pair-sessions", userId],
    queryFn: async () => {
      const mySessions = await apiQueryAll("pair_sessions", {
        filters: { user_id: userId },
        order: { column: "created_at", ascending: false },
      });
      const partnerSessions = await apiQueryAll("pair_sessions", {
        filters: { partner_id: userId },
        order: { column: "created_at", ascending: false },
      });
      return [...(mySessions || []), ...(partnerSessions || [])] as PairSession[];
    },
  });

  async function handleCreate() {
    setCreating(true);
    try {
      await apiInsert("pair_sessions", {
        user_id: userId,
        status: "waiting",
        problem_link: problemLink || null,
        duration_minutes: parseInt(duration),
      });
      toast.success("Session created! Waiting for a partner to join.");
      queryClient.invalidateQueries({ queryKey: ["pair-sessions", userId] });
      setShowCreate(false);
      setProblemLink("");
      setDuration("30");
    } catch (e: any) {
      toast.error(e.message || "Failed to create session");
    } finally {
      setCreating(false);
    }
  }

  async function handleComplete(session: PairSession) {
    setCompleting(session.id);
    try {
      await apiUpdate(
        "pair_sessions",
        { status: "completed", completed_at: new Date().toISOString() },
        { id: session.id },
      );
      await apiLogCommunityActivity("pair_programming", "Completed pair programming session", 5);
      toast.success("Session completed! +5 community points earned.");
      queryClient.invalidateQueries({ queryKey: ["pair-sessions", userId] });
    } catch (e: any) {
      toast.error(e.message || "Failed to complete session");
    } finally {
      setCompleting(null);
    }
  }

  const activeSessions = (sessions || []).filter(
    (s) => s.status === "waiting" || s.status === "matched",
  );
  const historySessions = (sessions || []).filter((s) => s.status === "completed");

  if (isLoading) return <PairSkeleton />;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-display-sm md:text-display-md tracking-tight">
            Pair Programming &mdash; Code Together
          </h1>
          <p className="mt-2 text-muted-foreground">
            Find a partner, solve problems together, and earn community points.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-8">
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Find a Partner
        </Button>
        <Badge variant="secondary" className="text-xs gap-1">
          <Star className="h-3 w-3" />
          +5 points per completed session
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="text-headline-sm mb-4 flex items-center gap-2">
            <Timer className="h-5 w-5 text-primary" />
            Active Sessions
          </h2>
          {activeSessions.length === 0 ? (
            <Card className="border-border bg-card">
              <CardContent className="p-8 text-center text-muted-foreground">
                <Users className="mx-auto h-10 w-10 mb-3 opacity-40" />
                <p>No active sessions.</p>
                <p className="text-sm">Create one to start pairing!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeSessions.map((session) => (
                <ActiveSessionCard
                  key={session.id}
                  session={session}
                  userId={userId}
                  onComplete={handleComplete}
                  completing={completing === session.id}
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-headline-sm mb-4 flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Session History
          </h2>
          {historySessions.length === 0 ? (
            <Card className="border-border bg-card">
              <CardContent className="p-8 text-center text-muted-foreground">
                <Clock className="mx-auto h-10 w-10 mb-3 opacity-40" />
                <p>No completed sessions yet.</p>
                <p className="text-sm">Your pairing history will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {historySessions.slice(0, 20).map((session) => (
                <Card key={session.id} className="border-border bg-card">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">
                          {session.partner_name || session.partner_id || "Unknown Partner"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {session.duration_minutes} min session
                        </p>
                        {session.completed_at && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(session.completed_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]"
                        >
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Completed
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          +5 pts
                        </Badge>
                      </div>
                    </div>
                    {session.problem_link && (
                      <a
                        href={session.problem_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Problem Link
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Find a Partner</DialogTitle>
            <DialogDescription>
              Create a pairing session and wait for a partner to join. You can practice together on
              any coding problem.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Problem Link (optional)</label>
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <Input
                  placeholder="https://leetcode.com/problems/..."
                  value={problemLink}
                  onChange={(e) => setProblemLink(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Duration</label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {DURATIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? "Creating..." : "Create Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ActiveSessionCard({
  session,
  userId,
  onComplete,
  completing,
}: {
  session: PairSession;
  userId: string;
  onComplete: (s: PairSession) => void;
  completing: boolean;
}) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (session.status !== "matched" || !session.started_at) return;

    const totalSeconds = (session.duration_minutes || 30) * 60;
    const startedAt = new Date(session.started_at).getTime();

    function tick() {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const remaining = Math.max(0, totalSeconds - elapsed);
      setTimeLeft(remaining);
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [session.status, session.started_at, session.duration_minutes]);

  const isWaiting = session.status === "waiting";
  const isMatched = session.status === "matched";
  const mySession = session.user_id === userId;

  return (
    <Card className="border-border bg-card">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={
                  isWaiting
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]"
                }
              >
                {isWaiting ? "Waiting" : "Matched"}
              </Badge>
              <span className="text-xs text-muted-foreground">{session.duration_minutes} min</span>
            </div>

            {isMatched && (
              <div className="mt-2">
                <p className="text-sm font-medium">
                  Partner:{" "}
                  {mySession
                    ? session.partner_name || session.partner_id
                    : session.user_name || session.user_id}
                </p>
                {session.problem_link && (
                  <a
                    href={session.problem_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Problem Link
                  </a>
                )}
              </div>
            )}

            {isWaiting && (
              <p className="mt-2 text-sm text-muted-foreground">Waiting for a partner to join...</p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            {isMatched && timeLeft !== null && (
              <div className="text-right">
                <div className="flex items-center gap-1 text-2xl font-mono font-bold tabular-nums">
                  <Clock className="h-5 w-5 text-primary" />
                  {formatTimeLeft(timeLeft)}
                </div>
                {timeLeft === 0 && <p className="text-xs text-red-400 mt-1">Time is up!</p>}
              </div>
            )}

            {isMatched && (
              <Button size="sm" onClick={() => onComplete(session)} disabled={completing}>
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                {completing ? "Completing..." : "Complete Session"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface PairSession {
  id: string;
  user_id: string;
  partner_id: string | null;
  user_name?: string;
  partner_name?: string;
  status: string;
  problem_link: string | null;
  duration_minutes: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}
