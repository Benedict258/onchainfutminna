import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { apiQuery, apiInsert, apiUpdate, apiDelete } from "@/lib/api-client";
import { BADGE_CONFIG } from "@/lib/badges";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Mail,
  ExternalLink,
  Trophy,
  BookOpen,
  Activity,
  Award,
  Star,
  Footprints,
  Flame,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Check,
  X,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/students/$userId")({
  component: StudentDrillDown,
});

type TabKey = "overview" | "curriculum" | "devlog" | "badges" | "activity";

const TAB_ITEMS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "overview", label: "Overview", icon: Activity },
  { key: "curriculum", label: "Curriculum", icon: BookOpen },
  { key: "devlog", label: "DEVLOG", icon: Footprints },
  { key: "badges", label: "Badges &amp; Certs", icon: Award },
  { key: "activity", label: "Activity Log", icon: Clock },
];

const LEVEL_THRESHOLDS = [
  { level: 1, label: "Level 1: Explorer", min: 0 },
  { level: 2, label: "Level 2: Builder", min: 100 },
  { level: 3, label: "Level 3: Contributor", min: 250 },
  { level: 4, label: "Level 4: Architect", min: 500 },
  { level: 5, label: "Level 5: Legend", min: 1000 },
];

const GATE_STATUS_COLORS: Record<string, string> = {
  passed: "bg-green-500/20 text-green-400 border-green-500/30",
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  failed: "bg-red-500/20 text-red-400 border-red-500/30",
  not_started: "bg-muted text-muted-foreground border-border",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getLevelInfo(points: number) {
  let current = LEVEL_THRESHOLDS[0];
  let next = LEVEL_THRESHOLDS[1];
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i].min) {
      current = LEVEL_THRESHOLDS[i];
      next = LEVEL_THRESHOLDS[i + 1] || null;
      break;
    }
  }
  const progress = next
    ? Math.round(((points - current.min) / (next.min - current.min)) * 100)
    : 100;
  return { label: current.label, level: current.level, nextMin: next?.min || null, progress };
}

function getGateBadgeClass(status: string): string {
  if (status === "passed") return GATE_STATUS_COLORS.passed;
  if (status === "pending") return GATE_STATUS_COLORS.pending;
  if (status === "failed") return GATE_STATUS_COLORS.failed;
  return GATE_STATUS_COLORS.not_started;
}

function getGateLabel(status: string): string {
  if (status === "passed") return "Passed";
  if (status === "pending") return "Pending";
  if (status === "failed") return "Failed";
  return "Not Started";
}

function StudentDrillDown() {
  const { userId } = Route.useParams();
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [gateDialogOpen, setGateDialogOpen] = useState(false);
  const [gateDialogGate, setGateDialogGate] = useState<number>(1);
  const [gateDialogStatus, setGateDialogStatus] = useState<string>("pending");
  const [gateDialogNote, setGateDialogNote] = useState<string>("");
  const [badgeDialogOpen, setBadgeDialogOpen] = useState(false);

  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["admin-student", userId],
    queryFn: async () => {
      const res = await apiQuery("users", {
        select: "id,email,role,is_active,created_at",
        filters: { id: userId },
        single: true,
      });
      return res.data as Record<string, unknown> | null;
    },
    enabled: !!userId && !!accessToken,
  });

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["admin-student-profile", userId],
    queryFn: async () => {
      const res = await apiQuery("profiles", {
        select:
          "user_id,full_name,avatar_url,username,department,level,experience_level,bio,github_link,twitter_link,portfolio_link",
        filters: { user_id: userId },
        single: true,
      });
      return res.data as Record<string, unknown> | null;
    },
    enabled: !!userId && !!accessToken,
  });

  const { data: leaderboardData } = useQuery({
    queryKey: ["admin-student-leaderboard", userId],
    queryFn: async () => {
      const res = await apiQuery("leaderboard_entries", {
        select: "total_points,event_points,learn_points,build_points,community_points",
        filters: { user_id: userId },
        single: true,
      });
      return (res.data || null) as Record<string, unknown> | null;
    },
    enabled: !!userId && !!accessToken,
  });

  const { data: progressData } = useQuery({
    queryKey: ["admin-student-mods", userId],
    queryFn: async () => {
      const res = await apiQuery("user_module_progress", {
        select: "module_id,completed_at,points_earned",
        filters: { user_id: userId },
        order: { column: "completed_at", ascending: false },
      });
      return (res.data || []) as Record<string, unknown>[];
    },
    enabled: !!userId && !!accessToken,
  });

  const { data: badgesData } = useQuery({
    queryKey: ["admin-student-badges", userId],
    queryFn: async () => {
      const res = await apiQuery("user_badges", {
        select: "badge_id,created_at",
        filters: { user_id: userId },
      });
      return (res.data || []) as Record<string, unknown>[];
    },
    enabled: !!userId && !!accessToken,
  });

  const { data: gateChecksData } = useQuery({
    queryKey: ["admin-student-gates", userId],
    queryFn: async () => {
      const res = await apiQuery("gate_checks", {
        select: "id,gate_number,status,admin_notes,checked_at,admin_id",
        filters: { user_id: userId },
        order: { column: "gate_number", ascending: true },
      });
      return (res.data || []) as Record<string, unknown>[];
    },
    enabled: !!userId && !!accessToken,
  });

  const { data: eventsData } = useQuery({
    queryKey: ["admin-student-events", userId],
    queryFn: async () => {
      const res = await apiQuery("event_rsvps", {
        select: "id,event_id,attended,created_at,events(title,start_date)",
        filters: { user_id: userId },
        order: { column: "created_at", ascending: false },
        limit: 10,
      });
      return (res.data || []) as Record<string, unknown>[];
    },
    enabled: !!userId && !!accessToken,
  });

  const { data: tracksData } = useQuery({
    queryKey: ["admin-student-tracks-list"],
    queryFn: async () => {
      const res = await apiQuery("tracks", {
        select: "id,title,ecosystem,difficulty",
        filters: { is_published: true },
      });
      return (res.data || []) as Record<string, unknown>[];
    },
    enabled: !!accessToken,
  });

  const { data: modulesData } = useQuery({
    queryKey: ["admin-student-modules-list"],
    queryFn: async () => {
      const res = await apiQuery("modules", {
        select: "id,title,track_id,phase,order",
        order: { column: "order", ascending: true },
      });
      return (res.data || []) as Record<string, unknown>[];
    },
    enabled: !!accessToken,
  });

  const isLoading = userLoading || profileLoading;

  const gateUpdateMutation = useMutation({
    mutationFn: (params: { gateNumber: number; status: string; notes: string }) => {
      const existing = (gateChecksData || []).find(
        (g) => (g.gate_number as number) === params.gateNumber,
      );
      if (existing) {
        return apiUpdate(
          "gate_checks",
          {
            status: params.status,
            admin_notes: params.notes || undefined,
            checked_at: new Date().toISOString(),
          },
          { id: existing.id },
        );
      }
      return apiInsert("gate_checks", {
        user_id: userId,
        gate_number: params.gateNumber,
        status: params.status,
        admin_notes: params.notes || undefined,
        checked_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-student-gates", userId] });
      setGateDialogOpen(false);
      toast.success("Gate status updated");
    },
    onError: () => toast.error("Failed to update gate status"),
  });

  const grantBadgeMutation = useMutation({
    mutationFn: (badgeId: string) =>
      apiInsert("user_badges", { user_id: userId, badge_id: badgeId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-student-badges", userId] });
      toast.success("Badge awarded");
    },
    onError: () => toast.error("Failed to award badge"),
  });

  const revokeBadgeMutation = useMutation({
    mutationFn: (badgeId: string) =>
      apiDelete("user_badges", { user_id: userId, badge_id: badgeId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-student-badges", userId] });
      toast.success("Badge revoked");
    },
    onError: () => toast.error("Failed to revoke badge"),
  });

  const fullName = (profileData?.full_name as string) || "Unknown";
  const email = (userData?.email as string) || "";
  const username = (profileData?.username as string) || "";
  const avatarUrl = (profileData?.avatar_url as string) || "";
  const totalPoints = (leaderboardData?.total_points as number) || 0;
  const eventPoints = (leaderboardData?.event_points as number) || 0;
  const learnPoints = (leaderboardData?.learn_points as number) || 0;
  const buildPoints = (leaderboardData?.build_points as number) || 0;
  const communityPoints = (leaderboardData?.community_points as number) || 0;
  const levelInfo = getLevelInfo(totalPoints);

  const completedModuleIds = new Set((progressData || []).map((p) => p.module_id as string));
  const earnedBadgeIds = new Set((badgesData || []).map((b) => b.badge_id as string));
  const gateChecks = gateChecksData || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="flex items-center gap-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!userData || !profileData) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link to="/admin/students">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Students
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Student not found</AlertTitle>
          <AlertDescription>The requested student could not be found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link to="/admin/students">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Students
          </Link>
        </Button>
      </div>

      {/* Student Info Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <Avatar className="h-20 w-20">
          <AvatarImage src={avatarUrl} alt={fullName} />
          <AvatarFallback className="text-xl">{getInitials(fullName)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <h1 className="text-headline-lg">{fullName}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" />
              {email}
            </span>
            {username && <span>@{username}</span>}
            <span className="flex items-center gap-1">
              <ExternalLink className="h-3.5 w-3.5" />
              {(profileData?.department as string) || "N/A"} /{" "}
              {(profileData?.level as string) || "N/A"}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Edit Profile
          </Button>
          <Button variant="outline" size="sm">
            Reset Password
          </Button>
        </div>
      </div>

      {/* Points Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            <div className="text-center">
              <p className="text-2xl font-bold font-mono">{totalPoints}</p>
              <p className="text-xs text-muted-foreground">Total Points</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold font-mono text-blue-400">{learnPoints}</p>
              <p className="text-xs text-muted-foreground">Learn</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold font-mono text-purple-400">{buildPoints}</p>
              <p className="text-xs text-muted-foreground">Build</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold font-mono text-green-400">{eventPoints}</p>
              <p className="text-xs text-muted-foreground">Events</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold font-mono text-amber-400">{communityPoints}</p>
              <p className="text-xs text-muted-foreground">Community</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border pb-0">
        {TAB_ITEMS.map((tab) => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.key}
              variant="ghost"
              size="sm"
              className={`rounded-b-none ${activeTab === tab.key ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <Icon className="mr-2 h-4 w-4" />
              <span
                dangerouslySetInnerHTML={{
                  __html: tab.label,
                }}
              />
            </Button>
          );
        })}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Current Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    <span className="text-lg font-semibold">{levelInfo.label}</span>
                  </div>
                  {levelInfo.nextMin !== null && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{totalPoints} pts</span>
                        <span>{levelInfo.nextMin} pts</span>
                      </div>
                      <Progress value={levelInfo.progress} className="h-2" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Track &amp; Phase
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-sm">
                    {(profileData?.department as string) || "N/A"}
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    {(profileData?.level as string) || "N/A"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Gate Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                {[1, 2, 3].map((gateNum) => {
                  const check = gateChecks.find((g) => (g.gate_number as number) === gateNum);
                  const status = (check?.status as string) || "not_started";
                  return (
                    <div
                      key={gateNum}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Gate {gateNum}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getGateBadgeClass(status)}>{getGateLabel(status)}</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            setGateDialogGate(gateNum);
                            setGateDialogStatus(status !== "not_started" ? status : "pending");
                            setGateDialogNote((check?.admin_notes as string) || "");
                            setGateDialogOpen(true);
                          }}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Streaks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <Flame className="h-5 w-5 text-orange-400" />
                  <div>
                    <p className="text-lg font-bold font-mono">0</p>
                    <p className="text-xs text-muted-foreground">PR Streak</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <Footprints className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="text-lg font-bold font-mono">0</p>
                    <p className="text-xs text-muted-foreground">DEVLOG Streak</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <Activity className="h-5 w-5 text-green-400" />
                  <div>
                    <p className="text-lg font-bold font-mono">0</p>
                    <p className="text-xs text-muted-foreground">Session Streak</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {eventsData && eventsData.length > 0 ? (
                <div className="space-y-3">
                  {eventsData.slice(0, 10).map((rsvp: Record<string, unknown>) => {
                    const event = rsvp.events as Record<string, unknown> | undefined;
                    return (
                      <div
                        key={rsvp.id as string}
                        className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {(event?.title as string) || "Event"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {rsvp.attended ? "Attended" : "RSVPed"}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {event?.start_date
                            ? new Date(event.start_date as string).toLocaleDateString()
                            : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 2: Curriculum */}
      {activeTab === "curriculum" && (
        <div className="space-y-6">
          {tracksData && tracksData.length > 0 ? (
            tracksData.map((track) => {
              const trackId = track.id as string;
              const trackModules = (modulesData || []).filter((m) => m.track_id === trackId);
              const completedInTrack = trackModules.filter((m) =>
                completedModuleIds.has(m.id as string),
              ).length;
              const totalInTrack = trackModules.length;
              const progressPct =
                totalInTrack > 0 ? Math.round((completedInTrack / totalInTrack) * 100) : 0;

              return (
                <Card key={trackId}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{track.title as string}</CardTitle>
                        <CardDescription>
                          {track.ecosystem as string} &middot; {track.difficulty as string}
                        </CardDescription>
                      </div>
                      <Badge variant={progressPct === 100 ? "default" : "secondary"}>
                        {completedInTrack}/{totalInTrack}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Progress value={progressPct} className="h-2 mb-3" />
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                      {trackModules.map((mod) => {
                        const modId = mod.id as string;
                        const isDone = completedModuleIds.has(modId);
                        return (
                          <div
                            key={modId}
                            title={mod.title as string}
                            className={`flex items-center justify-center rounded-md p-2 text-xs font-medium text-center h-10 transition-colors ${
                              isDone
                                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                : "bg-muted text-muted-foreground border border-border"
                            }`}
                          >
                            {isDone ? <CheckCircle2 className="h-3 w-3 mr-1" /> : null}
                            {(mod.phase as string) || "M"}
                            {(mod.order as number) || ""}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No tracks available
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Gate Check Details</CardTitle>
              <CardDescription>Admin review and status override</CardDescription>
            </CardHeader>
            <CardContent>
              {gateChecks.length > 0 ? (
                <div className="space-y-3">
                  {gateChecks.map((check) => (
                    <div
                      key={check.id as string}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">Gate {check.gate_number as number}</p>
                        <p className="text-xs text-muted-foreground">
                          {(check.admin_notes as string) || "No admin notes"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getGateBadgeClass(check.status as string)}>
                          {getGateLabel(check.status as string)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setGateDialogGate(check.gate_number as number);
                            setGateDialogStatus(check.status as string);
                            setGateDialogNote((check.admin_notes as string) || "");
                            setGateDialogOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No gate checks recorded
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 3: DEVLOG */}
      {activeTab === "devlog" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">DEVLOG Entries</CardTitle>
                  <CardDescription>All published and draft entries</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-400" />
                  <span className="text-sm font-mono">0 day streak</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-8">
                No DEVLOG entries yet
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 4: Badges & Certs */}
      {activeTab === "badges" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-headline-md">Badges Earned</h2>
              <p className="text-sm text-muted-foreground">
                {badgesData?.length || 0} badge{(badgesData?.length || 0) !== 1 ? "s" : ""} earned
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setBadgeDialogOpen(true)}>
              <Award className="mr-2 h-4 w-4" />
              Award Badge
            </Button>
          </div>

          {badgesData && badgesData.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {badgesData.map((b) => {
                const badgeId = b.badge_id as string;
                const config = BADGE_CONFIG[badgeId];
                if (!config) return null;
                const Icon = config.icon;
                return (
                  <div
                    key={badgeId}
                    className="flex items-center justify-between rounded-lg border border-border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-md ${config.bgColor}`}
                      >
                        <Icon className={`h-5 w-5 ${config.color}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{config.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {b.created_at
                            ? new Date(b.created_at as string).toLocaleDateString()
                            : ""}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => revokeBadgeMutation.mutate(badgeId)}
                      disabled={revokeBadgeMutation.isPending}
                    >
                      {revokeBadgeMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No badges earned yet
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Certificates</CardTitle>
              <CardDescription>Issued certificates and SBT records</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-4">
                No certificates issued yet
              </p>
            </CardContent>
          </Card>

          <Dialog open={badgeDialogOpen} onOpenChange={setBadgeDialogOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Award Badge</DialogTitle>
                <DialogDescription>Select a badge to award to {fullName}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {Object.entries(BADGE_CONFIG).map(([badgeId, config]) => {
                  const isGranted = earnedBadgeIds.has(badgeId);
                  const Icon = config.icon;
                  return (
                    <div
                      key={badgeId}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-md ${config.bgColor}`}
                        >
                          <Icon className={`h-4 w-4 ${config.color}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{config.label}</p>
                          <p className="text-xs text-muted-foreground">{config.description}</p>
                        </div>
                      </div>
                      <Button
                        variant={isGranted ? "destructive" : "default"}
                        size="sm"
                        onClick={() => {
                          if (isGranted) {
                            revokeBadgeMutation.mutate(badgeId);
                          } else {
                            grantBadgeMutation.mutate(badgeId);
                          }
                        }}
                        disabled={grantBadgeMutation.isPending || revokeBadgeMutation.isPending}
                      >
                        {isGranted ? (
                          <>
                            <X className="mr-1 h-3 w-3" />
                            Revoke
                          </>
                        ) : (
                          <>
                            <Check className="mr-1 h-3 w-3" />
                            Grant
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Tab 5: Activity Log */}
      {activeTab === "activity" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Point History</CardTitle>
              <CardDescription>Recent point awards and adjustments</CardDescription>
            </CardHeader>
            <CardContent>
              {progressData && progressData.length > 0 ? (
                <div className="space-y-3">
                  {progressData.slice(0, 20).map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between border-b border-border pb-2 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="text-sm">
                          Module completed (+{p.points_earned as number} learn pts)
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Module ID: {p.module_id as string}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {(p.completed_at as string)
                          ? new Date(p.completed_at as string).toLocaleDateString()
                          : ""}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No point history recorded
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Login History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-4">
                Member since{" "}
                {userData?.created_at
                  ? new Date(userData.created_at as string).toLocaleDateString()
                  : "unknown"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Module Completions</CardTitle>
              <CardDescription>{(progressData || []).length} modules completed</CardDescription>
            </CardHeader>
            <CardContent>
              {progressData && progressData.length > 0 ? (
                <div className="space-y-2">
                  {progressData.slice(0, 20).map((p, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="font-mono text-muted-foreground">
                        {p.module_id as string}
                      </span>
                      <span className="text-muted-foreground">
                        {p.completed_at ? new Date(p.completed_at as string).toLocaleString() : ""}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No modules completed yet
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Gate Check History</CardTitle>
            </CardHeader>
            <CardContent>
              {gateChecks.length > 0 ? (
                <div className="space-y-2">
                  {gateChecks.map((check) => (
                    <div
                      key={check.id as string}
                      className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0 last:pb-0"
                    >
                      <div>
                        <span className="font-medium">Gate {check.gate_number as number}</span>
                        <span className="mx-2 text-muted-foreground">&rarr;</span>
                        <Badge className={getGateBadgeClass(check.status as string)}>
                          {getGateLabel(check.status as string)}
                        </Badge>
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {check.checked_at
                          ? new Date(check.checked_at as string).toLocaleString()
                          : ""}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No gate check history
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gate Override Dialog */}
      <Dialog open={gateDialogOpen} onOpenChange={setGateDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Gate {gateDialogGate} Status</DialogTitle>
            <DialogDescription>Override the gate check status for {fullName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Status</Label>
              <Select value={gateDialogStatus} onValueChange={setGateDialogStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="passed">Passed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Admin Notes</Label>
              <Input
                value={gateDialogNote}
                onChange={(e) => setGateDialogNote(e.target.value)}
                placeholder="Optional admin notes..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setGateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() =>
                  gateUpdateMutation.mutate({
                    gateNumber: gateDialogGate,
                    status: gateDialogStatus,
                    notes: gateDialogNote,
                  })
                }
                disabled={gateUpdateMutation.isPending}
              >
                {gateUpdateMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Update
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
