import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiInsert } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import {
  ArrowLeft,
  Swords,
  Code,
  Users,
  Zap,
  Flag,
  Palette,
  FileText,
  Search,
  Timer,
  Plus,
  Info,
} from "lucide-react";
import { toast } from "sonner";

type ChallengeType =
  "CODE_DUEL" | "OPEN" | "TEAM_CLASH" | "CTF" | "DESIGN" | "CONTENT" | "RESEARCH" | "SPEED";

const TYPE_INFO: Record<ChallengeType, { label: string; icon: React.ReactNode; desc: string }> = {
  CODE_DUEL: {
    label: "Code Duel",
    icon: <Code className="h-4 w-4" />,
    desc: "1v1 coding battle with automated testing and time limits",
  },
  OPEN: {
    label: "Open Challenge",
    icon: <Zap className="h-4 w-4" />,
    desc: "Community-voted challenge. Submit any work and let the community decide",
  },
  TEAM_CLASH: {
    label: "Team Clash",
    icon: <Users className="h-4 w-4" />,
    desc: "Team-based competition. Form squads and compete together",
  },
  CTF: {
    label: "CTF",
    icon: <Flag className="h-4 w-4" />,
    desc: "Capture The Flag. Solve security challenges and capture flags",
  },
  DESIGN: {
    label: "Design Challenge",
    icon: <Palette className="h-4 w-4" />,
    desc: "UI/UX and graphic design battles. Best design wins community vote",
  },
  CONTENT: {
    label: "Content Clash",
    icon: <FileText className="h-4 w-4" />,
    desc: "Writing and content creation challenge. Best article/thread wins",
  },
  RESEARCH: {
    label: "Research Sprint",
    icon: <Search className="h-4 w-4" />,
    desc: "Deep-dive research on blockchain topics. Best findings win",
  },
  SPEED: {
    label: "Speed Sprint",
    icon: <Timer className="h-4 w-4" />,
    desc: "Rapid-fire coding sprints with tight time constraints",
  },
};

export const Route = createFileRoute("/arena/create")({
  head: () => ({
    meta: [
      { title: "Create Challenge | BlockchainClub FUTMinna" },
      {
        name: "description",
        content: "Create a new challenge for the Blockchain Club arena.",
      },
    ],
  }),
  component: CreateChallengePage,
});

function CreateChallengePage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [type, setType] = useState<ChallengeType>("CODE_DUEL");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("10");
  const [stakePoints, setStakePoints] = useState(10);
  const [isPublic, setIsPublic] = useState(true);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const formErrors = {
    title: touched.title && !title.trim() ? "Title is required" : "",
    description: touched.description && !description.trim() ? "Description is required" : "",
    startTime: touched.startTime && !startTime ? "Start time is required" : "",
    endTime: touched.endTime && !endTime ? "End time is required" : "",
  };

  const isFormValid =
    !!title.trim() &&
    !!description.trim() &&
    !!startTime &&
    !!endTime &&
    new Date(endTime) > new Date(startTime);

  const createMutation = useMutation({
    mutationFn: async () => {
      const status = !isPublic || stakePoints === 0 ? "active" : "pending";

      return apiInsert("challenges", {
        type,
        title: title.trim(),
        description: description.trim(),
        rules: rules.trim() || undefined,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        max_participants: maxParticipants ? parseInt(maxParticipants) : undefined,
        stake_points: stakePoints,
        is_public: isPublic,
        status,
        creator_id: user?.id,
      });
    },
    onSuccess: (data: any) => {
      const challenge = Array.isArray(data?.data) ? data.data[0] : data?.data;
      toast.success(
        challenge?.status === "pending"
          ? "Challenge created! Awaiting admin approval."
          : "Challenge is now live!",
      );
      router.navigate({
        to: "/arena/$challengeId",
        params: { challengeId: challenge?.id || "" },
      });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to create challenge");
    },
  });

  if (!user) {
    return (
      <div className="bg-background">
        <div className="mx-auto max-w-2xl px-6 py-16 text-center">
          <Swords className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h1 className="mt-6 text-headline-lg">Login Required</h1>
          <p className="mt-3 text-muted-foreground">
            You need to be logged in to create a challenge.
          </p>
          <Button asChild className="mt-6">
            <a href="/auth">Login</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Button variant="ghost" className="mb-6 -ml-2" onClick={() => router.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Arena
        </Button>

        <div className="mb-8">
          <h1 className="text-headline-xl md:text-display-md tracking-tight">Create Challenge</h1>
          <p className="mt-3 text-muted-foreground">
            Set up a new challenge for the community. Stake points to make it competitive or keep it
            free for everyone.
          </p>
        </div>

        {/* TYPE SELECTION */}
        <div className="mb-8">
          <Label className="text-sm font-semibold mb-3 block">Challenge Type</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(
              Object.entries(TYPE_INFO) as [ChallengeType, (typeof TYPE_INFO)[ChallengeType]][]
            ).map(([key, info]) => (
              <button
                key={key}
                type="button"
                onClick={() => setType(key)}
                className={`flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-all cursor-pointer ${
                  type === key
                    ? "border-primary bg-primary/10 ring-1 ring-primary"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <span className={`${type === key ? "text-primary" : "text-muted-foreground"}`}>
                  {info.icon}
                </span>
                <span className={`text-xs font-semibold ${type === key ? "text-primary" : ""}`}>
                  {info.label}
                </span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{TYPE_INFO[type].desc}</p>
        </div>

        {/* FORM */}
        <Card className="border-border bg-card">
          <CardContent className="p-6 space-y-6">
            <div>
              <Label>Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => setTouched({ ...touched, title: true })}
                placeholder="e.g. Solidity Gas Golf Challenge"
                className={formErrors.title ? "border-destructive" : ""}
              />
              {formErrors.title && (
                <p className="text-xs text-destructive mt-1">{formErrors.title}</p>
              )}
            </div>

            <div>
              <Label>Description *</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => setTouched({ ...touched, description: true })}
                placeholder="Describe the challenge, what participants need to do, and what makes a winning submission"
                rows={3}
                className={formErrors.description ? "border-destructive" : ""}
              />
              {formErrors.description && (
                <p className="text-xs text-destructive mt-1">{formErrors.description}</p>
              )}
            </div>

            <div>
              <Label>Rules (Markdown supported)</Label>
              <Textarea
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                placeholder="1. Fork the repo&#10;2. Solve the problem&#10;3. Submit your PR link&#10;4. Winner decided by test coverage + gas efficiency"
                rows={5}
                className="font-mono text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Time *</Label>
                <Input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  onBlur={() => setTouched({ ...touched, startTime: true })}
                  className={formErrors.startTime ? "border-destructive" : ""}
                />
                {formErrors.startTime && (
                  <p className="text-xs text-destructive mt-1">{formErrors.startTime}</p>
                )}
              </div>
              <div>
                <Label>End Time *</Label>
                <Input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  onBlur={() => setTouched({ ...touched, endTime: true })}
                  className={formErrors.endTime ? "border-destructive" : ""}
                />
                {formErrors.endTime && (
                  <p className="text-xs text-destructive mt-1">{formErrors.endTime}</p>
                )}
              </div>
            </div>

            {startTime && endTime && new Date(endTime) <= new Date(startTime) && (
              <p className="text-xs text-destructive">End time must be after start time.</p>
            )}

            <div>
              <Label>Max Participants</Label>
              <Input
                type="number"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                placeholder="Leave empty for unlimited"
                min="1"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Stake Points: {stakePoints}</Label>
                <span className="text-xs text-muted-foreground">5 – 50 pts</span>
              </div>
              <Slider
                value={[stakePoints]}
                onValueChange={([v]) => setStakePoints(v)}
                min={5}
                max={50}
                step={5}
                className="w-full"
              />
              <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" />
                Each participant stakes {stakePoints} points. Total pool = {stakePoints} �
                participants. Winner(s) split the pool.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
              <div>
                <Label className="cursor-pointer">Public Challenge</Label>
                <p className="text-xs text-muted-foreground">
                  {isPublic
                    ? "Anyone can discover and join this challenge."
                    : "Only people with the link can join."}
                </p>
              </div>
            </div>

            {isPublic && stakePoints > 0 && (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-3">
                <Info className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-400">Admin Approval Required</p>
                  <p className="text-xs text-amber-400/80 mt-1">
                    Public challenges with staked points need admin approval before going live.
                    No-stake challenges go live immediately.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => router.history.back()}>
                Cancel
              </Button>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!isFormValid || createMutation.isPending}
              >
                {createMutation.isPending
                  ? "Creating..."
                  : isPublic && stakePoints > 0
                    ? "Submit for Approval"
                    : "Create Challenge"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
