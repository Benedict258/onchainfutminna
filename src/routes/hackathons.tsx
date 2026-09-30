import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Trophy, Users, Calendar, DollarSign, Plus, ArrowRight, User, Clock } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { apiQueryAll, apiInsert } from "@/lib/api-client";

export const Route = createFileRoute("/hackathons")({
  head: () => ({
    meta: [
      { title: "Hackathon Teams | BlockchainClub FUTMinna" },
      { name: "description", content: "Join or create hackathon teams." },
    ],
  }),
  component: HackathonsPage,
});

const TEAM_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  forming: { label: "Forming", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  building: { label: "Building", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  submitted: {
    label: "Submitted",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  won: { label: "Won", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
};

function HackathonsSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
      <Skeleton className="h-8 w-56" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function HackathonsPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  if (!isAuthenticated) return <LoginPrompt />;

  return <HackathonsPageContent userId={user!.id} />;
}

function HackathonsPageContent({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [selectedHackathon, setSelectedHackathon] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [creating, setCreating] = useState(false);

  const { data: hackathons, isLoading: loadingHackathons } = useQuery({
    queryKey: ["hackathons-active"],
    queryFn: async () => {
      const rows = await apiQueryAll("opportunities", {
        filters: { type: "HACKATHON" },
        order: { column: "created_at", ascending: false },
        limit: 20,
      });
      return (rows || []) as Hackathon[];
    },
  });

  const { data: myTeams, isLoading: loadingTeams } = useQuery({
    queryKey: ["hackathon-teams", userId],
    queryFn: async () => {
      const memberRows = await apiQueryAll("hackathon_team_members", {
        filters: { user_id: userId },
      });
      const members = (memberRows || []) as TeamMember[];
      const teamIds = members.map((m) => m.team_id);
      if (teamIds.length === 0) return [];
      const teamRows = await apiQueryAll("hackathon_teams", {
        filters: { id: { in: teamIds } },
      });
      return (teamRows || []) as HackathonTeam[];
    },
  });

  async function handleCreateTeam() {
    if (!teamName.trim() || !selectedHackathon) {
      toast.error("Team name and hackathon are required.");
      return;
    }
    setCreating(true);
    try {
      const result = await apiInsert("hackathon_teams", {
        name: teamName.trim(),
        hackathon_id: selectedHackathon,
        captain_id: userId,
        project_description: projectDesc.trim() || null,
        status: "forming",
      });
      const teamId = result.data?.id || result.data?.[0]?.id;
      if (teamId) {
        await apiInsert("hackathon_team_members", {
          team_id: teamId,
          user_id: userId,
          role: "captain",
        });
      }
      toast.success("Team created!");
      queryClient.invalidateQueries({ queryKey: ["hackathon-teams", userId] });
      setShowCreate(false);
      setTeamName("");
      setSelectedHackathon("");
      setProjectDesc("");
    } catch (e: any) {
      toast.error(e.message || "Failed to create team");
    } finally {
      setCreating(false);
    }
  }

  const isLoading = loadingHackathons || loadingTeams;

  if (isLoading) return <HackathonsSkeleton />;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-2">
        <h1 className="text-display-sm md:text-display-md tracking-tight">Hackathon Teams</h1>
        <p className="mt-2 text-muted-foreground">
          Join or create a team and compete in upcoming hackathons.
        </p>
      </div>

      <div className="flex items-center gap-3 mb-8">
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Team
        </Button>
      </div>

      <section className="mb-12">
        <h2 className="text-headline-sm mb-4 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Active Hackathons
        </h2>
        {hackathons && hackathons.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {hackathons.map((h) => (
              <Card
                key={h.id}
                className="border-border bg-card hover:border-primary/40 transition-all hover:-translate-y-0.5"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{h.title}</CardTitle>
                  </div>
                  {h.organizer && <p className="text-xs text-muted-foreground">by {h.organizer}</p>}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {h.deadline && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(h.deadline).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    )}
                    {h.prize && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {h.prize}
                      </span>
                    )}
                  </div>
                  {h.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{h.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-border bg-card">
            <CardContent className="p-8 text-center text-muted-foreground">
              <Trophy className="mx-auto h-10 w-10 mb-3 opacity-40" />
              <p>No active hackathons right now.</p>
              <p className="text-sm">Check back soon!</p>
            </CardContent>
          </Card>
        )}
      </section>

      <section>
        <h2 className="text-headline-sm mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          My Teams
        </h2>
        {myTeams && myTeams.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {myTeams.map((team) => {
              const statusConfig = TEAM_STATUS_CONFIG[team.status] || TEAM_STATUS_CONFIG.forming;
              return (
                <Link
                  key={team.id}
                  to="/hackathons/$teamId"
                  params={{ teamId: team.id }}
                  className="group"
                >
                  <Card className="border-border bg-card h-full transition-all hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-sm">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                          {team.name}
                        </h3>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${statusConfig.className}`}
                        >
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <div className="space-y-2 text-xs text-muted-foreground">
                        <p className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5" />
                          Captain: {team.captain_name || team.captain_id || "You"}
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          {team.member_count ?? "?"} members
                        </p>
                        {team.hackathon_name && (
                          <p className="flex items-center gap-1.5">
                            <Trophy className="h-3.5 w-3.5" />
                            {team.hackathon_name}
                          </p>
                        )}
                      </div>
                      <div className="mt-4 flex items-center text-xs text-primary">
                        View Details <ArrowRight className="ml-1 h-3 w-3" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <Card className="border-border bg-card">
            <CardContent className="p-8 text-center text-muted-foreground">
              <Users className="mx-auto h-10 w-10 mb-3 opacity-40" />
              <p>You are not in any teams yet.</p>
              <p className="text-sm">Create a team or ask to join one!</p>
            </CardContent>
          </Card>
        )}
      </section>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a Hackathon Team</DialogTitle>
            <DialogDescription>
              Form a team for an upcoming hackathon. You will be the team captain.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Team Name</label>
              <Input
                placeholder="e.g. ChainBreakers"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Hackathon</label>
              <Select value={selectedHackathon} onValueChange={setSelectedHackathon}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a hackathon" />
                </SelectTrigger>
                <SelectContent>
                  {(hackathons || []).map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Project Description</label>
              <Textarea
                placeholder="Describe your project idea..."
                rows={3}
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTeam} disabled={creating}>
              {creating ? "Creating..." : "Create Team"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface Hackathon {
  id: string;
  title: string;
  description?: string;
  organizer?: string;
  deadline?: string;
  prize?: string;
  created_at: string;
}

interface HackathonTeam {
  id: string;
  name: string;
  hackathon_id: string;
  hackathon_name?: string;
  captain_id: string;
  captain_name?: string;
  project_description?: string;
  repo_link?: string;
  demo_link?: string;
  status: string;
  member_count?: number;
}

interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
}
