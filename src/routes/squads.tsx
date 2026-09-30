import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { apiQuery, apiInsert } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Users, Target } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/squads")({
  component: SquadsPage,
});

const TRACK_COLORS: Record<string, string> = {
  EVM: "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30",
  SUI_MOVE: "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30",
  APTOS_MOVE: "bg-teal-500/20 text-teal-400 hover:bg-teal-500/30",
  SOLANA_RUST: "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30",
  GENERAL: "bg-muted text-muted-foreground hover:bg-muted/80",
};

const TRACK_OPTIONS = ["EVM", "SUI_MOVE", "APTOS_MOVE", "SOLANA_RUST", "GENERAL"] as const;

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function SquadsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formTrack, setFormTrack] = useState("GENERAL");
  const [formGoal, setFormGoal] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: squads, isLoading } = useQuery({
    queryKey: ["squads"],
    queryFn: async () => {
      const res = await apiQuery("squads", {
        select: "id,name,description,track,goal,creator_id,created_at",
        order: { column: "created_at", ascending: false },
      });
      return (res.data || []) as Record<string, unknown>[];
    },
  });

  const { data: squadMembers } = useQuery({
    queryKey: ["squad-members-all"],
    queryFn: async () => {
      const res = await apiQuery("squad_members", {
        select: "id,squad_id,user_id",
      });
      return (res.data || []) as Record<string, unknown>[];
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["squad-member-profiles"],
    queryFn: async () => {
      const res = await apiQuery("profiles", {
        select: "user_id,full_name,avatar_url",
      });
      return (res.data || []) as Record<string, unknown>[];
    },
  });

  const memberCountMap = new Map<string, number>();
  const memberAvatarsMap = new Map<string, { name: string; avatarUrl: string }[]>();
  if (squadMembers && profiles) {
    const profileMap = new Map<string, Record<string, unknown>>();
    for (const p of profiles) {
      profileMap.set(p.user_id as string, p);
    }
    for (const sm of squadMembers) {
      const sid = sm.squad_id as string;
      const uid = sm.user_id as string;
      memberCountMap.set(sid, (memberCountMap.get(sid) || 0) + 1);
      if (!memberAvatarsMap.has(sid)) memberAvatarsMap.set(sid, []);
      const arr = memberAvatarsMap.get(sid)!;
      if (arr.length < 5) {
        const prof = profileMap.get(uid);
        arr.push({
          name: (prof?.full_name as string) || "",
          avatarUrl: (prof?.avatar_url as string) || "",
        });
      }
    }
  }

  const userMemberMap = new Map<string, boolean>();
  if (user && squadMembers) {
    for (const sm of squadMembers) {
      if (sm.user_id === user.id) {
        userMemberMap.set(sm.squad_id as string, true);
      }
    }
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Login required");
      const res = await apiInsert("squads", {
        name: formName,
        description: formDesc,
        track: formTrack,
        goal: formGoal,
        creator_id: user.id,
        created_at: new Date().toISOString(),
      });
      const squad = Array.isArray(res.data) ? res.data[0] : res.data;
      if (!squad?.id) throw new Error("Failed to create squad");
      await apiInsert("squad_members", {
        squad_id: squad.id,
        user_id: user.id,
        role: "creator",
        joined_at: new Date().toISOString(),
      });
      return squad;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["squads"] });
      queryClient.invalidateQueries({ queryKey: ["squad-members-all"] });
      setCreateOpen(false);
      setFormName("");
      setFormDesc("");
      setFormTrack("GENERAL");
      setFormGoal("");
      toast.success("Squad created!");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-lg">Study Squads</h1>
          <p className="text-muted-foreground">Join or create study squads to learn together</p>
        </div>
        {isAuthenticated && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Squad
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !squads || squads.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg">No squads yet</p>
          <p className="text-sm">Be the first to create a study squad!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {squads.map((s) => {
            const sid = s.id as string;
            const count = memberCountMap.get(sid) || 0;
            const avatars = memberAvatarsMap.get(sid) || [];
            const isMember = userMemberMap.get(sid) || false;

            return (
              <Card key={sid} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{(s.name as string) || "Untitled"}</CardTitle>
                    <Badge className={TRACK_COLORS[s.track as string] || TRACK_COLORS.GENERAL}>
                      {(s.track as string)?.replace("_", " ") || "General"}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {(s.description as string) || "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  {(s.goal as string) && (
                    <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
                      <Target className="h-4 w-4 mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{s.goal as string}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {count} member{count !== 1 ? "s" : ""}
                    </span>
                    {avatars.length > 0 && (
                      <div className="flex -space-x-2 ml-1">
                        {avatars.map((a, i) => (
                          <Avatar key={i} className="h-6 w-6 border-2 border-card">
                            {a.avatarUrl ? (
                              <AvatarImage src={a.avatarUrl} alt={a.name} />
                            ) : (
                              <AvatarFallback className="text-[10px]">
                                {getInitials(a.name || "?")}
                              </AvatarFallback>
                            )}
                          </Avatar>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    variant={isMember ? "outline" : "default"}
                    className="w-full"
                    onClick={() => navigate({ to: "/squads/$squadId", params: { squadId: sid } })}
                  >
                    {isMember ? "View Squad" : "View"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Squad</DialogTitle>
            <DialogDescription>Start a study squad to learn and build together.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Squad Name</Label>
              <Input
                id="name"
                placeholder="e.g. Solana Builders"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea
                id="desc"
                placeholder="What is this squad about?"
                rows={3}
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="track">Track</Label>
              <Select value={formTrack} onValueChange={setFormTrack}>
                <SelectTrigger id="track">
                  <SelectValue placeholder="Select track" />
                </SelectTrigger>
                <SelectContent>
                  {TRACK_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal">Goal</Label>
              <Textarea
                id="goal"
                placeholder="What do you want to achieve together?"
                rows={2}
                value={formGoal}
                onChange={(e) => setFormGoal(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!formName.trim() || submitting}
              onClick={() => {
                setSubmitting(true);
                createMutation.mutate(undefined, { onSettled: () => setSubmitting(false) });
              }}
            >
              Create Squad
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
